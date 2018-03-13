var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Timeline = require("../models/timeline")
var Moment = require("../models/moment")
var Photo = require("../models/photo")
var Bump = require("../models/bump")
var Collaboration = require("../models/collaboration")
var Identity = require("../models/identity")
var Question = require("../models/question")
var Observation = require("../models/observation")
var Sequence = require("../models/sequence")
var Inquiry = require("../models/inquiry")

exports.read = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    conditions = {}
    if (req.query["id"]) {
      conditions["_id"] = req.query["id"]
      getTimeline()
    } else if (req.query["moment_id"]) {
      conditions["moment"] = req.query["moment_id"]
      getTimeline()
    } else if (req.query["frameId"]) {
      Moment.findOne({ frame: req.query["frameId"] }, function(err, moment) {
        if (moment === null) {
          conditions["moment"] = moment.id
          getTimeline()
        }
      })
    } else {
      getTimeline()
    }

    function getTimeline() {
      Timeline.findOne(conditions)
        .sort("date")
        .exec(function(err, timeline) {
          if (err) {
            console.log(err)
            throw err
          } else {
            if (timeline === null) {
              return res.json({})
            }

            var result = {}
            result._id = timeline._id
            result.moment = timeline.moment

            var momentConditions = { timeline: timeline.id }
            if (req.query["accountId"]) {
              momentConditions["author"] = req.query["accountId"]
            }
            Moment.find(momentConditions)
              .sort("-date")
              .limit(75)
              .exec(function(err, moments) {
                if (moments !== null && moments.length > 0) {
                  var resultEntries = []
                  var count = moments.length
                  console.log(count)
                  moments.forEach(function(moment, momentIndex, momentArray) {
                    Question.find({ parent: moment._id })
                      .sort("-date")
                      .exec(function(err, questions) {
                        Observation.find({ parent: moment._id })
                          .sort("-date")
                          .exec(function(err, observations) {
                            Sequence.find({ parent: moment._id })
                              .sort("-date")
                              .exec(function(err, sequences) {
                                Bump.find({ entry: moment._id })
                                  .sort("-date")
                                  .exec(function(err, bumps) {
                                    Collaboration.find({ entry: moment._id })
                                      .sort("-date")
                                      .exec(function(err, collaborations) {
                                        moment.populate(
                                          {
                                            path: "entry",
                                            model: moment.entryType,
                                          },
                                          function(err, momentPopulated) {
                                            moment.populate(
                                              { path: "author" },
                                              function(err, momentPopulated) {
                                                if (
                                                  momentPopulated !== null &&
                                                  momentPopulated.entry !== null
                                                ) {
                                                  var entryObject = momentPopulated.toObject()
                                                  if (
                                                    questions !== null &&
                                                    questions.length > 0
                                                  ) {
                                                    entryObject.questions = questions
                                                  }
                                                  if (
                                                    observations !== null &&
                                                    observations.length > 0
                                                  ) {
                                                    entryObject.observations = observations
                                                  }
                                                  if (
                                                    sequences !== null &&
                                                    sequences.length > 0
                                                  ) {
                                                    entryObject.sequences = sequences
                                                  }
                                                  if (
                                                    bumps !== null &&
                                                    bumps.length > 0
                                                  ) {
                                                    entryObject.bumps = bumps
                                                  }

                                                  if (
                                                    collaborations !== null &&
                                                    collaborations.length > 0
                                                  ) {
                                                    entryObject.collaborations = collaborations
                                                  }

                                                  resultEntries[
                                                    moments.length -
                                                      momentIndex -
                                                      1
                                                  ] = entryObject

                                                  count--

                                                  if (count <= 0) {
                                                    result.moments = resultEntries
                                                    res.json(result)
                                                  }
                                                } else {
                                                  count--
                                                  if (count <= 0) {
                                                    result.moments = resultEntries
                                                    res.json(result)
                                                  }
                                                }
                                              }
                                            )
                                          }
                                        )
                                      })
                                  })
                              })
                          })
                      })
                  })
                } else {
                  res.json({})
                }
              })
          }
        })
    }
  },
]

exports.readStoryHack = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    conditions = {}
    if (req.query["id"]) {
      conditions["_id"] = req.query["id"]
      getTimeline()
    } else if (req.query["moment_id"]) {
      conditions["moment"] = req.query["moment_id"]
      getTimeline()
    } else if (req.query["frameId"]) {
      Moment.findOne({ frame: req.query["frameId"] }, function(err, moment) {
        if (moment !== null) {
          console.log("Found Moment:" + moment.id)
          conditions["moment"] = moment.id
          getTimeline()
        }
      })
    } else {
      getTimeline()
    }

    function getTimeline() {
      Timeline.findOne(conditions)
        .sort("date")
        .exec(function(err, timeline) {
          if (err) {
            console.log(err)
            throw err
          } else {
            if (timeline === null) {
              return res.json({})
            }

            var result = {}
            result._id = timeline._id
            result.moment = timeline.moment

            var resultEntries = []
            var bumpEntryCount = 0

            Bump.find({ account: req.user.id })
              .sort("-date")
              .exec(function(err, bumps) {
                if (err) throw err

                var count = bumps.length
                bumps.forEach(function(bump, bumpIndex, bumpArray) {
                  Moment.find({ _id: bump.entry })
                    .sort("-date")
                    .exec(function(err, moments) {
                      if (moments !== null && moments.length > 0) {
                        var count = moments.length
                        moments.forEach(function(
                          moment,
                          momentIndex,
                          momentArray
                        ) {
                          Question.find({ parent: moment._id })
                            .sort("-date")
                            .exec(function(err, questions) {
                              Observation.find({ parent: moment._id })
                                .sort("-date")
                                .exec(function(err, observations) {
                                  Sequence.find({ parent: moment._id })
                                    .sort("-date")
                                    .exec(function(err, sequences) {
                                      Bump.find({ entry: moment._id })
                                        .sort("-date")
                                        .exec(function(err, bumps) {
                                          Collaboration.find({
                                            entry: moment._id,
                                          })
                                            .sort("-date")
                                            .exec(function(
                                              err,
                                              collaborations
                                            ) {
                                              moment.populate(
                                                {
                                                  path: "entry",
                                                  model: moment.entryType,
                                                },
                                                function(err, momentPopulated) {
                                                  moment.populate(
                                                    { path: "author" },
                                                    function(
                                                      err,
                                                      momentPopulated
                                                    ) {
                                                      if (
                                                        momentPopulated !==
                                                          null &&
                                                        momentPopulated.entry !==
                                                          null
                                                      ) {
                                                        var entryObject = momentPopulated.toObject()
                                                        if (
                                                          questions !== null &&
                                                          questions.length > 0
                                                        ) {
                                                          entryObject.questions = questions
                                                        }
                                                        if (
                                                          observations !==
                                                            null &&
                                                          observations.length >
                                                            0
                                                        ) {
                                                          entryObject.observations = observations
                                                        }
                                                        if (
                                                          sequences !== null &&
                                                          sequences.length > 0
                                                        ) {
                                                          entryObject.sequences = sequences
                                                        }
                                                        if (
                                                          bumps !== null &&
                                                          bumps.length > 0
                                                        ) {
                                                          entryObject.bumps = bumps
                                                        }
                                                        if (
                                                          collaborations !==
                                                            null &&
                                                          collaborations.length >
                                                            0
                                                        ) {
                                                          entryObject.collaborations = collaborations
                                                        }
                                                        resultEntries[
                                                          bumpEntryCount
                                                        ] = entryObject

                                                        bumpEntryCount++

                                                        count--
                                                      } else {
                                                        count--
                                                      }
                                                    }
                                                  )
                                                }
                                              )
                                            })
                                        })
                                    })
                                })
                            })
                        })
                      }
                    })
                })
              })

            var momentConditions = {
              timeline: timeline.id,
              author: req.user.id,
            }

            Moment.find(momentConditions)
              .sort("-date")
              .exec(function(err, moments) {
                if (moments !== null && moments.length > 0) {
                  var count = moments.length
                  moments.forEach(function(moment, momentIndex, momentArray) {
                    Question.find({ parent: moment._id })
                      .sort("-date")
                      .exec(function(err, questions) {
                        Observation.find({ parent: moment._id })
                          .sort("-date")
                          .exec(function(err, observations) {
                            Sequence.find({ parent: moment._id })
                              .sort("-date")
                              .exec(function(err, sequences) {
                                Bump.find({ entry: moment._id })
                                  .sort("-date")
                                  .exec(function(err, bumps) {
                                    Collaboration.find({ entry: moment._id })
                                      .sort("-date")
                                      .exec(function(err, collaborations) {
                                        moment.populate(
                                          {
                                            path: "entry",
                                            model: moment.entryType,
                                          },
                                          function(err, momentPopulated) {
                                            moment.populate(
                                              { path: "author" },
                                              function(err, momentPopulated) {
                                                if (
                                                  momentPopulated !== null &&
                                                  momentPopulated.entry !== null
                                                ) {
                                                  var entryObject = momentPopulated.toObject()
                                                  if (
                                                    questions !== null &&
                                                    questions.length > 0
                                                  ) {
                                                    entryObject.questions = questions
                                                  }
                                                  if (
                                                    observations !== null &&
                                                    observations.length > 0
                                                  ) {
                                                    entryObject.observations = observations
                                                  }
                                                  if (
                                                    sequences !== null &&
                                                    sequences.length > 0
                                                  ) {
                                                    entryObject.sequences = sequences
                                                  }
                                                  if (
                                                    bumps !== null &&
                                                    bumps.length > 0
                                                  ) {
                                                    entryObject.bumps = bumps
                                                  }
                                                  if (
                                                    collaborations !== null &&
                                                    collaborations.length > 0
                                                  ) {
                                                    entryObject.collaborations = collaborations
                                                  }

                                                  resultEntries[
                                                    bumpEntryCount
                                                  ] = entryObject
                                                  bumpEntryCount++

                                                  count--

                                                  if (count <= 0) {
                                                    result.moments = resultEntries
                                                    res.json(result)
                                                  }
                                                } else {
                                                  count--
                                                  if (count <= 0) {
                                                    result.moments = resultEntries
                                                    res.json(result)
                                                  }
                                                }
                                              }
                                            )
                                          }
                                        )
                                      })
                                  })
                              })
                          })
                      })
                  })
                } else {
                  res.json({})
                }
              })
          }
        })
    }
  },
]

exports.readEntry = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    var entryId = req.params.id
    Moment.findOne({ _id: entryId }, function(err, moment) {
      Question.find({ parent: moment._id })
        .sort("-date")
        .exec(function(err, questions) {
          Observation.find({ parent: moment._id })
            .sort("-date")
            .exec(function(err, observations) {
              Sequence.find({ parent: moment._id })
                .sort("-date")
                .exec(function(err, sequences) {
                  Bump.find({ entry: moment._id })
                    .sort("-date")
                    .exec(function(err, bumps) {
                      Collaboration.find({ entry: moment._id })
                        .sort("-date")
                        .exec(function(err, collaborations) {
                          moment.populate(
                            { path: "entry", model: moment.entryType },
                            function(err, momentPopulated) {
                              moment.populate({ path: "author" }, function(
                                err,
                                momentPopulated
                              ) {
                                if (
                                  momentPopulated !== null &&
                                  momentPopulated.entry !== null
                                ) {
                                  var entryObject = momentPopulated.toObject()

                                  if (
                                    questions !== null &&
                                    questions.length > 0
                                  ) {
                                    entryObject.questions = questions
                                  }

                                  if (
                                    observations !== null &&
                                    observations.length > 0
                                  ) {
                                    entryObject.observations = observations
                                  }

                                  if (
                                    sequences !== null &&
                                    sequences.length > 0
                                  ) {
                                    entryObject.sequences = sequences
                                  }

                                  if (bumps !== null && bumps.length > 0) {
                                    entryObject.bumps = bumps
                                  }

                                  if (
                                    collaborations !== null &&
                                    collaborations.length > 0
                                  ) {
                                    entryObject.collaborations = collaborations
                                  }
                                  res.json(entryObject)
                                } else {
                                  res.json(entryObject)
                                }
                              })
                            }
                          )
                        })
                    })
                })
            })
        })
    })
  },
]

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    var timelineTemplate = req.body
    Timeline.create(
      {
        moment: timelineTemplate.moment,
        frameType: timelineTemplate.activityType,
      },
      function(err, timeline) {
        if (err) throw err
        res.json(timeline)
        io.sockets.emit("timeline", timeline)
      }
    )
  },
]
