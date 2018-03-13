var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Question = require("../models/question")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    Account.findById(req.user.id, function(err, account) {
      var entryTemplate = req.body
      entryTemplate.account = account

      Inquiry.addQuestion(entryTemplate, function(err, entry) {
        io.sockets.emit("question", entry)
        res.json(entry)
      })
    })
  },
]
