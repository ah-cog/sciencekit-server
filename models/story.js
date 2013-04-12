var mongoose = require('mongoose')
, Timeline = require('./timeline')
, Moment = require('./moment')
, ThoughtFrame = require('./thought-frame')
, Thought = require('./thought')
, PhotoFrame = require('./photo-frame')
, Photo = require('./photo');

var storySchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true },

	date: { type: Date, default: Date.now },
	hidden: Boolean
});




// Timeline

storySchema.statics.getTimelineById = function(timelineId, fn) {

	Timeline.findById(timelineId, function(err, timeline) {
		if(err) throw err;
		if (timeline === null)
			fn("Could not find Timeline.");

		console.log(timeline);

		fn(null, timeline);
	});
}

// Create Timeline for associated Activity.
storySchema.statics.createTimelineByElement = function(activity, fn) {

	// Get Activity type (i.e., the particular Activity model's name)
	var activityType = activity.constructor.modelName;

	// Create timeline
	var timeline = new Timeline();
	timeline.save(function(err) {

		// Save Timeline to datastore
		console.log('Creating Timeline for Activity: ' + activity);
		if (err) console.log('Error creating Timeline for Activity: ' + activity);
		console.log('Created Timeline for Activity: ' + activity);

		// Create Moment
		var moment = new Moment({
			timeline: timeline,
			element: activity,
			elementType: activityType
		});

		moment.save(function (err) {

			// Save Moment to datastore
			console.log('Creating Timeline for Moment: ' + moment);
			if (err) console.log('Error creating Timeline for Moment: ' + moment);
			console.log('Created Timeline for Moment: ' + moment);

			// Add new Moment to new Timeline
			timeline.moment = moment;
			timeline.save(function (err) {
				if (err) console.log('Could not save updated Timeline.');
				console.log('Saved Timeline: ' + timeline)
			});

			// Callback
			fn(null, timeline);
		})
	});
}




// Moment

// Create Moment for specified Timeline.
// Creating a Moment for an existing Timeline also creates a new Timeline for 
// which the created Moment is the "source" Moment.  Therefore every Moment is 
// the source of a Timeline.
storySchema.statics.getOrCreateMoment = function(frame, fn) {

	var Story = this;

	console.log("Frame:");
	console.log(frame);

  Moment.findOne({ element: frame, timeline: frame.timeline }, function(err, existingMoment) {
    if(err) throw err;

    // Check if a frame exists with the specified ID.  If not, create a new frame.
    if(existingMoment !== null) {
      console.log("Found existing Moment: " + existingMoment);

      // Create timeline element
      fn(null, existingMoment);

    } else {

      // Timeline element doesn't exist.  Create new timeline element.

      var elementType = frame.constructor.modelName;

      // Save a new timeline element to datastore
      var moment = new Moment({
        timeline: frame.timeline,
        elementType: elementType,
        element: frame
      });
      console.log('Saving Moment: ' + moment);
      moment.save(function(err) {
        // if(err) throw err;
        if (err) { console.log('Error creating Moment: ' + moment); }
        console.log('Created Moment: ' + moment);

        // Create Timeline for Moment
        Story.createMomentTimeline(moment, function(err, momentTimeline) {

	        // Callback
	        fn(null, moment);
	    });
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

	// Create Timeline for Moment (always create a new Timeline when creating a new Moment)
	//
	//     Logically:
	//     (Previously, 1. Created Thought)
	//     1. Create new Timeline pointing to specified Moment
	//     2. Create new Moment pointing to new Timeline, associated with the same Activity as the specified Moment

	Timeline.create({
		moment: moment

	}, function (err, timeline) {

		// Check if error saving timeline
		if (err) { console.log('Error creating new timeline for moment.'); }
		console.log('Created new timeline for moment.');

		// Save a new Moment to datastore
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

			// Callback
			fn(null, activity);
  		});
	});
}




// Thought

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
	Story.getThoughtFrame(thoughtTemplate, function(err, thoughtFrame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per ThoughtFrame

    	Story.getOrCreateMoment(thoughtFrame, function(err, moment) {

    		// Create Thought
    		Story.createThought(thoughtFrame, thoughtTemplate, function(err, thought) {

      			// Create Moment on Timeline
      			console.log(moment);
      			moment.populate({ path: 'element', model: moment.elementType }, function(err, populatedElement) {
      				if(moment.elementType === 'ThoughtFrame') {
      					ThoughtFrame.getPopulated2(populatedElement.element, function(err, populatedThoughtFrame) {
      						fn(err, moment);
      					});
      				}
      			});
            });
		});
	});
}

storySchema.statics.createThought = function(thoughtFrame, thoughtTemplate, fn) {

	// Create Thought
	Thought.create({
		frame: thoughtFrame,
		reference: thoughtTemplate.reference || null,

		text: thoughtTemplate.text,
		author: thoughtTemplate.account

	}, function(err, thought) {

		// Save Thought to datastore
		console.log('Creating Thought.');
		if (err) { console.log('Error creating Thought: ' + thought); }
		console.log('Created Thought: ' + thought);

		// Update latest thought
		thoughtFrame.latest = thought;
		if(thoughtFrame.first == null) { // For new Thoughts, set the first Thought.
			thoughtFrame.first = thought;
		}
		thoughtFrame.save(function(err) {

			console.log("Saved updated thought");
			console.log(thoughtFrame);

			fn(null, thought);

		});
	});
}

// Gets or creates thought frame.  Creates thought if doesn't exist.
//
// If creates a new thought, also:
// - Creates new Timeline for new ThoughtFrame
// - Creates Moment for new ThoughtFrame and new Timeline
storySchema.statics.getThoughtFrame = function(thoughtTemplate, fn) {
 
	ThoughtFrame.findById(thoughtTemplate.element, function(err, existingThoughtFrame) {
		if(err) throw err;

		// Check if a thought exists with the specified ID.  If not, create a new thought.
		if(existingThoughtFrame !== null) {
			console.log("Found existing ThoughtFrame: " + existingThoughtFrame);

			// Callback
			fn(null, existingThoughtFrame);

		} else {

			// Store new thought to datastore
			var frame = new ThoughtFrame({
				timeline: thoughtTemplate.timeline
			});

			frame.save(function(err) {
				// if(err) throw err;
				console.log('Saving frame: ' + frame);
				if (err) { console.log('Error creating frame: ' + frame); }
				console.log('Created frame: ' + frame);

				fn(null, frame);
			});
		}
	});
}




// Photo

// Add Photo to Story.
// This consists of creating the Photo and setting up associated models and relationships.

storySchema.statics.addPhoto = function(photoTemplate, fn) {
	console.log("addPhoto");

	// Make sure all required properties are present
	if (!photoTemplate.hasOwnProperty('timeline')) {
		console.log('Cannot add Photo.  One or more required properties are missing.');
		fn('Cannot add Photo.  One or more required properties are missing.');
	}

	var Story = this;

	// "Recall" PhotoFrame, i.e., Get existing one with specified ID or create a new one.
	Story.getOrCreatePhotoFrame(photoTemplate, function(err, photoFrame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per PhotoFrame

    	Story.getOrCreateMoment(photoFrame, function(err, moment) {

    		// Create Photo
    		Story.createPhoto(photoFrame, photoTemplate, function(err, photo) {

      			// Create Moment on Timeline
      			console.log(moment);
      			moment.populate({ path: 'element', model: moment.elementType }, function (err, populatedElement) {
      				if(moment.elementType === 'PhotoFrame') {
      					PhotoFrame.getPopulated2(populatedElement.element, function (err, populatedPhotoFrame) {
      						fn(err, moment);
      					});
      				}
      			});
            });
		});
	});
}

storySchema.statics.getOrCreatePhotoFrame = function(photoTemplate, fn) {
	console.log("getPhotoFrame");

	PhotoFrame.findById(photoTemplate.element, function(err, existingPhoto) {
		if(err) throw err;

		// Check if a photo exists with the specified ID.  If not, create a new photo.
		if(existingPhoto !== null) {
			console.log("Found existing photo: " + existingPhoto);

			// Callback
			fn(null, existingPhoto);

		} else {

			// Save a new photo to datastore
			var photoFrame = new PhotoFrame({
				timeline: photoTemplate.timeline
			});

			photoFrame.save(function(err) {
				// if(err) throw err;
				console.log('Saving PhotoFrame: ' + photoFrame);
				if (err) { console.log('Error creating PhotoFrame: ' + photoFrame); }
				console.log('Created PhotoFrame: ' + photoFrame);

				// Create timeline element (always do this when creating any kind collection like a thought, but not elements in collections)
				// TODO: Move this elsewhere and add a callback parameter for further calls

				// Create timeline element
				fn(null, photoFrame);

			});
		}
	});
}

storySchema.statics.createPhoto = function(photoFrame, photoTemplate, fn) {
	console.log("createPhoto");

	// Create photo node
	Photo.create({

		frame: photoFrame,
		reference: photoTemplate.reference || null,

		uri: photoTemplate.uri,

		author: photoTemplate.account

	}, function(err, photo) {

			// Save photo to datastore
			console.log('Creating Photo.');
			if (err) { console.log('Error creating Photo: ' + photo); }
			console.log('Created Photo: ' + photo);

			// Update latest Photo in PhotoFrame
			photoFrame.latest = photo;
			if(photoFrame.first == null) { // For new Thoughts, set the first Thought.
				photoFrame.first = photo;
			}
			photoFrame.save(function(err) {

				console.log("Saved updated PhotoFrame");
				console.log(photoFrame);

				fn(null, photo);

			});

	});
}

module.exports = mongoose.model('Story', storySchema); // Compile schema to a model