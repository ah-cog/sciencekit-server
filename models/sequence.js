var mongoose = require("mongoose")
var Account = require("./account")

var sequenceSchema = new mongoose.Schema({
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Moment" },
  steps: [
    {
      step: String,
    },
  ],
  date: { type: Date, default: Date.now },
  hidden: Boolean,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
})

module.exports = mongoose.model("Sequence", sequenceSchema)
