var mongoose = require('mongoose')
, Timeline = require('./timeline')
, TimelineElement = require('./timeline-element')
, Thought = require('./thought')
, ThoughtElement = require('./thought-element');

var storySchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true },

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

storySchema.statics.addThought = function(thoughtTemplate, fn) {

	var Story = this;

	// Create thought collection.  "Recall" thought, i.e., Get existing one with specified ID or create a new one.
	Story.getOrCreateThought(thoughtTemplate, function(err, thought) {

        // Create Moment (previously TimelineElement)
        //
        // Notes:
        // - There's only one "timeline element" for each collection of "thought elements"

    	TimelineElement.getOrCreate(thought, function(err, timelineElement) {

    		// Create thought element
    		ThoughtElement.createThoughtElement(thought, thoughtTemplate, function(err, thoughtElement) {

      			// Create timeline element
      			console.log(timelineElement);
      			timelineElement.populate({ path: 'element', model: timelineElement.elementType }, function(err, populatedElement) {
      				if(timelineElement.elementType == 'Thought') {
      					Thought.getPopulated2(populatedElement.element, function(err, populatedThought) {
      						fn(err, timelineElement);
      					});
      				}
      			});

	            // Thought.getPopulated(thought, function(err, updatedThought) {
	            //   // Return result to clients
	            //   io.sockets.emit('thought', updatedThought); // TODO: is this the wrong place?  better place?  guaranteed here?
	            //   res.json(updatedThought);
	            // });
            });
		});
	});
}

// Create timeline for associated timeline element.
storySchema.statics.createTimelineByElement = function(element, fn) {

	// Get element type (i.e., the element model's name)
	var elementType = element.constructor.modelName;

	// Create timeline
	var timeline = new this();
	timeline.save(function(err) {

		// Save thought to datastore
		console.log('Creating timeline for element: ' + element);
		if (err) console.log('Error creating thought element: ' + element);
		console.log('Created timeline for element: ' + element);

		// Create timeline element
		var timelineElement = new TimelineElement({
			timeline: timeline,
			element: element,
			elementType: elementType
		});

		timelineElement.save(function (err) {

			// Save thought to datastore
			console.log('Creating timeline element for element: ' + element);
			if (err) console.log('Error creating thought element: ' + timelineElement);
			console.log('Created timeline element: ' + timelineElement);

			// Add timeline element to timeline
			timeline.element = timelineElement;
			timeline.save(function (err) {
				if (err) console.log('Could not save updated timeline.');
				console.log('Saved timeline: ' + timeline)
			});

			// Callback
			fn(null, timeline);
		})
	});
}

// Gets or creates thought.  Creates thought if doesn't exist.
//
// If creates a new thought, also:
// - Creates new timeline for new thought
// - Creates timeline element for new thought and new timeline
storySchema.statics.getOrCreateThought = function(thoughtElementTemplate, fn) {

	Thought.findById(thoughtElementTemplate.element, function(err, existingThought) {
		if(err) throw err;

		console.log("Existing thought:");
		console.log(thoughtElementTemplate.element);
		console.log(existingThought);

		// Check if a thought exists with the specified ID.  If not, create a new thought.
		if(existingThought !== null) {
			console.log("Found existing thought: " + existingThought);

			// Create timeline element
			fn(null, existingThought);

		} else {

			// Store new thought to datastore
			var activity = new Thought({
				timeline: thoughtElementTemplate.timeline
			});

			activity.save(function(err) {
				// if(err) throw err;
				console.log('Saving activity: ' + activity);
				if (err) { console.log('Error creating activity: ' + activity); }
				console.log('Created activity: ' + activity);

				// Create timeline for activity (always do this when creating any kind collection like a activity, but not elements in collections)
				//
				//     Logically:
				//     1. Create Thought
				//     2. Create TimelineElement for Thought
				//     3. Create Timeline for TimelineElement

				var timeline = Timeline();

				timeline.save(function (err) {

					// Check if error saving timeline
					if (err) { console.log('Error creating timeline for element.'); }
					console.log('Created timeline for element.');

					// Update timeline for activity
					// activity.timeline = timeline;

					// activity.save(function(err) {

					// Save a new timeline element to datastore
	          		var timelineElement = new TimelineElement({
	          			timeline: timeline,
	          			elementType: activity.constructor.modelName,
	          			element: activity
	          		});

	          		console.log('Saving timeline element: ' + timelineElement);
	          		timelineElement.save(function(err) {
	          			// if(err) throw err;
	          			if (err) { console.log('Error creating timeline element: ' + timelineElement); }
	          			console.log('Created timeline element: ' + timelineElement);

						// Create timeline element
						fn(null, activity);
	          		});

					// });
				});
			});
		}
	});
}

module.exports = mongoose.model('Story', storySchema); // Compile schema to a model