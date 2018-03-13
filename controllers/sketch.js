var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Sketch = require("../models/sketch")
var Moment = require("../models/moment")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res, next) {
    var data = req.body
    Account.findById(req.user.id, function(err, account) {
      var activityTemplate = {}
      activityTemplate.account = account
      activityTemplate.imageData = data["imageData"]
      activityTemplate.imageWidth = data["imageWidth"]
      activityTemplate.imageHeight = data["imageHeight"]

      Inquiry.addSketch(activityTemplate, function(err, entry) {
        io.sockets.emit("sketch", entry)
        res.json(entry)
      })
    })
  },
]
