const {promisify}=require('node:util');
const {execFile}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs/promises');
const inquiry = require('../lib/inquiry');
exports.create = async (req,res) => {
  const data = {...req.body};
  if(req.file) data.uri = '/uploads/' + req.file.filename;
  if(req.file) {
    const thumbnails=path.resolve(__dirname,'../public/thumbnails');
    await fs.mkdir(thumbnails,{recursive:true});
    const target=path.join(thumbnails,path.parse(req.file.filename).name+'.jpg');
    try { await promisify(execFile)(process.env.FFMPEG_PATH || 'ffmpeg',['-y','-i',req.file.path,'-frames:v','1','-vf','scale=480:-1',target],{timeout:30000}); }
    catch(error) { await fs.unlink(req.file.path).catch(()=>{}); throw inquiry.httpError(400,'Video could not be decoded'); }
  }
  const entry = await inquiry.create('Video',data,req.user);
  req.app.get('io').emit('video',entry);
  res.json(entry);
};
