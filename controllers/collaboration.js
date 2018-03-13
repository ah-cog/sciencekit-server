var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Collaboration = require("../models/collaboration")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    Account.findById(req.user.id, function(err, account) {
      var collaborationTemplate = req.body
      collaborationTemplate.account = account
      Inquiry.addCollaboration(collaborationTemplate, function(err, entry) {
        io.sockets.emit("collaboration", entry)
        res.json(entry)
      })
    })
  },
]
