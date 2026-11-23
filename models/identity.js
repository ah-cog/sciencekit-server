var mongoose = require("mongoose")

var identitySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  entry: { type: mongoose.Schema.ObjectId, ref: "Moment" },
  identity: { type: String },
  date: { type: Date, default: Date.now },
  hidden: Boolean,
})

module.exports = mongoose.model("Identity", identitySchema)
