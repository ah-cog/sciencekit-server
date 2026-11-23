var mongoose = require("mongoose")

var momentSchema = new mongoose.Schema({
  timeline: { type: mongoose.Schema.ObjectId, ref: "Timeline", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Moment" },
  entry: { type: mongoose.Schema.Types.ObjectId },
  entryType: { type: "String" },
  date: { type: Date, default: Date.now },
  hidden: Boolean,
})

module.exports = mongoose.model("Moment", momentSchema)
