const bcrypt = require('bcrypt');
const Account = require('../models/account');
exports.create = async (req,res) => {
  const {username,password} = req.body;
  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) return res.status(400).send('Username and a password of 8–72 bytes are required.');
  try { await Account.create({username:username.trim(),password:await bcrypt.hash(password,12)}); }
  catch(error) { if(error.code===11000) return res.status(409).send('Username already exists.'); throw error; }
  res.redirect(req.session.returnTo ? '/login' : (process.env.CLIENT_URL || '/app/'));
};
exports.read = async (req,res) => {
  const accounts = await Account.find({}).lean();
  accounts.sort((a,b)=>Number(String(b._id)===req.user.id)-Number(String(a._id)===req.user.id));
  res.json(accounts);
};
