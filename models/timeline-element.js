var mongoose = require('mongoose')
	, Timeline = require('./timeline');

var timelineElementSchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true },

	element: { type: mongoose.Schema.Types.ObjectId, required: true }, // i.e., the referenced object itself
	elementType: { type: String, required: true }, // i.e., the "ref" value, e.g., 'Thought'

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

timelineElementSchema.statics.getOrCreate = function(element, fn) {

  // Store reference to TimelineElement object
  var myThis = this;

  this.findOne({ element: element }, function(err, existingTimelineElement) {
    if(err) throw err;

    // Check if a element exists with the specified ID.  If not, create a new element.
    if(existingTimelineElement !== null && existingTimelineElement.length > 0) {
      console.log("Found existing timeline element: " + existingTimelineElement);

      // Create timeline element
      fn(null, existingTimelineElement);

    } else {

      var elementType = element.constructor.modelName;

      // Save a new timeline element to datastore
      var timelineElement = new myThis({
        timeline: element.timeline,
        elementType: elementType,
        element: element
      });
      console.log('Saving timeline element: ' + timelineElement);
      timelineElement.save(function(err) {
        // if(err) throw err;
        if (err) {
          console.log('Error creating timeline element: ' + timelineElement);
        }
        console.log('Created timeline element: ' + timelineElement);

        // Create timeline element
        fn(null, timelineElement);
      });
    }
  });
}

timelineElementSchema.statics.createTimelineElement = function(timeline, element, fn) {

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

module.exports = mongoose.model('TimelineElement', timelineElementSchema); // Compile schema to a model