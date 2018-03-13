var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Observation = require("../models/observation")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    Account.findById(req.user.id, function(err, account) {
      var entryTemplate = req.body
      entryTemplate.account = account
      console.log("Received: ")
      console.log(entryTemplate)
      console.log("Timeline = %s", entryTemplate.timeline)
      Inquiry.addObservation(entryTemplate, function(err, entry) {
        io.sockets.emit("observation", entry)
        res.json(entry)
      })
    })
  },
]
