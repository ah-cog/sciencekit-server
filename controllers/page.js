var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Page = require("../models/page")
var Moment = require("../models/moment")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res, next) {
    var data = req.body
    Account.findById(req.user.id, function(err, account) {
      var pageTemplate = {
        account: account,
        story: data["story"],
        entry: data["entry"],
        group: data["group"],
        position: data["position"],
      }
      Inquiry.addPage(pageTemplate, function(err, entry) {
        io.sockets.emit("page", entry) // TODO: is this the wrong place?  better place?  guaranteed here?
        res.json(entry)
      })
    })
  },
]
