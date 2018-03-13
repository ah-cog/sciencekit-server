var passport = require("passport"),
var socketio = require("socket.io")
var Account = require("../models/account")
var Bump = require("../models/bump")
var Moment = require("../models/moment")
var Inquiry = require("../models/inquiry")
var Timeline = require("../models/timeline")

exports.read = [
  function(req, res, next) {
    var entryId = req.query.entryId
    console.log("Getting Bumps for Entry " + entryId)
    if (entryId) {
      Bump.find({ entry: entryId })
        .sort("tag")
        .exec(function(err, bumps) {
          if (err) {
              throw err
          }
          console.log("Got Bump count: " + bumps.length)
          var bumpCount = bumps.length
          if (bumpCount > 0) {
            res.json(bumps)
          } else {
            var result = []
            res.json(result)
          }
        })
    }
  },
]

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    Account.findById(req.user.id, function(err, account) {
      var activityType = req.params.activityType
      var template = req.body
      template.account = account
      console.log("Received Bump template: ")
      console.log(template)
      Bump.findOne(
        { account: account, entry: template.entry, text: template.text },
        function(err, existingBump) {
          if (err) {
            throw err
          }
          if (existingBump === null) {
            Bump.create(
              {
                account: account,
                entry: template.entry,
                tag: template.tag,
                degree: template.degree,
              },
              function(err, bump) {
                if (err) throw err

                io.sockets.emit("bump", bump)
                res.json(bump)
              }
            )
          } else {
            console.log("Bump already exists!")
            io.sockets.emit("bump", existingBump)
            res.json(existingBump)
          }
        }
      )
    })
  },
]
