var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Tag = require("../models/tag")
var Moment = require("../models/moment")
var Inquiry = require("../models/inquiry")
var Timeline = require("../models/timeline")

exports.read = [
  function(req, res, next) {
    var entryId = req.query.entryId
    if (entryId) {
      Tag.find({ entry: entryId })
        .sort("text")
        .exec(function(err, tags) {
          if (err) throw err
          var result = []
          var tagCount = tags.length
          if (tagCount > 0) {
            res.json(tags)
          } else {
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

      if (template.text === undefined || template.text.length <= 0) {
        res.json({})
        return
      }

      Tag.findOne({ entry: template.entry, text: template.text }, function(
        err,
        existingTag
      ) {
        if (err) throw err
        if (existingTag === null) {
          Tag.create(
            {
              account: account,
              entry: template.entry,
              text: template.text,
            },
            function(err, tag) {
              if (err) throw err

              io.sockets.emit("tag", tag)
              res.json(tag)
            }
          )
        } else {
          io.sockets.emit("tag", existingTag)
          res.json(existingTag)
        }
      })
    })
  },
]

function getTagTimeline(tagText, fn) {
  Tag.find({ text: tagText }, function(err, tags) {
    if (err) throw err
    if (tags.length > 0) {
      console.log("Found " + tags.length + " Tags with text.")
      var tagsWithText = []
      var tagCount = tags.length
      for (var i = 0; i < tagCount; i++) {
        tagsWithText.push(tags[i]._id)
      }
      Moment.find({})
        .where("frame")
        .in(tagsWithText)
        .exec(function(err, moments) {
          if (err) throw err
          if (moments.length === 0) {
            fn(null, null)
          } else {
            var momentsForTags = []
            var momentCount = moments.length
            for (var i = 0; i < momentCount; i++) {
              momentsForTags.push(moments[i]._id)
            }
            Timeline.findOne({})
              .where("moment")
              .in(momentsForTags)
              .exec(function(err, timeline) {
                if (err) throw err
                fn(null, timeline)
              })
          }
        })
    }
  })
}
