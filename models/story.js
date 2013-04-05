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

	// "Recall" thought, i.e., Get existing one with specified ID or create a new one.
      Thought.getOrCreateThought(thoughtTemplate, function(err, thought) {

        // Create timeline element
        // TODO: Only create one "timeline element" per "thought element"
          
        TimelineElement.getOrCreate(thought, function(err, timelineElement) {

          // Create thought element
          ThoughtElement.createThoughtElement(thought, thoughtTemplate, function(err, thoughtElement) {

            var timeline = new Timeline({
              element: timelineElement,
            });
            timeline.save(function(err, timeline) {
              // Save thought to datastore
              console.log('Creating timeline for element.');
              if (err) {
                console.log('Error creating timeline for element: %s', thought);
              }
              console.log('Created timeline for element: %s', thought);

              // Save a new timeline element to datastore
		      var timelineElement = new TimelineElement({
		        timeline: timeline,
		        elementType: 'Thought',
		        element: thought
		      });
		      console.log('Saving timeline element: ' + timelineElement);
		      timelineElement.save(function(err) {
		        // if(err) throw err;
		        if (err) {
		          console.log('Error creating timeline element: ' + timelineElement);
		        }
		        console.log('Created timeline element: ' + timelineElement);

		        // Create timeline element
		        // Create timeline element (always do this when creating any kind collection like a thought, but not elements in collections)
	              // TODO: Move this elsewhere and add a callback parameter for further calls

	              // Create timeline element
	              console.log(timelineElement);
	              timelineElement.populate({ path: 'element', model: timelineElement.elementType }, function(err, populatedElement) {
	                if(timelineElement.elementType == 'Thought') {
	                  Thought.getPopulated2(populatedElement.element, function(err, populatedThought) {
	                    fn(err, timelineElement);
	                  });
	                }
	              });
		      });

              


              
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

module.exports = mongoose.model('Story', storySchema); // Compile schema to a model