var mongoose = require("mongoose")

var collaborationSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  entry: { type: mongoose.Schema.ObjectId, ref: "Moment" },
  authors: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    },
  ],
  date: { type: Date, default: Date.now },
  hidden: Boolean,
})

module.exports = mongoose.model("Collaboration", collaborationSchema)
