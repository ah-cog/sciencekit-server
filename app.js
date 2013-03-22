// The ScienceKit Node.js application depends on the following Node.js modules.
var express  = require('express')
  , routes   = require('./routes')
  , controllers = require('./controllers')
  , http     = require('http')
  , path     = require('path')
  , passport = require('passport')
  , oauth2   = require('./oauth2')
  , site     = require('./site')
  , util     = require('util')
  , jade     = require('jade')
  , url      = require('url')
  , mongoose = require('mongoose');




// Connect to Mongoose
mongoose.connect('mongodb://localhost/sciencekit');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('Mongoose connection opened.'); // Yay
});




// NOTE: Uncomment the following code to initialize the database with required "dummy data".  This will not be required in the future.
// // Initialize users in database
// var bob = new Account({ 'username': 'bob', 'password': 'secret', 'name': 'Bob Smith' });
// var joe = new Account({ 'username': 'joe', 'password': 'password', 'name': 'Joe Davis' });
// bob.save(function(err, bob) {
//   if(err) {
//     console.log('Could not save bob.');
//   }
// });
// joe.save(function(err, joe) {
//   if(err) {
//     console.log('Could not save joe.');
//   }
// });

// // Initialize clients in database
// var Client = require('./models/client.js');
// var demoClient = new Client({ 'name': 'ScienceKit Probe', 'clientId': 'abc123', 'clientSecret': 'ssh-secret' });
// demoClient.save(function(err, client) {
//   if(err) {
//     console.log('Could not save client.');
//   }
// });




var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session()); // Make sure this is before passport.initialize()

  // Passport
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});




// Passport configuration
require('./auth');




// Routes
app.get('/', routes.index);

// TODO: Register for an account.
// app.get('/api/user/register'); // Return JSON registration form with empty values
// app.post('api/user/register'); // Submit JSON form with filled values

app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);
app.get('/account', site.account);

//app.get('/oauth/client'); // Register an app for a user.  Create the client ID and client secret for an application.

// OAuth2 Provider URIs (this is an OAuth2 term)
//
// Once a client has been created by and associated with a user and stored in 
// the database.  This must happen first because the authorization request 
// must include a "client ID" and a "client secret".
//
// +--------------+                               +---------------+
// |              |--(A)- Authorization Request ->|   Resource    |
// |              |                               |     Owner     |
// |              |<-(B)-- Authorization Grant ---|    (Human)    |
// |              |                               +---------------+
// |              |
// |              |        Authorization Grant &  +---------------+
// |              |--(C)--- Client Credentials -->| Authorization |
// |    Client    |                               |     Server    |
// | (ScienceKit) |<-(D)----- Access Token -------|               |
// |              |                               +---------------+
// |              |
// |              |                               +---------------+
// |              |--(E)----- Access Token ------>|    Resource   |
// |              |                               |     Server    |
// |              |<-(F)--- Protected Resource ---|               |
// +--------------+                               +---------------+
//
//      Figure: Abstract Protocol Flow, specific to ScienceKit.
//
// [http://tools.ietf.org/html/draft-ietf-oauth-v2-bearer-20#section-2.1]
//
// Notes:
// - The OAuth specification suggests that the Authorization Server and 
//   Resource server should be hosted on different machines.  This server 
//   implements both to be hosted on a single machine.  This potentially 
//   reduces security, but it is a simple approach.
//
// - The redirect_uri parameter for the following calls must be identical:
//
//       /dialog/authorize
//       /oauth/token
//
//   The calls will fail if the redirect_uri parameter in /oauth/token does 
//   not match the one used previously the the /dialog/authorize request.

// Resource Owner (this is an OAuth2 term)
app.get('/dialog/authorize', oauth2.authorization); // (A)
app.post('/dialog/authorize/decision', oauth2.decision);

// Authorization Server
app.get('/oauth/exchange', function(req, res) { // Generates request to (C)
  var code = req.query["code"]
  console.log(code);

  // Store code in DB for client
  var referrer_uri = req.header('Referer');
  console.log(referrer_uri);
  var referrer_uri_params = url.parse(referrer_uri, true).query;
  console.log(referrer_uri_params);

  res.render('request_auth_dialog', { authorization_code: code, referrer_uri_params: referrer_uri_params });
  //res.redirect('/oauth/token');
}); // (1) extract authorization_code (grant) and (2) make request to exchange grant for access token to /oauth/token; (3) store resulting access_token and token_type in DB
app.post('/oauth/token', oauth2.token); // (C)

// Resource Server (this is an OAuth2 term)
// The resource server stores the protected resources (API URIs that require authentication).
app.get('/api/account/list', controllers.account.list);




// Start ScienceKit HTTP server
http.createServer(app).listen(app.get('port'), function(){
  console.log("ScienceKit server listening on port " + app.get('port'));
});
