var passport = require("passport")
var LocalStrategy = require("passport-local").Strategy
var BasicStrategy = require("passport-http").BasicStrategy
var ClientPasswordStrategy = require("passport-oauth2-client-password").Strategy
var BearerStrategy = require("passport-http-bearer").Strategy
var mongoose = require("mongoose")
var Account = require("./models/account")
var Client = require("./models/client")
var AccessToken = require("./models/accesstoken")
var AuthorizationCode = require("./models/authorizationcode")
var bcrypt = require("bcrypt")

passport.use(
  new LocalStrategy(function(username, password, done) {
    Account.findOne({ username: username }, function(err, account) {
      if (err) {
        return done(err)
      }
      if (!account) {
        return done(null, false, { message: "Incorrect username." })
      }
      bcrypt.compare(password, account.password, function(err, res) {
        if (res == false) {
          return done(null, false, { message: "Incorrect password." })
        }
      })
      return done(null, account)
    })
  })
)

passport.serializeUser(function(account, done) {
  done(null, account.id)
})

passport.deserializeUser(function(id, done) {
  Account.findById(id, function(err, account) {
    done(err, account)
  })
})

passport.use(
  "user",
  new BasicStrategy(function(username, password, done) {
    Account.findOne({ username: username }, function(err, account) {
      console.log("Found account match for received account ID.")
      if (err) {
        return done(err)
      }
      if (!account) {
        return done(null, false)
      }

      bcrypt.compare(password, account.password, function(err, res) {
        if (res == false) {
          return done(null, false)
        }
      })

      return done(null, account)
    })
  })
)

passport.use(
  "client",
  new BasicStrategy(function(username, password, done) {
    Client.findOne({ clientId: username }, function(err, client) {
      console.log("Found client match for received client ID.")
      if (err) {
        return done(err)
      }
      if (!client) {
        return done(null, false)
      }
      if (client.clientSecret != password) {
        return done(null, false)
      }
      return done(null, client)
    })
  })
)

passport.use(
  new ClientPasswordStrategy(function(clientId, clientSecret, done) {
    Client.findOne({ clientId: clientId }, function(err, client) {
      if (err) {
        return done(err)
      }
      if (!client) {
        return done(null, false)
      }
      if (client.clientSecret != clientSecret) {
        return done(null, false)
      }
      return done(null, client)
    })
  })
)

passport.use(
  new BearerStrategy(function(accessToken, done) {
    AccessToken.findOne({ token: accessToken }, function(err, token) {
      if (err) {
        return done(err)
      }
      if (!token) {
        return done(null, false)
      }

      Account.findById(token.userID, function(err, account) {
        console.log("Found account for received token.")
        if (err) {
          return done(err)
        }
        if (!account) {
          return done(null, false, {
            message:
              "No account exists that is associated with the specified access token.",
          })
        }
        var info = { scope: "*" }
        done(null, account, info)
      })
    })
  })
)
