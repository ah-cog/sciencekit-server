var mongoose = require('mongoose')
	, Timeline = require('./timeline');

var timelineElementSchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true },

	element: { type: mongoose.Schema.Types.ObjectId }, // i.e., the referenced object itself
	elementType: { type: String, required: true }, // i.e., the "ref" value, e.g., 'Thought'

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

// timelineElementSchema.methods.create = function(timeline, elementType, element, next) {
//         // Create timeline element
//         var timelineElement = new TimelineElement({
//           timeline: timelineId,
//           elementType: 'Thought',
//           element: thought
//         });

//         // Save timeline element to datastore
//         timelineElement.save(function(err, timelineElement) {
//           if (err) {
//             console.log('Error creating timeline element: ' + timelineElement);
//           }
//           console.log('Created timeline element: ' + timelineElement);
//           //socketio.sockets.emit('timeline_element', timeline_element);




//           // Create thought element
//           next();
//           //createThoughtElement(thought2);
//         });
//       }

// TODO: Virtual attribute to populate the 'element' attribute based on the value of 'elementType'?

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
          //sendResponse(req, res, 'thought_element', thoughtElement);
          fn(null, timelineElement);

          //createThoughtElement(thoughtElementTemplate, element);
        });
      }

module.exports = mongoose.model('TimelineElement', timelineElementSchema); // Compile schema to a model