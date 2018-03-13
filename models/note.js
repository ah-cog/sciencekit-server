var mongoose = require("mongoose")
var Account = require("./account")

var noteSchema = new mongoose.Schema({
  page: { type: mongoose.Schema.Types.ObjectId, ref: "Page" },
  note: { type: String, required: true },
  hidden: Boolean,
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  date: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Note", noteSchema)
