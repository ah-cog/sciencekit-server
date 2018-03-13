var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Sequence = require("../models/sequence")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    Account.findById(req.user.id, function(err, account) {
      var entryTemplate = req.body
      entryTemplate.account = account

      Inquiry.addSequence(entryTemplate, function(err, entry) {
        io.sockets.emit("sequence", entry)
        res.json(entry)
      })
    })
  },
]
