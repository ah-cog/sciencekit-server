/**
 * Module dependencies.
 */
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , BasicStrategy = require('passport-http').BasicStrategy
  , TwitterStrategy = require('passport-twitter').Strategy
  , ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
  , BearerStrategy = require('passport-http-bearer').Strategy
  , mongoose = require('mongoose')
  , Account = require('./models/account')
  , Client = require('./models/client')
  , AccessToken = require('./models/accesstoken')
  , AuthorizationCode = require('./models/authorizationcode');

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(new LocalStrategy(
  function(username, password, done) {
    // Find account by username
    Account.findOne({ 'username': username }, function(err, account) {
      console.log("Found account " + account);
      if (err) { return done(err); }
      if (!account) {
        return done(null, false, { 'message': 'Incorrect username.' });
      }
      if (account.password != password) {
        return done(null, false, { 'message': 'Incorrect password.' });
      }
      return done(null, account);
    });

    // db.users.findByUsername(username, function(err, user) {
    //   if (err) { return done(err); }
    //   if (!user) { return done(null, false); }
    //   if (user.password != password) { return done(null, false); }
    //   return done(null, user);
    // });
  }
));

passport.serializeUser(function(account, done) {
  done(null, account.id);
});

passport.deserializeUser(function(id, done) {
  Account.findById(id, function(err, account) {
    done(err, account);
  });

  // db.users.find(id, function (err, user) {
  //   done(err, user);
  // });
});


passport.use('user', new BasicStrategy(
  function(username, password, done) {
    // Find account for specified account ID (find account by account ID)
    Account.findOne({ 'username': username }, function(err, account) {
      console.log("Found account match for received account ID.");
      if (err) { return done(err); }
      if (!account) { return done(null, false); }
      if (account.password != password) { return done(null, false); }
      return done(null, account);
    });
  }
));


/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use('client', new BasicStrategy(
  function(username, password, done) {
    // Find client for specified client ID (find client by client ID)
    Client.findOne({ 'clientId': username }, function(err, client) {
      console.log("Found client match for received client ID.");
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != password) { return done(null, false); }
      return done(null, client);
    });

    // db.clients.findByClientId(username, function(err, client) {
    //   if (err) { return done(err); }
    //   if (!client) { return done(null, false); }
    //   if (client.clientSecret != password) { return done(null, false); }
    //   return done(null, client);
    // });
  }
));

passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
    Client.findOne({ 'clientId': clientId }, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != clientSecret) { return done(null, false); }
      return done(null, client);
    });

    // db.clients.findByClientId(clientId, function(err, client) {
    //   if (err) { return done(err); }
    //   if (!client) { return done(null, false); }
    //   if (client.clientSecret != clientSecret) { return done(null, false); }
    //   return done(null, client);
    // });
  }
));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).  The user must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function(accessToken, done) {
    //db.accessTokens.find(accessToken, function(err, token) {
    AccessToken.findOne({ 'token': accessToken }, function(err, token) {
      if (err) { return done(err); }
      if (!token) { return done(null, false); }
      
      // db.users.find(token.userID, function(err, user) {
      //   if (err) { return done(err); }
      //   if (!user) { return done(null, false); }
      //   // to keep this example simple, restricted scopes are not implemented,
      //   // and this is just for illustrative purposes
      //   var info = { scope: '*' }
      //   done(null, user, info);
      // });

      Account.findById(token.userID, function(err, account) {
        console.log("Found account for received token.");
        if (err) { return done(err); }
        if (!account) {
          return done(null, false, { 'message': 'No account exists that is associated with the specified access token.' });
        }
        // to keep this example simple, restricted scopes are not implemented,
        // and this is just for illustrative purposes
        var info = { scope: '*' }
        done(null, account, info);
      });
    });
  }
));