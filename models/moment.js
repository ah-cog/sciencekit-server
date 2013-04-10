var mongoose = require('mongoose');

var momentSchema = new mongoose.Schema({
    timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true }, // Timeline upon which this event occurred (not the one created for this event)

	element: { type: mongoose.Schema.Types.ObjectId, required: true }, // i.e., the referenced object itself
	elementType: { type: String, required: true }, // i.e., the "ref" value, e.g., 'ThoughtFrame'

    date: { type: Date, default: Date.now },
	hidden: Boolean
});

momentSchema.statics.createTimelineElement = function(timeline, element, fn) {

  var elementType = element.constructor.modelName;

  // Create timeline element
  this.create({
    timeline: timeline,
    elementType: elementType,
    element: element
  }, function(err, timelineElement) {
    if (err) {
      console.log('Error creating timeline element: ' + timelineElement);
    }
    console.log('Created timeline element: ' + timelineElement);

    // TODO: Update this to return the element element based on user's view
    fn(null, timelineElement);
  });
}

module.exports = mongoose.model('Moment', momentSchema); // Compile schema to a model