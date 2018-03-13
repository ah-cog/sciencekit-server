var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Text = require("../models/text")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    Account.findById(req.user.id, function(err, account) {
      var textTemplate = req.body
      textTemplate.account = account
      Inquiry.addText(textTemplate, function(err, entry) {
        io.sockets.emit("text", entry)
        res.json(entry)
      })
    })
  },
]
