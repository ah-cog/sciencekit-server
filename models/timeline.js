var mongoose = require("mongoose")
var Moment = require("moment")

var timelineSchema = new mongoose.Schema({
  hidden: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Timeline", timelineSchema)
