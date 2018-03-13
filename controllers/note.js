var passport = require("passport")
var socketio = require("socket.io")
var Account = require("../models/account")
var Note = require("../models/note")
var Inquiry = require("../models/inquiry")

exports.create = [
  passport.authenticate("bearer", { session: false }),
  function(req, res) {
    Account.findById(req.user.id, function(err, account) {
      var noteTemplate = req.body
      noteTemplate.account = account

      if (noteTemplate.note.length <= 0) {
        res.json({})
        return
      }

      Note.create(
        {
          account: noteTemplate.account,
          page: noteTemplate.page,
          note: noteTemplate.note,
        },
        function(err, note) {
          if (err) throw err

          note.populate({ path: "page", model: "Page" }, function(
            err,
            notePopulated
          ) {
            io.sockets.emit("note", note)
            res.json(note)
          })
        }
      )
    })
  },
]

exports.read = [
  function(req, res, next) {
    var pageId = null
    if (req.query["pageId"]) {
      pageId = req.query["pageId"]
    }
    console.log("Getting Notes for Page " + pageId)

    var result = []

    if (pageId !== null) {
      Note.findOne({ page: pageId })
        .sort("-date")
        .exec(function(err, note) {
          if (err) throw err

          if (note === null) {
            res.json([])
            return
          }

          note.populate({ path: "page", model: "Page" }, function(
            err,
            notePopulated
          ) {
            io.sockets.emit("note", notePopulated)
            res.json(notePopulated)
          })
        })
    } else {
      res.json(result)
    }
  },
]
