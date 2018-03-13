var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Story = require("../models/story")
var Page = require("../models/page")
var Inquiry = require("../models/inquiry")
var Timeline = require("../models/timeline")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    var data = req.body
    Account.findById(req.user.id, function(err, account) {
      var storyTemplate = {}
      storyTemplate.account = account
      storyTemplate.title = data["title"]

      Inquiry.addStory(storyTemplate, function(err, story) {
        io.sockets.emit("story", story)
        res.json(story)
      })
    })
  },
]

exports.read = [
  passport.authenticate("bearer", { session: false }),
  function(req, res, next) {
    var timelineId = req.query.timelineId

    if (timelineId) {
      Account.findById(req.user.id, function(err, account) {
        var result = []

        Story.find({ timeline: timelineId })
          .sort("-date")
          .exec(function(err, stories) {
            if (err) throw err

            var storyCount = stories.length

            stories.forEach(function(story, storyIndex) {
              story.populate({ path: "author" }, function(err, storyPopulated) {
                var storyObject = storyPopulated.toObject()
                storyObject.pages = []

                Page.find({ story: story._id, author: account })
                  .sort("date")
                  .exec(function(err, pages) {
                    if (err) throw err

                    var pageCount = pages.length
                    console.log(pageCount)

                    storyObject.pages = pages

                    if (pageCount > 0) {
                      pages.forEach(function(page) {
                        page.populate(
                          { path: "entry", model: page.entryType },
                          function(err, pagePopulated) {
                            page.populate({ path: "author" }, function(
                              err,
                              pagePopulated
                            ) {
                              if (
                                pagePopulated !== null &&
                                pagePopulated.entry !== null
                              ) {
                                pageCount--

                                if (pageCount <= 0) {
                                  result[storyIndex] = storyObject

                                  storyCount--

                                  if (storyCount <= 0) {
                                    res.json(result)
                                  }
                                }
                              } else {
                                pageCount--
                                if (pageCount <= 0) {
                                  res.json(result)
                                }
                              }
                            })
                          }
                        )
                      })
                    } else {
                      result[storyIndex] = storyObject
                      storyCount--
                      if (storyCount <= 0) {
                        res.json(result)
                      }
                    }
                  })
              })
            })
          })
      })
    }
  },
]
