var mongoose = require('mongoose');

var momentSchema = new mongoose.Schema({
    timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true }, // Timeline upon which this event occurred (not the one created for this event)

    frame: { type: mongoose.Schema.Types.ObjectId, required: true }, // i.e., the referenced object itself
    frameType: { type: String, required: true }, // i.e., the "ref" value, e.g., 'ThoughtFrame'

    date: { type: Date, default: Date.now },
    hidden: Boolean
});

// momentSchema.statics.createTimelineElement = function(timeline, activity, fn) {

//   var activityType = activity.constructor.modelName;

//   // Create timeline Activity
//   this.create({
//     timeline: timeline,
//     activityType: activityType,
//     activity: activity
//   }, function(err, timelineActivity) {
//     if (err) {
//       console.log('Error creating timeline Activity: ' + timelineActivity);
//     }
//     console.log('Created timeline Activity: ' + timelineActivity);

//     // TODO: Update this to return the Activity based on user's view
//     fn(null, timelineActivity);
//   });
// }

module.exports = mongoose.model('Moment', momentSchema); // Compile schema to a model