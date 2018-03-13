var mongoose = require("mongoose")
var Timeline = require("./timeline")
var Story = require("./story")
var Page = require("./page")
var Moment = require("./moment")
var Text = require("./text")
var Question = require("./question")
var Observation = require("./observation")
var Sequence = require("./sequence")
var Photo = require("./photo")
var Collaboration = require("./collaboration")
var Identity = require("./identity")
var Video = require("./video")
var Note = require("./note")
var Sketch = require("./sketch")
var Reflection = require("./reflection")
var ffmpeg = require("fluent-ffmpeg")

var inquirySchema = new mongoose.Schema({
  timeline: { type: mongoose.Schema.ObjectId, ref: "Timeline", required: true },
  date: { type: Date, default: Date.now },
  hidden: Boolean,
})

inquirySchema.statics.getTimelineById = function(timelineId, fn) {
  Timeline.findById(timelineId, function(err, timeline) {
    if (err) throw err
    if (timeline === null) fn("Could not find Timeline.")
    fn(null, timeline)
  })
}

inquirySchema.statics.createTimelineByActivity = function(activity, fn) {
  var activityType = activity.constructor.modelName
  var timeline = new Timeline()
  timeline.save(function(err) {
    if (err) {
      console.log("Error creating Timeline for Activity: " + activity)
      throw err
    }

    var moment = new Moment({
      timeline: timeline,
      frame: activity,
      frameType: activityType,
    })

    moment.save(function(err) {
      if (err) {
        console.log("Error creating Timeline for Moment: " + moment)
        throw err
      }

      timeline.moment = moment
      timeline.save(function(err) {
        if (err) {
          console.log("Could not save updated Timeline.")
          throw err
        }
      })

      fn(null, timeline)
    })
  })
}

inquirySchema.statics.addText = function(entryTemplate, fn) {
  entryTemplate.type = "Text"
  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        entryTemplate.timeline = timeline._id
      })
  }

  Text.create(
    {
      author: entryTemplate.account,
    },
    function(err, entry) {
      if (err) throw err

      Moment.create(
        {
          timeline: entryTemplate.timeline,
          author: entryTemplate.account,
          entry: entry,
          entryType: entry.constructor.modelName,
        },
        function(err, entry) {
          if (err) throw err

          entry.populate({ path: "entry", model: entry.entryType }, function(
            err,
            entryPopulated
          ) {
            entryPopulated.populate({ path: "author" }, function(
              err,
              populatedAuthor
            ) {
              fn(null, entryPopulated)
            })
          })
        }
      )
    }
  )
}

inquirySchema.statics.addCollaboration = function(entryTemplate, fn) {
  entryTemplate.type = "Collaboration"

  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        entryTemplate.timeline = timeline._id
      })
  }

  if (!entryTemplate.hasOwnProperty("parent")) {
    console.log("Cannot add Collaboration.  Required properties are missing.")
    fn("Cannot add Collaboration.  Required properties are missing.")
  }

  Collaboration.create(
    {
      author: entryTemplate.account,
      entry: entryTemplate.parent,
      authors: entryTemplate.authors,
    },
    function(err, entry) {
      if (err) throw err
      fn(null, entry)
    }
  )
}

inquirySchema.statics.addIdentity = function(entryTemplate, fn) {
  entryTemplate.type = "Identity"
  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) {
          throw err
        }
        entryTemplate.timeline = timeline._id
      })
  }

  if (!entryTemplate.hasOwnProperty("identity")) {
    console.log("Cannot add Identity.  Required properties are missing.")
    fn("Cannot add Identity.  Required properties are missing.")
  }

  Identity.create(
    {
      author: entryTemplate.account,
      parent: entryTemplate.parent,
      identity: entryTemplate.identity,
    },
    function(err, entry) {
      if (err) throw err
      fn(null, entry)
    }
  )
}

inquirySchema.statics.addQuestion = function(entryTemplate, fn) {
  entryTemplate.type = "Question"
  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        entryTemplate.timeline = timeline._id
      })
  }

  if (!entryTemplate.hasOwnProperty("text")) {
    console.log("Cannot add Question.  Required properties are missing.")
    fn("Cannot add Question.  Required properties are missing.")
  }

  Question.create(
    {
      author: entryTemplate.account,
      parent: entryTemplate.parent,
      question: entryTemplate.text,
    },
    function(err, entry) {
      if (err) throw err
      Moment.create(
        {
          timeline: entryTemplate.timeline,
          author: entryTemplate.account,
          entry: entry,
          entryType: entry.constructor.modelName,
        },
        function(err, entry) {
          if (err) throw err
          entry.populate({ path: "entry", model: entry.entryType }, function(
            err,
            entryPopulated
          ) {
            entryPopulated.populate({ path: "author" }, function(
              err,
              populatedAuthor
            ) {
              fn(null, entryPopulated)
            })
          })
        }
      )
    }
  )
}

inquirySchema.statics.addObservation = function(entryTemplate, fn) {
  entryTemplate.type = "Observation"
  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        entryTemplate.timeline = timeline._id
      })
  }

  if (
    !entryTemplate.hasOwnProperty("cause") ||
    !entryTemplate.hasOwnProperty("effect")
  ) {
    console.log("Cannot add Observation.  Required properties are missing.")
    fn("Cannot add Observation.  Required properties are missing.")
  }

  Observation.create(
    {
      author: entryTemplate.account,
      parent: entryTemplate.parent,
      effect: entryTemplate.effect,
      cause: entryTemplate.cause,
    },
    function(err, entry) {
      if (err) throw err
      Moment.create(
        {
          timeline: entryTemplate.timeline,
          author: entryTemplate.account,
          entry: entry,
          entryType: entry.constructor.modelName,
        },
        function(err, entry) {
          if (err) throw err
          entry.populate({ path: "entry", model: entry.entryType }, function(
            err,
            entryPopulated
          ) {
            entryPopulated.populate({ path: "author" }, function(
              err,
              populatedAuthor
            ) {
              fn(null, entryPopulated)
            })
          })
        }
      )
    }
  )
}

inquirySchema.statics.addSequence = function(entryTemplate, fn) {
  entryTemplate.type = "Sequence"
  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) {
          throw err
        }
        entryTemplate.timeline = timeline._id
      })
  }

  if (!entryTemplate.hasOwnProperty("steps")) {
    console.log("Cannot add Sequence.  Required properties are missing.")
    fn("Cannot add Sequence.  Required properties are missing.")
  }

  Sequence.create(
    {
      author: entryTemplate.account,
      parent: entryTemplate.parent,
      steps: entryTemplate.steps,
    },
    function(err, entry) {
      if (err) throw err
      Moment.create(
        {
          timeline: entryTemplate.timeline,
          author: entryTemplate.account,
          entry: entry,
          entryType: entry.constructor.modelName,
        },
        function(err, entry) {
          if (err) throw err
          entry.populate({ path: "entry", model: entry.entryType }, function(
            err,
            entryPopulated
          ) {
            entryPopulated.populate({ path: "author" }, function(
              err,
              populatedAuthor
            ) {
              fn(null, entryPopulated)
            })
          })
        }
      )
    }
  )
}

inquirySchema.statics.addPhoto = function(entryTemplate, fn) {
  entryTemplate.type = "Photo"
  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        entryTemplate.timeline = timeline._id
      })
  }

  Photo.create(
    {
      uri: entryTemplate.uri,
      author: entryTemplate.account,
    },
    function(err, entry) {
      if (err) throw err
      Moment.create(
        {
          timeline: entryTemplate.timeline,
          author: entryTemplate.account,
          entry: entry,
          entryType: entry.constructor.modelName,
        },
        function(err, entry) {
          if (err) throw err
          entry.populate({ path: "entry", model: entry.entryType }, function(
            err,
            entryPopulated
          ) {
            entryPopulated.populate({ path: "author" }, function(
              err,
              populatedAuthor
            ) {
              fn(null, entry)
            })
          })
        }
      )
    }
  )
}

inquirySchema.statics.addVideo = function(entryTemplate, fn) {
  entryTemplate.type = "Video"
  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        entryTemplate.timeline = timeline._id
      })
  }

  Video.create(
    {
      uri: entryTemplate.uri,
      author: entryTemplate.account,
    },
    function(err, entry) {
      if (err) throw err
      var proc = new ffmpeg({ source: entryTemplate.file.path })
        .withSize("480x360")
        .takeScreenshots(
          {
            count: 1,
            filename: entryTemplate.uri.split("/")[2].split(".")[0],
          },
          "./public/thumbnails",
          function(err, filenames) {
            if (err) {
              throw err
            }
            console.log(filenames)
            console.log("screenshots were saved")
          }
        )

      Moment.create(
        {
          timeline: entryTemplate.timeline,
          author: entryTemplate.account,
          entry: entry,
          entryType: entry.constructor.modelName,
        },
        function(err, entry) {
          if (err) throw err
          entry.populate({ path: "entry", model: entry.entryType }, function(
            err,
            entryPopulated
          ) {
            entryPopulated.populate({ path: "author" }, function(
              err,
              populatedAuthor
            ) {
              fn(null, entry)
            })
          })
        }
      )
    }
  )
}

inquirySchema.statics.addSketch = function(entryTemplate, fn) {
  entryTemplate.type = "Sketch"
  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        entryTemplate.timeline = timeline._id
      })
  }
  Sketch.create(
    {
      imageData: entryTemplate.imageData,
      imageWidth: entryTemplate.imageWidth,
      imageHeight: entryTemplate.imageHeight,
      author: entryTemplate.account,
    },
    function(err, entry) {
      if (err) throw err
      Moment.create(
        {
          timeline: entryTemplate.timeline,
          author: entryTemplate.account,
          entry: entry,
          entryType: entry.constructor.modelName,
        },
        function(err, entry) {
          if (err) throw err
          entry.populate({ path: "entry", model: entry.entryType }, function(
            err,
            entryPopulated
          ) {
            entryPopulated.populate({ path: "author" }, function(
              err,
              populatedAuthor
            ) {
              fn(null, entry)
            })
          })
        }
      )
    }
  )
}

inquirySchema.statics.addReflection = function(entryTemplate, fn) {
  entryTemplate.type = "Reflection"
  if (!entryTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        entryTemplate.timeline = timeline._id
        createReflection()
      })
  } else {
    createReflection()
  }

  function createReflection() {
    Reflection.create(
      {
        text: entryTemplate.text,
        author: entryTemplate.account,
      },
      function(err, entry) {
        if (err) throw err
        Moment.create(
          {
            timeline: entryTemplate.timeline,
            author: entryTemplate.account,
            entry: entry,
            entryType: entry.constructor.modelName,
          },
          function(err, entry) {
            if (err) throw err
            entry.populate({ path: "entry", model: entry.entryType }, function(
              err,
              entryPopulated
            ) {
              entryPopulated.populate({ path: "author" }, function(
                err,
                populatedAuthor
              ) {
                fn(null, entry)
              })
            })
          }
        )
      }
    )
  }
}

inquirySchema.statics.addPage = function(pageTemplate, fn) {
  pageTemplate.type = "Page"
  if (!pageTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        pageTemplate.timeline = timeline._id
        Page.create(
          {
            timeline: pageTemplate.timeline,

            story: pageTemplate.story,
            entry: pageTemplate.entry,
            group: pageTemplate.group,
            position: pageTemplate.position,
            author: pageTemplate.account,
          },
          function(err, page) {
            if (err) throw err
            page.populate({ path: "author" }, function(err, populatedAuthor) {
              fn(null, page)
            })
            return
          }
        )
      })
  }
}

inquirySchema.statics.addStory = function(storyTemplate, fn) {
  storyTemplate.type = "Story"
  if (!storyTemplate.hasOwnProperty("title")) {
    console.log("Cannot add Story.  Required properties are missing.")
    fn("Cannot add Story.  Required properties are missing.")
  }
  if (!storyTemplate.hasOwnProperty("timeline")) {
    Timeline.findOne({})
      .sort("date")
      .exec(function(err, timeline) {
        if (err) throw err
        storyTemplate.timeline = timeline._id
        Story.create(
          {
            timeline: storyTemplate.timeline,
            title: storyTemplate.title,
            author: storyTemplate.account,
          },
          function(err, story) {
            if (err) throw err
            story.populate({ path: "author" }, function(err, populatedAuthor) {
              fn(null, story)
            })
            return

            for (entryGroup in storyTemplate.entries) {
              for (entryPosition in storyTemplate.entries[entryGroup]) {
                Page.create(
                  {
                    story: story,
                    author: storyTemplate.account,
                    entry:
                      storyTemplate.entries[entryGroup][entryPosition].entry,
                    group:
                      storyTemplate.entries[entryGroup][entryPosition]["group"],
                    position:
                      storyTemplate.entries[entryGroup][entryPosition][
                        "position"
                      ],
                  },
                  function(err, page) {
                    if (err) throw err
                    page.populate({ path: "entry", model: "Moment" }, function(
                      err,
                      pagePopulated
                    ) {
                      pagePopulated.populate({ path: "author" }, function(
                        err,
                        populatedAuthor
                      ) {
                        fn(null, pagePopulated)
                      })
                    })
                  }
                )
              }
            }
          }
        )
      })
  }
}

module.exports = mongoose.model("Inquiry", inquirySchema) // Compile schema to a model
