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

momentSchema.statics.getPopulated = function(moment, fn) {
  this.findById(moment.id, function(err, moment) {
    moment.populate({ path: "entry", model: moment.entryType }, function(
      err,
      populatedMoment
    ) {
      populatedMoment.populate({ path: "author" }, function(
        err,
        populatedAuthor
      ) {
        fn(err, moment)
      })
    })
  })
}

momentSchema.statics.getPopulated2 = function(moment, fn) {
  moment.populate({ path: "entry", model: moment.entryType }, function(
    err,
    populatedMoment
  ) {
    populatedMoment.populate({ path: "author" }, function(
      err,
      populatedAuthor
    ) {
      fn(err, populatedMoment)
    })
  })
}

module.exports = mongoose.model("Moment", momentSchema)
