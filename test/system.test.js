const {test,after,before}=require('node:test');
const assert=require('node:assert/strict');
const mongoose=require('mongoose');
const {once}=require('node:events');
const {io:connect}=require('socket.io-client');
process.env.MONGODB_URI=process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/sciencekit_test_'+process.pid;
process.env.PORT='0';
const {server,start,stop}=require('../app');
let base,token,account,entry,story;
async function request(path,body,auth=token,method=body ? 'POST' : 'GET') {
  const headers={}; if(auth) headers.Authorization='Bearer '+auth;
  if(body && !(body instanceof FormData)) {headers['Content-Type']='application/json';body=JSON.stringify(body);}
  return fetch(base+path,{method,headers,body});
}
async function json(path,body) {const response=await request(path,body);assert.equal(response.status,200,await response.clone().text());return response.json();}
before(async()=>{await start();base='http://127.0.0.1:'+server.address().port;});
after(async()=>{if(mongoose.connection.readyState===1) await mongoose.connection.dropDatabase();await stop();});
test('ScienceKit end-to-end API, persistence and real-time contracts',{timeout:300000},async t=> {
  await t.test('health and CORS preflight',async()=>{
    assert.equal((await request('/health')).status,200);
    assert.equal((await request('/signup')).status,200);
    assert.equal((await request('/login')).status,200);
    const preflight=await fetch(base+'/api/photo',{method:'OPTIONS',headers:{Origin:'app://localhost','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
    assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'*');
  });
  await t.test('signup rejects missing input and duplicate users',async()=>{
    assert.equal((await request('/signup',{})).status,400);
    const response=await fetch(base+'/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'researcher',password:'local-test-password'}),redirect:'manual'});
    assert.equal(response.status,302);
    assert.equal((await request('/signup',{username:'researcher',password:'local-test-password'})).status,409);
  });
  await t.test('incorrect passwords and unauthenticated API requests are rejected',async()=>{
    assert.equal((await request('/api/session',{username:'researcher',password:'incorrect'},null)).status,401);
    assert.equal((await request('/api/timeline',null,null)).status,401);
    const session=await json('/api/session',{username:'researcher',password:'local-test-password'});token=session.access_token;account=session.account;
    assert.ok(token);assert.equal(account.password,undefined);
  });
  await t.test('empty timeline and story lists return immediately',async()=>{
    const timeline=await json('/api/timeline');assert.ok(timeline._id);assert.deepEqual(timeline.moments,[]);
    assert.deepEqual(await json('/api/story?timelineId='+timeline._id),[]);
  });
  await t.test('text creates a fully populated moment on the default timeline',async()=>{
    entry=await json('/api/text',{text:'We observed a seed sprouting.'});assert.equal(entry.entry.text,'We observed a seed sprouting.');assert.equal(entry.author.username,'researcher');assert.equal(entry.author.password,undefined);
    assert.equal((await json('/api/timeline')).moments.length,1);
    assert.equal((await json('/api/entry/'+entry._id))._id,entry._id);
  });
  await t.test('concepts, collaborators and identity attach to existing moments',async()=>{
    const question=await json('/api/question',{parent:entry._id,text:'Why does light help?'});assert.equal(question.entry.question,'Why does light help?');
    const observation=await json('/api/observation',{parent:entry._id,cause:'Sunlight',effect:'Growth'});assert.equal(observation.entry.cause,'Sunlight');
    await json('/api/sequence',{parent:entry._id,steps:[{step:'Plant'},{step:'Water'}]});
    await json('/api/collaboration',{parent:entry._id,authors:[{author:account._id}]});
    const identity=await json('/api/identity',{parent:entry._id,identity:'scientist'});assert.equal(identity.entry,entry._id);
    const populated=await json('/api/entry/'+entry._id);assert.equal(populated.questions.length,1);assert.equal(populated.collaborations.length,1);
  });
  await t.test('story pages retain group and position order',async()=>{
    story=await json('/api/story',{title:'Our growing story'});
    const page2=await json('/api/page',{story:story._id,entry:entry._id,group:0,position:2});
    await json('/api/page',{story:story._id,entry:entry._id,group:0,position:1});
    const stories=await json('/api/story?timelineId='+story.timeline);assert.equal(stories[0].pages[0].position,1);assert.equal(stories[0].pages[1]._id,page2._id);assert.equal(stories[0].pages[0].entry.entry.text,entry.entry.text);
    await json('/api/note',{page:page2._id,note:'We learned about light.'});assert.equal((await json('/api/note?pageId='+page2._id)).note,'We learned about light.');
  });
  await t.test('tags and bumps round trip; duplicate bumps are idempotent',async()=>{
    await json('/api/text/tag',{entry:entry._id,text:'plants'});assert.equal((await json('/api/tag?entryId='+entry._id))[0].text,'plants');
    const one=await json('/api/text/bump',{entry:entry._id});const two=await json('/api/text/bump',{entry:entry._id});assert.equal(one._id,two._id);
  });
  await t.test('photo uploads store retrievable bytes and timeline references',async()=>{
    const form=new FormData();form.set('myphoto',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'observation.png');
    const response=await request('/api/photo',form);assert.equal(response.status,200);const photo=await response.json();assert.equal(photo.entryType,'Photo');assert.equal((await fetch(base+photo.entry.uri)).status,200);
  });
  await t.test('video uploads generate a retrievable thumbnail',async()=>{
    const bytes=require('node:fs').readFileSync(require('node:path').join(__dirname,'fixtures/observation.mp4'));
    const form=new FormData();form.set('file',new Blob([bytes],{type:'video/mp4'}),'observation.mp4');
    const response=await request('/api/video',form);assert.equal(response.status,200,await response.clone().text());
    const video=await response.json();assert.equal(video.entryType,'Video');
    assert.equal((await fetch(base+video.entry.uri)).status,200);
    const thumbnail=video.entry.uri.replace('/uploads/','/thumbnails/').replace(/\.[^/.]+$/,'.jpg');
    assert.equal((await fetch(base+thumbnail)).status,200);
  });
  await t.test('invalid and missing resources return errors without hanging',async()=>{
    assert.equal((await request('/api/entry/not-an-id')).status,400);
    assert.equal((await request('/api/entry/000000000000000000000000')).status,404);
    assert.equal((await request('/api/question',{})).status,400);
    assert.deepEqual(await json('/api/tag'),[]);
  });
  await t.test('authenticated sockets receive updates; anonymous sockets do not',async t=>{
    assert.ok(token,'login must succeed before testing sockets');
    const socket=connect(base,{autoConnect:false,transports:['websocket']});
    const anonymous=connect(base,{autoConnect:false,transports:['websocket']});
    t.after(()=>{socket.disconnect();anonymous.disconnect();});
    let leaked=false;anonymous.on('reflection',()=>{leaked=true;});
    socket.on('oauthrequesttoken',()=>socket.emit('oauthtoken',token));
    const authorized=once(socket,'oauthtokensuccess');socket.connect();anonymous.connect();await Promise.race([authorized,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('Socket authentication timed out')),30000);timer.unref();})]);
    const received=once(socket,'reflection');await json('/api/reflection',{text:'Plants need care'});const [reflection]=await Promise.race([received,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('Socket update timed out')),30000);timer.unref();})]);assert.equal(reflection.entry.text,'Plants need care');assert.equal(leaked,false);socket.disconnect();anonymous.disconnect();
  });
  await t.test('account responses exclude password hashes and logout revokes tokens',async()=>{
    const accounts=await json('/api/account');assert.ok(accounts.every(a=>!a.password));
    assert.equal((await request('/api/session',null,token,'DELETE')).status,204);
    assert.equal((await request('/api/timeline')).status,401);
  });
});
