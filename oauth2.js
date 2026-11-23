const oauth2orize = require('oauth2orize');
const passport = require('passport');
const login = require('connect-ensure-login');
const crypto = require('node:crypto');
const Client = require('./models/client');
const AccessToken = require('./models/accesstoken');
const AuthorizationCode = require('./models/authorizationcode');
const server = oauth2orize.createServer();
server.serializeClient((client,done)=>done(null,client.id));
server.deserializeClient(async (id,done)=> { try {done(null,await Client.findById(id));} catch(e) {done(e);} });
server.grant(oauth2orize.grant.code(async (client,redirectURI,user,ares,done)=> {
  try {const code=crypto.randomBytes(32).toString('hex'); await AuthorizationCode.create({code,clientID:client.id,redirectURI,userID:user.id});done(null,code);} catch(e) {done(e);}
}));
server.exchange(oauth2orize.exchange.code(async (client,code,redirectURI,done)=> {
  try {
    const grant=await AuthorizationCode.findOneAndDelete({code,clientID:client.id,redirectURI});
    if(!grant) return done(null,false);
    const token=crypto.randomBytes(32).toString('hex');
    await AccessToken.create({token,userID:grant.userID,clientID:client.id});done(null,token);
  } catch(e) {done(e);}
}));
exports.authorization=[login.ensureLoggedIn(),server.authorization(async (clientId,redirectURI,done)=> {
  try {const client=await Client.findOne({clientId});done(null,redirectURI==='/oauth/exchange' ? client : false,redirectURI);} catch(e) {done(e);}
}),(req,res)=>res.render('dialog',{transactionID:req.oauth2.transactionID,user:req.user,myclient:req.oauth2.client})];
exports.decision=[login.ensureLoggedIn(),server.decision()];
exports.exchangeGrantForToken=(req,res)=>res.render('request_auth_dialog',{authorization_code:req.query.code,referrer_uri_params:{}});
exports.token=[passport.authenticate(['client','oauth2-client-password'],{session:false}),server.token(),server.errorHandler()];
