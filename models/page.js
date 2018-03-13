var mongoose = require("mongoose")

var pageSchema = new mongoose.Schema({
  story: { type: mongoose.Schema.ObjectId, ref: "Story" },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  entry: { type: mongoose.Schema.ObjectId, ref: "Moment" },
  group: { type: Number, default: 0 },
  position: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  hidden: Boolean,
})

pageSchema.statics.getPopulated = function(page, fn) {
  this.findById(page.id, function(err, page) {
    page.populate({ path: "entry", model: "Moment" }, function(
      err,
      populatedMoment
    ) {
      populatedMoment.populate({ path: "author" }, function(
        err,
        populatedAuthor
      ) {
        fn(err, page)
      })
    })
  })
}

pageSchema.statics.getPopulated2 = function(page, fn) {
  page.populate({ path: "entry", model: "Moment" }, function(
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

module.exports = mongoose.model("Page", pageSchema)
