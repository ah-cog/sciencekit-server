var mongoose = require("mongoose")
var Account = require("./account")

var sketchSchema = new mongoose.Schema({
  moment: { type: mongoose.Schema.Types.ObjectId, ref: "Moment" },
  imageData: { type: String },
  imageWidth: { type: Number },
  imageHeight: { type: Number },
  date: { type: Date, default: Date.now },
  hidden: Boolean,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
})

module.exports = mongoose.model("Sketch", sketchSchema)
