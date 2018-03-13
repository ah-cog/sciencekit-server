var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Reflection = require("../models/reflection")
var Moment = require("../models/moment")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res, next) {
    var data = req.body

    Account.findById(req.user.id, function(err, account) {
      var reflectionTemplate = {
        account: account,
        text: data["text"],
      }

      Inquiry.addReflection(reflectionTemplate, function(err, entry) {
        io.sockets.emit("reflection", entry)
        res.json(entry)
      })
    })
  },
]
