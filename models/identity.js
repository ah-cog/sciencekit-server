var mongoose = require("mongoose")

var identitySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  entry: { type: mongoose.Schema.ObjectId, ref: "Moment" },
  identity: { type: String },
  date: { type: Date, default: Date.now },
  hidden: Boolean,
})

identitySchema.statics.getPopulated = function(identity, fn) {
  this.findById(identity.id, function(err, identity) {
    identity.populate({ path: "entry", model: "Moment" }, function(
      err,
      populatedMoment
    ) {
      populatedMoment.populate({ path: "author" }, function(
        err,
        populatedAuthor
      ) {
        fn(err, identity)
      })
    })
  })
}

identitySchema.statics.getPopulated2 = function(identity, fn) {
  identity.populate({ path: "entry", model: "Moment" }, function(
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

module.exports = mongoose.model("Identity", identitySchema)
