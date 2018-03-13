var mongoose = require("mongoose")
var Account = require("./account")

var textSchema = new mongoose.Schema({
  moment: { type: mongoose.Schema.Types.ObjectId, ref: "Moment" },
  date: { type: Date, default: Date.now },
  hidden: Boolean,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
})

module.exports = mongoose.model("Text", textSchema)
