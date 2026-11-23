const express = require('express');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const session = require('express-session');
const {MongoStore} = require('connect-mongo');
const {Server} = require('socket.io');
const multer = require('multer');
const cors = require('cors');
const stylus = require('stylus');
const nib = require('nib');
const passport = require('./auth');
const controllers = require('./controllers');
const oauth2 = require('./oauth2');
const Client = require('./models/client');
const Account = require('./models/account');
const AccessToken = require('./models/accesstoken');
const inquiry = require('./lib/inquiry');
const mongoUrl=process.env.MONGODB_URI || process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017/sciencekit';
const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({limit:'15mb'}));
app.use(express.urlencoded({extended:true,limit:'15mb'}));
app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');
const sessionStore=MongoStore.create({mongoUrl});
app.use(session({secret:process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),resave:false,saveUninitialized:false,store:sessionStore,cookie:{httpOnly:true,sameSite:'lax'}}));
app.use(passport.initialize());
app.use(passport.session());
const uploadDir=path.join(__dirname,'public/uploads');
fs.mkdirSync(uploadDir,{recursive:true});
const mediaTypes={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','video/mp4':'.mp4','video/quicktime':'.mov','video/webm':'.webm'};
const upload=multer({fileFilter:(req,file,done)=> {
  const expected=req.path.endsWith('/photo') ? 'image/' : 'video/';
  if(!mediaTypes[file.mimetype] || !file.mimetype.startsWith(expected)) return done(Object.assign(new Error('Unsupported media type'),{status:415}));
  done(null,true);
},storage:multer.diskStorage({destination:uploadDir,filename:(req,file,done)=>done(null,crypto.randomUUID()+mediaTypes[file.mimetype])}),limits:{fileSize:100*1024*1024,files:1}});
app.use(stylus.middleware({src:path.join(__dirname,'public'),compile:(str,filename)=>stylus(str).set('filename',filename).use(nib())}));
app.use(express.static(path.join(__dirname,'public')));
const clientDir=process.env.CLIENT_DIR || path.resolve(__dirname,'../sciencekit-ios/www');
app.use('/app',express.static(clientDir));
app.get('/',(req,res)=>res.redirect(process.env.CLIENT_URL || '/app/'));
app.get('/health',(req,res)=>res.status(mongoose.connection.readyState===1 ? 200 : 503).json({status:mongoose.connection.readyState===1 ? 'ok' : 'unavailable'}));
app.get('/api/status',(req,res)=>res.json({server:'sciencekit',version:'1.0.0'}));
app.get('/signup',(req,res)=>res.render('signup'));
app.post('/signup',controllers.account.create);
app.get('/login',(req,res)=>res.render('login'));
app.post('/login',passport.authenticate('local',{successReturnToOrRedirect:'/app/',failureRedirect:'/login'}));
app.get('/logout',(req,res,next)=>req.logout(error=>error ? next(error) : res.redirect('/')));
app.get('/account',require('connect-ensure-login').ensureLoggedIn(),(req,res)=>res.render('account',{user:req.user}));
app.get('/timeline',(req,res)=>res.redirect('/app/timeline.html'));
app.get('/dialog/authorize',oauth2.authorization);
app.post('/dialog/authorize/decision',oauth2.decision);
app.get('/oauth/exchange',oauth2.exchangeGrantForToken);
app.post('/oauth/token',oauth2.token);
app.post('/api/session',passport.authenticate('local',{session:false}),async (req,res)=> {
  const token=crypto.randomBytes(32).toString('hex');
  await AccessToken.create({token,userID:req.user.id});
  res.json({access_token:token,token_type:'Bearer',account:req.user});
});
app.delete('/api/session',passport.authenticate('bearer',{session:false}),async (req,res)=> {
  await AccessToken.deleteOne({token:req.get('authorization').slice(7)});res.sendStatus(204);
});
const authenticated=passport.authenticate('bearer',{session:false});
app.use('/api',authenticated);
app.get('/api/account',controllers.account.read);
app.get('/api/timeline',controllers.timeline.read);
app.get('/api/entry/:id',controllers.timeline.readEntry);
app.get('/api/story',controllers.Story.read);
for(const name of ['Story','Page','Text','Question','Observation','Sequence','Collaboration','Identity','Sketch','Reflection']) app.post('/api/'+name.toLowerCase(),controllers[name].create);
app.post('/api/photo',upload.single('myphoto'),controllers.Photo.create);
app.post('/api/video',upload.single('file'),controllers.Video.create);
app.get('/api/photo/:id',async (req,res)=>res.json(await inquiry.requireDocument(require('./models/photo'),req.params.id)));
for(const name of ['Tag','Bump']) {
  app.get('/api/'+name.toLowerCase(),controllers[name].read);
  app.post('/api/:activityType/'+name.toLowerCase(),controllers[name].create);
}
app.get('/api/note',controllers.Note.read);
app.post('/api/note',controllers.Note.create);
app.use((req,res)=>res.status(404).json({error:'Not found'}));
app.use((error,req,res,next)=> {
  const status=error.status || (['ValidationError','CastError'].includes(error.name) ? 400 : error instanceof multer.MulterError ? 400 : 500);
  if(status===500) console.error(error);
  res.status(status).json({error:status===500 ? 'Internal server error' : error.message});
});
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:'*'}});
app.set('io',io);
io.on('connection',socket=> {
  const timer=setTimeout(()=>{if(!socket.data.account) socket.disconnect(true);},10000);
  socket.emit('oauthrequesttoken');
  socket.on('oauthtoken',async token=> {
    try {
      const access=await AccessToken.findOne({token});
      const account=access && await Account.findById(access.userID);
      if(!account) return socket.disconnect(true);
      socket.data.account=account;clearTimeout(timer);socket.join('authenticated');socket.emit('oauthtokensuccess');
    } catch { socket.disconnect(true); }
  });
  socket.on('message',message=> {
    if(!socket.data.account) return;
    try {const value=typeof message==='string' ? JSON.parse(message) : message;delete value.token;socket.to('authenticated').emit('message',{account:socket.data.account,message:value});} catch {socket.emit('error','Invalid message');}
  });
  socket.on('disconnect',()=>clearTimeout(timer));
});
// Controllers publish only to authenticated connections.
app.set('io',io.to('authenticated'));
async function start() {
  await mongoose.connect(mongoUrl,{serverSelectionTimeoutMS:10000});
  await Account.init();
  await inquiry.timeline();
  await Client.updateOne({clientId:'abc123'},{$setOnInsert:{name:'ScienceKit Local',clientSecret:'ssh-secret'}},{upsert:true});
  const port=Number(process.env.PORT || 3000);
  await new Promise(resolve=>server.listen(port,process.env.HOST || '127.0.0.1',resolve));
  console.log('ScienceKit listening at http://localhost:'+port+'/app/');
}
async function stop() { await new Promise(resolve=>io.close(resolve));await sessionStore.close();await mongoose.disconnect(); }
if(require.main===module) {start().catch(error=>{console.error(error);process.exit(1);});for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>stop().then(()=>process.exit()));}
module.exports={app,server,io,start,stop};
