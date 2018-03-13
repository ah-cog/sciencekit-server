var mongoose = require("mongoose")
var Account = require("./account")

var tagSchema = new mongoose.Schema({
  entry: { type: mongoose.Schema.Types.ObjectId },
  text: { type: String, required: true },
  hidden: Boolean,
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  date: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Tag", tagSchema)
