var mongoose = require("mongoose")

var pageSchema = new mongoose.Schema({
  story: { type: mongoose.Schema.ObjectId, ref: "Story" },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  entry: { type: mongoose.Schema.ObjectId, ref: "Moment" },
  group: { type: Number, default: 0 },
  position: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  hidden: Boolean,
})

module.exports = mongoose.model("Page", pageSchema)
