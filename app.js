var express = require("express")
var routes = require("./routes")
var controllers = require("./controllers")
var http = require("http")
var path = require("path")
var passport = require("passport")
var oauth2 = require("./oauth2")
var util = require("util")
var jade = require("jade")
var url = require("url")
var mongoose = require("mongoose")
var socketio = require("socket.io")
var stylus = require("stylus")
var nib = require("nib")
var moment = require("moment")
var ffmpeg = require("fluent-ffmpeg")

var AccessToken = require("./models/accesstoken")
var Account = require("./models/account")
var Client = require("./models/client")
var Photo = require("./models/photo")
var Timeline = require("./models/timeline")

var argPort = 3000
var database = "sciencekit"

//-----------------------------------------------------------------------------
// Connect to Mongoose.
//-----------------------------------------------------------------------------

var mongooseUri =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  "mongodb://localhost/" + database

var mongooseOptions = {}
mongoose.connect(mongooseUri, mongooseOptions)

var db = mongoose.connection
db.on("error", function callback() {
  console.log("Mongoose connection error.")
})
db.once("open", function callback() {
  console.log("Mongoose connection opened successfully.") // Yay
})

// Emitted when this connection successfully connects to the db. May be emitted multiple times in reconnected scenarios.
db.on("connected", function callback() {
  console.log("Mongoose: connected")
})
// Emitted after getting disconnected from the db.
db.on("disconnected", function callback() {
  console.log("Mongoose: disconnected")
})

//-----------------------------------------------------------------------------
// Initialize database.
//-----------------------------------------------------------------------------

// Create timeline.
Timeline.find({ hidden: false })
  .sort("-date")
  .exec(function(err, timelines) {
    if (timelines.length <= 0) {
      Timeline.create({}, function(err, timeline) {
        if (err) {
          console.log("Error creating new Timeline.")
        }
        console.log("Created new Timeline.")
      })
    }
  })

// Stylus compile function.
function compile(str, path) {
  return stylus(str)
    .set("filename", path)
    .use(nib())
}

var app = express()

app.configure(function() {
  var port = process.env.PORT || argPort

  app.set("port", port)

  app.set("views", __dirname + "/views")
  app.set("view engine", "jade")
  app.use(express.favicon())
  app.use(express.logger("dev"))
  app.use(
    express.bodyParser({
      uploadDir: __dirname + "/public/uploads",
      keepExtensions: true,
    })
  )

  app.use(express.methodOverride())
  app.use(express.cookieParser("your secret here"))
  app.use(express.session()) // Note: Make sure this is before passport.initialize().

  app.use(passport.initialize())
  app.use(passport.session())

  app.use(app.router)

  app.use(
    stylus.middleware({
      src: __dirname + "/public",
      compile: compile,
    })
  )

  app.use(express.static(path.join(__dirname, "public")))
})

app.configure("development", function() {
  app.use(express.errorHandler())
})

// Passport configuration
require("./auth")

// Routes
app.get("/", routes.index)

app.get("/signup", routes.signupForm)
app.post("/signup", controllers.account.create)
app.get("/login", routes.loginForm)
app.post("/login", routes.login)
app.get("/logout", routes.logout)
app.get("/account", routes.account)

app.get("/timeline", routes.timeline)

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

// Resource owner (this is an OAuth2 term).
app.get("/dialog/authorize", oauth2.authorization) // (A)
app.post("/dialog/authorize/decision", oauth2.decision)

// Authorization server.
app.get("/oauth/exchange", oauth2.exchangeGrantForToken) // (1) extract authorization_code (grant) and (2) make request to exchange grant for access token to /oauth/token; (3) store resulting access_token and token_type in DB
app.post("/oauth/token", oauth2.token) // (C)

app.post("/api/client/create", function(req, res, next) {
  // Create client.
  var client = new Client({
    name: "ScienceKit Node",
    clientId: "abc123",
    clientSecret: "ssh-secret",
  })

  // Save client to datastore.
  client.save(function(err, client) {
    if (err) {
      console.log("Error creating client: " + client)
    }
    console.log("Created client: " + client)
    res.json(client)
  })
})

app.all("/api/*", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Authorization, Content-Type"
  )
  res.header("Access-Control-Max-Age", "3628800")

  if (req.method === "OPTIONS") {
    res.send(200)
  } else {
    next()
  }
})

app.get("/api/status", function(req, res, next) {
  res.json({
    server: "sciencekit",
    version: "0.2",
  })
})

//-----------------------------------------------------------------------------
// Resource Server (this is an OAuth2 term). The resource server stores the
// protected resources (API URIs that require authentication).
//-----------------------------------------------------------------------------

app.get("/api/account", controllers.account.read)
app.get("/api/timeline", controllers.timeline.read)
app.get("/api/entry/:id", controllers.timeline.readEntry)
app.get("/api/story", controllers.Story.read)
app.post("/api/story", controllers.Story.create)
app.post("/api/reflection", controllers.Reflection.create)
app.post("/api/page", controllers.Page.create)
app.post("/api/text", controllers.Text.create)
app.post("/api/question", controllers.Question.create)
app.post("/api/observation", controllers.Observation.create)
app.post("/api/sequence", controllers.Sequence.create)
app.post("/api/collaboration", controllers.Collaboration.create)
app.post("/api/identity", controllers.Identity.create)
app.post("/api/:activityType/tag", controllers.Tag.create)
app.get("/api/tag", controllers.Tag.read)
app.post("/api/note", controllers.Note.create)
app.get("/api/note", controllers.Note.read)
app.post("/api/:activityType/bump", controllers.Bump.create)
app.get("/api/bump", controllers.Bump.read)
app.post("/api/photo", controllers.Photo.create)
app.get("/api/photo/:id", controllers.Photo.read)
app.post("/api/video", controllers.Video.create)
app.post("/api/sketch", controllers.Sketch.create)

var server = http.createServer(app).listen(app.get("port"), function() {
  console.log("ScienceKit server listening on port " + app.get("port"))
})

//-----------------------------------------------------------------------------
// Sockets server configuration.
//-----------------------------------------------------------------------------

io = socketio.listen(server)

var connections = []

// Note: Do not preceed 'io' with 'var'.  This allows 'io' to be globally
// accessible, accessible in other modules.

io.on("connection", function(socket) {
  // Start custom authentication handshaking (request OAuth access token from client)
  socket.emit("oauthrequesttoken")

  // Handler for received "oauth" messages.
  // Authenticates the socket connection.
  socket.on("oauthtoken", function(msg) {
    console.log("'oauthtoken' event received: ", msg)

    var accessToken = msg || ""

    // Check if access token is valid.
    AccessToken.findOne({ token: accessToken }, function(err, token) {
      if (err) {
        socket.disconnect()
        return
      }
      if (!token) {
        socket.disconnect()
        return
      }
      console.log("Found access token: " + token)

      Account.findById(token.userID, function(err, account) {
        if (err) {
          socket.disconnect()
          return
        }
        if (!account) {
          socket.disconnect()
          return
        }
        console.log("Found account for received token: " + account)

        socket.emit("oauthtokensuccess")
      })
    })
  })

  // Handler for received "message" messages
  socket.on("message", function(msg) {
    console.log("'message' event received: ", msg)

    // Get access token (if any)... required.
    var message = JSON.parse(msg)
    var accessToken = message.token

    // Check if access token is valid.
    AccessToken.findOne({ token: accessToken }, function(err, token) {
      if (err) {
        socket.disconnect()
        return
      }
      if (!token) {
        socket.disconnect()
        return
      }

      Account.findById(token.userID, function(err, account) {
        if (err) {
          socket.disconnect()
          return
        }
        if (!account) {
          socket.disconnect()
          return
        }

        // Strip OAuth2 access token
        message = { account: account, message: message }

        socket.broadcast.emit("message", message)
      })
    })
  })

  socket.on("disconnect", function() {
    console.log("Socket disconnected.")
  })
})

io.configure(function() {
  io.set("authorization", function(handshakeData, callback) {
    var error = null
    var authorized = true
    callback(error, authorized)
  })
})

console.log(
  "ScienceKit server listening for socket/streaming connections on port " +
    app.get("port")
)
