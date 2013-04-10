var mongoose = require('mongoose')
, Timeline = require('./timeline')
, Moment = require('./moment')
, Thought = require('./thought')
, ThoughtElement = require('./thought-element');

var storySchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true },

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

// Add Thought to Story.
// This consists of creating the Thought and setting up associated models  
// and relationships.
storySchema.statics.addThought = function(thoughtTemplate, fn) {

	// Make sure all required properties are present
	if (!thoughtTemplate.hasOwnProperty('text') || !thoughtTemplate.hasOwnProperty('timeline')) {
		console.log('Cannot add thought.  Required properties are missing.');
		fn('Cannot add thought.  Required properties are missing.');
	}

	var Story = this;

	// Create thought collection.  "Recall" thought, i.e., Get existing one with specified ID or create a new one.
	Story.getThoughtPotential(thoughtTemplate, function(err, thoughtPotential) {

        // Create Moment (previously TimelineElement)
        //
        // Notes:
        // - There's only one "timeline element" for each collection of "thought elements"

    	Story.getOrCreateMoment(thoughtPotential, function(err, moment) {

    		// Create ThoughtPotential element
    		Story.createThought(thoughtPotential, thoughtTemplate, function(err, thoughtElement) {

      			// Create timeline element
      			console.log(moment);
      			moment.populate({ path: 'element', model: moment.elementType }, function(err, populatedElement) {
      				if(moment.elementType == 'Thought') {
      					Thought.getPopulated2(populatedElement.element, function(err, populatedThought) {
      						fn(err, moment);
      					});
      				}
      			});
            });
		});
	});
}

storySchema.statics.createThought = function(thought, thoughtElementTemplate, fn) {

	// Create thought node
	ThoughtElement.create({
		thought: thought,
		reference: thoughtElementTemplate.reference || null,

		text: thoughtElementTemplate.text,
		author: thoughtElementTemplate.account

	}, function(err, thoughtElement) {

		// Save thought to datastore
		console.log('Creating thought element.');
		if (err) { console.log('Error creating thought element: ' + thoughtElement); }
		console.log('Created thought element: ' + thoughtElement);

		// Update latest thought
		thought.latest = thoughtElement;
		if(thought.first == null) { // For new thoughts, set the first thought.
			thought.first = thoughtElement;
		}
		thought.save(function(err) {

			console.log("Saved updated thought");
			console.log(thought);

			fn(null, thoughtElement);

		});
	});
}

storySchema.statics.getTimelineById = function(timelineId, fn) {

	Timeline.findById(timelineId, function(err, timeline) {
		if(err) throw err;
		if (timeline === null)
			fn("Could not find timeline.");

		console.log(timeline);

		// Create timeline element
		fn(null, timeline);
	});
}

// Create Moment for specified Timeline.
// Creating a Moment for an existing Timeline also creates a new Timeline for 
// which the created Moment is the "source" Moment.  Therefore every Moment is 
// the source of a Timeline.
storySchema.statics.getOrCreateMoment = function(element, fn) {

	var Story = this;

  console.log("Element?:");
  console.log(element);

  Moment.findOne({ element: element, timeline: element.timeline }, function(err, existingMoment) {
    if(err) throw err;

    console.log(existingMoment);

    // Check if a element exists with the specified ID.  If not, create a new element.
    if(existingMoment !== null) {
      console.log("Found existing timeline element: " + existingMoment);

      // Create timeline element
      fn(null, existingMoment);

    } else {

      // Timeline element doesn't exist.  Create new timeline element.

      var elementType = element.constructor.modelName;

      // Save a new timeline element to datastore
      var moment = new Moment({
        timeline: element.timeline,
        elementType: elementType,
        element: element
      });
      console.log('Saving timeline element: ' + moment);
      moment.save(function(err) {
        // if(err) throw err;
        if (err) { console.log('Error creating timeline element: ' + moment); }
        console.log('Created timeline element: ' + moment);

        // Create Timeline for Moment
        Story.createMomentTimeline(moment, function(err, momentTimeline) {

	        // Create timeline element
	        fn(null, moment);
	    });
      });
    }
  });
}

// Create timeline for associated timeline element.
storySchema.statics.createTimelineByElement = function(element, fn) {

	// Get element type (i.e., the element model's name)
	var elementType = element.constructor.modelName;

	// Create timeline
	var timeline = new Timeline();
	timeline.save(function(err) {

		// Save thought to datastore
		console.log('Creating timeline for element: ' + element);
		if (err) console.log('Error creating thought element: ' + element);
		console.log('Created timeline for element: ' + element);

		// Create timeline element
		var moment = new Moment({
			timeline: timeline,
			element: element,
			elementType: elementType
		});

		moment.save(function (err) {

			// Save thought to datastore
			console.log('Creating timeline element for element: ' + element);
			if (err) console.log('Error creating thought element: ' + moment);
			console.log('Created timeline element: ' + moment);

			// Add timeline element to timeline
			timeline.element = moment;
			timeline.save(function (err) {
				if (err) console.log('Could not save updated timeline.');
				console.log('Saved timeline: ' + timeline)
			});

			// Callback
			fn(null, timeline);
		})
	});
}

// Gets or creates thought potential.  Creates thought if doesn't exist.
//
// If creates a new thought, also:
// - Creates new timeline for new thought
// - Creates timeline element for new thought and new timeline
storySchema.statics.getThoughtPotential = function(thoughtElementTemplate, fn) {
 
	Thought.findById(thoughtElementTemplate.element, function(err, existingThought) {
		if(err) throw err;

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

				fn(null, activity);
			});
		}
	});
}

// Create a new Timeline and a new Moment on that new Timeline for specified 
// Activity.  This Activity will be associated with the first Moment 
// on this Timeline (i.e., the new Moment this method creates).
storySchema.statics.createMomentTimeline = function(moment, fn) {

	// Get Activity associated with Moment
	var activity = moment.element;
	var activityType = moment.elementType;

	// Create timeline for activity (always do this when creating any kind collection like a activity, but not elements in collections)
	//
	//     Logically:
	//     (Previously, 1. Created Thought)
	//     1. Create new Timeline pointing to specified Moment/TimelineElement
	//     2. Create new Moment/TimelineElement pointing to new Timeline, associated with the same Activity as the specified Moment

	Timeline.create({
		element: moment

	}, function (err, timeline) {

		// Check if error saving timeline
		if (err) { console.log('Error creating new timeline for moment.'); }
		console.log('Created new timeline for moment.');

		// Save a new timeline element to datastore
  		var moment = new Moment({
  			timeline: timeline,
  			elementType: activityType,
  			element: activity
  		});

  		console.log('Saving moment: ' + moment);
  		moment.save(function(err) {
  			// if(err) throw err;
  			if (err) { console.log('Error creating moment: ' + moment); }
  			console.log('Created moment: ' + moment);

			// Create timeline element
			fn(null, activity);
  		});
	});
}

module.exports = mongoose.model('Story', storySchema); // Compile schema to a model