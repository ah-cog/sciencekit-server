var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Video = require("../models/video")
var Moment = require("../models/moment")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res, next) {
    var data = req.body
    var timeline = data.timeline
    Account.findById(req.user.id, function(err, account) {
      var activityTemplate = {}
      var filenameStart = req.files.file.path.indexOf("/uploads")
      activityTemplate.file = req.files.file
      activityTemplate.uri = req.files.file.path.substring(filenameStart)
      activityTemplate.account = account
      Inquiry.addVideo(activityTemplate, function(err, entry) {
        io.sockets.emit("video", entry)
        res.json(entry)
      })
    })
  },
]
