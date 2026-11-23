const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const Account=require('../models/account');
async function main() {
  const username=process.env.SEED_USERNAME;
  const password=process.env.SEED_PASSWORD;
  if(!username || !password || password.length<8 || Buffer.byteLength(password)>72) throw new Error('Set SEED_USERNAME and SEED_PASSWORD (8–72 bytes)');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sciencekit');
  await Account.init();
  if(!await Account.exists({username})) await Account.create({username,password:await bcrypt.hash(password,12)});
  console.log('Local account ready: '+username);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
