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
  , mongoose = require('mongoose')
  , socketio = require('socket.io')
  , stylus   = require('stylus')
  , nib      = require('nib');


var AccessToken = require('./models/accesstoken')
  , Account = require('./models/account')
  , Client = require('./models/client');




// Connect to Mongoose
var mongooseUri = 'mongodb://localhost/sciencekit';

// mongoose.connect(uri, options);
//    db      - passed to the connection db instance
//    server  - passed to the connection server instance(s)
//    replset - passed to the connection ReplSet instance
//    user    - username for authentication (if not specified in uri)
//    pass    - password for authentication (if not specified in uri)
// [Source: http://mongoosejs.com/docs/connections.html]
// [Source: https://github.com/mongodb/node-mongodb-native]
var mongooseOptions = {};
mongoose.connect(mongooseUri, mongooseOptions);

// [Source: http://mongoosejs.com/docs/api.html#connection-js]
var db = mongoose.connection;
db.on('error', function callback() {
  // console.error.bind(console, 'Mongoose connection error: ')
  console.log('Mongoose connection error.');
});
db.once('open', function callback() {
  console.log('Mongoose connection opened successfully.'); // Yay
});

// Emitted when this connection successfully connects to the db. May be emitted multiple times in reconnected scenarios.
db.on('connected', function callback() {
  console.log('Mongoose: connected');
});
// Emitted after getting disconnected from the db.
db.on('disconnected', function callback() {
  console.log('Mongoose: disconnected');
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




// Stylus compile function
function compile(str, path) {
  return stylus(str)
      .set('filename', path)
      .use(nib());
}




var app = express();

app.configure(function() {

  // Start listening for incoming connections on specified port.
  // This port setting is needed by Heroku or the app will not run.
  var port = process.env.PORT || 3000;

  app.set('port', port);

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

  app.use(stylus.middleware({  
    src: __dirname + '/public',
    compile: compile
  }));

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
// GET    app.get('/api/user/register'); // Return JSON registration form with empty values
// POST   app.post('api/user/register'); // Submit JSON form with filled values
// PUT    app.put('api/user/:userId'); // Submit JSON form with updated values for user
// DELETE app.delete('api/user/:userId'); // Submit JSON form with updated values for user

// app.options('/api/clients', function(req, res) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "X-Requested-With");
//   res.header("Access-Control-Allow-Headers", "3628800");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.header("Access-Control-Allow-Headers", "Authorization"); // TODO: Remove this to make more secure!
//   res.send('yay');
// });

app.get('/api/clients',
  passport.authenticate('user', { session: false }),
  function(req, res) {
    console.log('Received API request: ' + req);
    Client.findOne({ 'clientId': 'abc123' }, function(err, client) {
      if (err) { return done(err); }

      res.json(client);
    });
  }
);

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


app.all('/api/*', function(req, res, next) {
  console.log('Received API request: ' + req);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Authorization"); // TODO: Remove "Authorization" to this to make more secure!
  res.header("Access-Control-Max-Age", "3628800");
  next();
 });

// Resource Server (this is an OAuth2 term)
// The resource server stores the protected resources (API URIs that require authentication).
app.get('/api/account/list', controllers.account.list);




// Start ScienceKit HTTP server
var server = http.createServer(app).listen(app.get('port'), function() {
  console.log("ScienceKit server listening on port " + app.get('port'));
});

// Starting socket.io
var io = socketio.listen(server).on('connection', function (socket) {

  // TODO: Store data from these
  // console.log(socket);
  // console.log(socket.handshake);

  // TODO: By default, check cookie session (if in browser).  Otherwise, continue to check OAuth

  // Start custom authentication handshaking (request OAuth access token from client)
  socket.emit('oauthrequesttoken');

  // Handler for received "oauth" messages.
  // Authenticates the socket connection.
  socket.on('oauthtoken', function (msg) {
    console.log('\'oauthtoken\' event received: ', msg);

    var accessToken = msg || '';

    // Authenticate socket
    // TODO: If token is valid, authenticate the socket, store token in database.
    // TODO: If token is invalid, disconnect.

    // Check if access token is valid.
    AccessToken.findOne({ 'token': accessToken }, function(err, token) {
      if (err) { socket.disconnect(); return; }
      if (!token) { socket.disconnect(); return; }
      console.log("Found access token: " + token);

      Account.findById(token.userID, function(err, account) {
        if (err) { socket.disconnect(); return; }
        if (!account) { socket.disconnect(); return; }
        console.log("Found account for received token: " + account);

        // TODO: Only emit to authenticated sockets
        socket.emit('oauthtokensuccess');
      });
    });

  });

  // Handler for received "message" messages
  socket.on('message', function (msg) {
    console.log('\'message\' event received: ', msg);

    // Get access token (if any)... required.
    var message = JSON.parse(msg);
    var accessToken = message.token;

    // Check if access token is valid.
    AccessToken.findOne({ 'token': accessToken }, function(err, token) {
      if (err) { socket.disconnect(); return; }
      if (!token) { socket.disconnect(); return; }

      Account.findById(token.userID, function(err, account) {
        if (err) { socket.disconnect(); return; }
        if (!account) { socket.disconnect(); return; }



        // Strip OAuth2 access token
        message = account.username + ': ' + message.message;

        // TODO: Create session ID?  So don't have to use access token, can just use session?

        // TODO: Store contribution in database (if appropriate)


        // TODO: Only emit to authenticated sockets with token stored in DB
        socket.broadcast.emit('message', message);
      });
    });

    // socket.broadcast.emit('message', msg);
  });

  // Handler for received "disconnect" messages
  //
  // "[T]he disconnect event is fired in all cases, when the client-server 
  //  connection is closed. It fires on wanted, unwanted, mobile, unmobile, 
  //  client and server disconnects. There is no dedicated reconnect event. 
  //  You have to use the "connection" event for reconnect handling."
  //
  // [Source: https://github.com/LearnBoost/socket.io/wiki/Exposed-events]
  socket.on('disconnect', function() {
    console.log("Socket disconnected.");

    // TODO: remote OAuth auth. for socket.id
  });

});

// Configure socket.io for Heroku (socket.io will not work without this configuration)
// [Source: https://github.com/LearnBoost/socket.io/wiki/Configuring-Socket.IO]
io.configure(function () { 

  // Set transport mechanism.  Heroku requires "xhr-polling".
  //
  // For reference, these can be the following:
  //
  //    io.set('transports', [
  //      'websocket'
  //    , 'flashsocket'
  //    , 'htmlfile'
  //    , 'xhr-polling'
  //    , 'jsonp-polling'
  //    ]);
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 

  // Enable and set up socket.io streaming authorization
  // [Source: https://github.com/LearnBoost/socket.io/wiki/Authorizing]
  io.set('authorization', function (handshakeData, callback) {

    // 1. Establish connection
    // 2. Store data needed for later OAuth2 authentication using access token


    // Do database lookup to see if the OAuth2 client that initiated the socket.io handshaking has a valid access token    

    // Set arguments to callback function
    // "Sending an error or setting the authorized argument to false both result in not allowing the client to connect to the server."
    var error = null;
    var authorized = true; // "authorized" is a Boolean value indicating whether the client is authorized.
    callback(error, authorized); // error first callback style 
  });

});

// Render some console log output
console.log("ScienceKit server listening for socket/streaming connections on port " + app.get('port'));