const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const bcrypt = require('bcrypt');
const Account = require('./models/account');
const Client = require('./models/client');
const AccessToken = require('./models/accesstoken');
async function verifyUser(username,password,done) {
  try {
    const account = await Account.findOne({username}).select('+password');
    if(!account || !await bcrypt.compare(password,account.password)) return done(null,false);
    account.password = undefined;
    done(null,account);
  } catch(error) { done(error); }
}
passport.use(new LocalStrategy(verifyUser));
passport.use('user',new BasicStrategy(verifyUser));
async function verifyClient(clientId,clientSecret,done) {
  try { const client=await Client.findOne({clientId,clientSecret}); done(null,client || false); } catch(error) { done(error); }
}
passport.use('client',new BasicStrategy(verifyClient));
passport.use(new ClientPasswordStrategy(verifyClient));
passport.use(new BearerStrategy(async (token,done)=> {
  try {
    const access = await AccessToken.findOne({token});
    const account = access && await Account.findById(access.userID);
    done(null,account || false);
  } catch(error) { done(error); }
}));
passport.serializeUser((account,done)=>done(null,account.id));
passport.deserializeUser(async (id,done)=> { try {done(null,await Account.findById(id));} catch(error) {done(error);} });
module.exports = passport;
