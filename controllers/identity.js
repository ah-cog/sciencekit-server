var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Identity = require("../models/identity")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    Account.findById(req.user.id, function(err, account) {
      var entryTemplate = req.body
      entryTemplate.account = account
      console.log("Received: ")
      console.log(entryTemplate)
      Inquiry.addIdentity(entryTemplate, function(err, entry) {
        io.sockets.emit("identity", entry)
        res.json(entry)
      })
    })
  },
]
