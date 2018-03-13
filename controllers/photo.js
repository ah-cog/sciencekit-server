var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Photo = require("../models/photo")
var Moment = require("../models/moment")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res, next) {
    var data = req.body
    var timeline = data.timeline
    Account.findById(req.user.id, function(err, account) {
      var photoTemplate = {}
      var filenameStart = req.files.myphoto.path.indexOf("/uploads")
      photoTemplate.file = req.files.myphoto
      photoTemplate.uri = req.files.myphoto.path.substring(filenameStart)
      photoTemplate.account = account
      Inquiry.addPhoto(photoTemplate, function(err, entry) {
        io.sockets.emit("photo", entry)
        res.json(entry)
      })
    })
  },
]

exports.read = [
  function(req, res, next) {
    var id = req.params.id
    console.log("requesting image id = " + id)
    if (id) {
      Frame.findById(id, function(err, frame) {
        res.json(frame)
      })
    }
  },
]
