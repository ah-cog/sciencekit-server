var oauth2orize = require("oauth2orize")
var passport = require("passport")
var login = require("connect-ensure-login")
var utils = require("./utils")
var jade = require("jade")
var Client = require("./models/client")
var AccessToken = require("./models/accesstoken")
var AuthorizationCode = require("./models/authorizationcode")
var url = require("url")

var server = oauth2orize.createServer()

server.serializeClient(function(client, done) {
  return done(null, client.id)
})

server.deserializeClient(function(id, done) {
  Client.findById(id, function(err, client) {
    if (err) {
      return done(err)
    }
    return done(null, client)
  })
})

server.grant(
  oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
    var code = utils.uid(16)
    console.log("Received Authorize grant request from client: " + client)
    console.log("Generated code: " + code)
    var authorizationCode = new AuthorizationCode({
      code: code,
      clientID: client.id,
      redirectURI: redirectURI,
      userID: user.id,
    })
    authorizationCode.save(function(err) {
      if (err) {
        return done(err)
      }
      console.log("Stored code: " + authorizationCode)
      done(null, code)
    })
  })
)

server.exchange(
  oauth2orize.exchange.code(function(client, code, redirectURI, done) {
    console.log("Received exchange request from client: " + client)
    console.log("Looking for authorization code: " + code)
    AuthorizationCode.findOne({ code: code }, function(err, authCode) {
      if (err) {
        return done(err)
      }
      if (client.id !== authCode.clientID) {
        return done(null, false)
      }
      if (redirectURI !== authCode.redirectURI) {
        return done(null, false)
      }

      var token = utils.uid(256)
      console.log("Generated token: " + code)

      var accessToken = new AccessToken({
        token: token,
        userID: authCode.userID,
        clientID: authCode.clientID,
      })
      accessToken.save(function(err) {
        if (err) {
          return done(err)
        }
        console.log("Stored access token: " + accessToken)
        done(null, token)
      })
    })
  })
)

exports.exchangeGrantForToken = function(req, res) {
  var code = req.query["code"]
  console.log(code)

  // Store code in DB for client
  var referrer_uri = req.header("Referer")
  console.log(referrer_uri)
  var referrer_uri_params = url.parse(referrer_uri, true).query
  console.log(referrer_uri_params)

  res.render("request_auth_dialog", {
    authorization_code: code,
    referrer_uri_params: referrer_uri_params,
  })
  //res.redirect('/oauth/token');
}

exports.authorization = [
  login.ensureLoggedIn(),
  server.authorization(function(clientId, redirectURI, done) {
    Client.findOne({ clientId: clientId }, function(err, client) {
      if (client === null) {
        console.log("No client exists with specified ID.")
      }
      console.log("Found client " + client)
      if (err) {
        return done(err)
      }
      // Warning: For security purposes, it is highly advisable to check that
      // redirectURI provided by the client matches one registered with the
      // server.  For simplicity, this example does not.  You have been warned.
      return done(null, client, redirectURI)
    })
  }),
  function(req, res) {
    res.render("dialog", {
      transactionID: req.oauth2.transactionID,
      user: req.user,
      myclient: req.oauth2.client,
    })
  },
]

exports.decision = [login.ensureLoggedIn(), server.decision()]

exports.token = [
  passport.authenticate(["client", "oauth2-client-password"], {
    session: false,
  }),
  server.token(),
  server.errorHandler(),
]
