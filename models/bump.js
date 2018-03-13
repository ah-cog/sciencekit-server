var mongoose = require("mongoose")
var Account = require("./account")

var bumpSchema = new mongoose.Schema({
  entry: { type: mongoose.Schema.Types.ObjectId, ref: "Moment" },

  tag: { type: String, default: "bump" },
  degree: { type: Number, default: 1 },

  date: { type: Date, default: Date.now },
  hidden: { type: Boolean, default: false },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
})

module.exports = mongoose.model("Bump", bumpSchema)
