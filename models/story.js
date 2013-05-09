var mongoose = require('mongoose')
	, Timeline = require('./timeline')
	, Moment = require('./moment')
	, Perspective = require('./perspective')
	, Thought = require('./thought')
	, Photo = require('./photo')
	, Video = require('./video')
	, Motion = require('./motion')
	, Sketch = require('./sketch')
	, Frame = require('./frame')
	, Topic = require('./topic')
	, Narration = require('./narration');

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

// Create Timeline for associated Activity.  Create parent Moment for Timeline associated with specified Activity.
storySchema.statics.createTimelineByActivity = function(activity, fn) {

	// Get Activity type (i.e., the particular Activity model's name)
	var activityType = activity.constructor.modelName;

	//
	// Create Timeline
	//
	var timeline = new Timeline();
	timeline.save(function(err) {

		// Save Timeline to datastore
		console.log('Creating Timeline for Activity: ' + activity);
		if (err) console.log('Error creating Timeline for Activity: ' + activity);
		console.log('Created Timeline for Activity: ' + activity);

		//
		// Create the parent Moment for the Timeline.
		//
		var moment = new Moment({
			timeline: timeline,
			frame: activity,
			frameType: activityType
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

	Moment.findOne({ frame: frame, timeline: frame.timeline }, function(err, existingMoment) {
		if(err) throw err;

		// Check if a frame exists with the specified ID.  If not, create a new frame.
		if(existingMoment !== null) {
			console.log("Found existing Moment: " + existingMoment);

			fn(null, existingMoment);
		} else {

			// Timeline Moment doesn't exist.  Create new timeline element.
			//var frameType = frame.constructor.modelName;
			var frameType = frame.type;

			// Save a new timeline element to datastore
			var moment = new Moment({
				timeline: frame.timeline,
				//frameType: frame.type,
				frameType: frameType,
				frame: frame
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
	var frame = moment.frame;
	var frameType = moment.frameType;

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
  			frameType: frameType,
  			frame: frame
  		});

  		console.log('Saving moment: ' + moment);
  		moment.save(function(err) {
  			// if(err) throw err;
  			if (err) { console.log('Error creating moment: ' + moment); }
  			console.log('Created moment: ' + moment);

			// Callback
			fn(null, frame);
  		});
	});
}




// Perspective

// Create Perspective for specified Timeline.
// Creating a Perspective for an existing Timeline also creates a new Timeline for 
// which the created Perspective is the "source" Perspective.  Therefore every Perspective is 
// the source of a Timeline.
storySchema.statics.getOrCreatePerspective = function(frame, account, fn) {

	var Story = this;

	console.log("Frame:");
	console.log(frame);

	Perspective.findOne({
		frame: frame,
		account: account

	}, function(err, existingFrame) {
		if(err) throw err;

		// Check if a Perspective exists.  If not, create a new one.
		if(existingFrame !== null) {

			console.log("Found existing Perspective: " + existingFrame);
			fn(null, existingFrame);

		} else {

			// Frame element doesn't exist, so create one.
			//var frameType = frame.constructor.modelName;

			// Get Activity for Frame
			//var activityType = frame.last.constructor.modelName; // TODO: Check if frame.last exists and only do this if it does exist
			// var activityType = null;
			// var i = 0;
			// var j = frameType.indexOf('Frame');
			// if (j !== -1) {
			// 	activityType = frameType.substr(i, j);
			// 	console.log('activityType = ' + activityType);
			// }
			var type = frame.type;

			// Save a new timeline element to datastore
			var perspective = new Perspective({
				frame: frame,
				frameType: type,

				// TODO: Check if frame.last exists and only do this if it does exist
				activity: frame.last,
				activityType: type,

				account: account
			});

			console.log('Saving Perspective: ' + perspective);
			perspective.save(function (err) {
				if (err) throw err;

				fn(null, perspective);
			});
		}
	});
}



storySchema.statics.getOrCreateFrame = function(template, fn) {
	console.log("getOrCreateFrame");

	// Get frame
	Frame.findById(template.frame, function(err, existingFrame) {
		if(err) throw err;

		// Check if a photo exists with the specified ID.  If not, create a new photo.
		if(existingFrame !== null) {
			console.log("Found existing Frame: " + existingFrame);

			// Callback
			fn(null, existingFrame);

		} else {

			// Save a new photo to datastore
			var frame = new Frame({
				timeline: template.timeline,
				type: template.type
			});

			frame.save(function(err) {
				// if(err) throw err;
				console.log('Saving Frame: ' + frame);
				if (err) { console.log('Error creating Frame: ' + frame); }
				console.log('Created Frame: ' + frame);

				// Create timeline element (always do this when creating any kind collection like a thought, but not elements in collections)
				// TODO: Move this elsewhere and add a callback parameter for further calls

				// Create timeline element
				fn(null, frame);

			});
		}
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
	//Story.getThoughtFrame(thoughtTemplate, function(err, thoughtFrame) {
	thoughtTemplate.type = 'Thought';
	Story.getOrCreateFrame(thoughtTemplate, function (err, thoughtFrame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per ThoughtFrame

    	Story.getOrCreateMoment(thoughtFrame, function(err, moment) {

    		// Create Thought
    		Story.createThought(thoughtFrame, thoughtTemplate, function(err, thought) {

      			// Create Moment on Timeline
      			console.log(moment);
      			moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {
      				if(moment.frameType === 'Thought') {
      					Frame.getPopulated2(populatedMoment.frame, function(err, populatedThoughtFrame) {
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
		thoughtFrame.last = thought;
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

	// "Recall" Frame for Photo, i.e., Get existing one with specified ID or create a new one.
	photoTemplate.type = 'Photo';
	Story.getOrCreateFrame(photoTemplate, function(err, photoFrame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per PhotoFrame

    	Story.getOrCreateMoment(photoFrame, function(err, moment) {

    		// Create Photo
    		Story.createPhoto(photoFrame, photoTemplate, function(err, photo) {

      			// Create Moment on Timeline
      			console.log(moment);
      			moment.populate({ path: 'frame', model: 'Frame' }, function (err, populatedMoment) {
      				if(moment.frameType === 'Photo') {
      					Frame.getPopulated2(populatedMoment.frame, function (err, populatedPhotoFrame) {
      						fn(err, moment);
      					});
      				}
      			});
            });
		});
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
			photoFrame.last = photo;
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




// Video

// Add Video to Story.
// This consists of creating the Video and setting up associated models and relationships.

storySchema.statics.addVideo = function(videoTemplate, fn) {
	console.log("addVideo");

	// Make sure all required properties are present
	if (!videoTemplate.hasOwnProperty('timeline')) {
		console.log('Cannot add Video.  One or more required properties are missing.');
		fn('Cannot add Video.  One or more required properties are missing.');
	}

	var Story = this;

	// "Recall" VideoFrame, i.e., Get existing one with specified ID or create a new one.
	videoTemplate.type = 'Video';
	Story.getOrCreateFrame(videoTemplate, function(err, videoFrame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per VideoFrame

    	Story.getOrCreateMoment(videoFrame, function(err, moment) {

    		// Create Video
    		Story.createVideo(videoFrame, videoTemplate, function(err, video) {

      			// Create Moment on Timeline
      			console.log(moment);
      			moment.populate({ path: 'frame', model: 'Frame' }, function (err, populatedMoment) {
      				if(moment.frameType === 'Video') {
      					Frame.getPopulated2(populatedMoment.frame, function (err, populatedVideoFrame) {
      						fn(err, moment);
      					});
      				}
      			});
            });
		});
	});
}

storySchema.statics.createVideo = function(videoFrame, videoTemplate, fn) {
	console.log("createVideo");

	// Create Video
	Video.create({

		frame: videoFrame,
		reference: videoTemplate.reference || null,

		uri: videoTemplate.uri,

		author: videoTemplate.account

	}, function(err, video) {

			// Save Video to database
			console.log('Creating Video.');
			if (err) { console.log('Error creating Video: ' + video); }
			console.log('Created Video: ' + video);

			// Update last Video in VideoFrame
			videoFrame.last = video;
			if(videoFrame.first == null) { // For new Thoughts, set the first Thought.
				videoFrame.first = video;
			}
			videoFrame.save(function(err) {

				console.log("Saved updated VideoFrame");
				console.log(videoFrame);

				fn(null, video);

			});

	});
}




// Topic

// Add Topic to Story.
// This consists of creating the Topic and setting up associated models  
// and relationships.
storySchema.statics.addTopic = function(topicTemplate, fn) {

	// Make sure all required properties are present
	if (!topicTemplate.hasOwnProperty('text') || !topicTemplate.hasOwnProperty('timeline')) {
		console.log('Cannot add Topic.  Required properties are missing.');
		fn('Cannot add Topic.  Required properties are missing.');
	}

	var Story = this;

	// "Recall" Topic, i.e., Get existing one with specified ID or create a new one.
	Story.getOrCreateFrame(topicTemplate, function (err, topicFrame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per TopicFrame

    	Story.getOrCreateMoment(topicFrame, function(err, moment) {

    		// Create Topic
    		Story.createTopic(topicFrame, topicTemplate, function(err, topic) {

      			// Create Moment on Timeline
      			console.log(moment);
      			moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {
      				if(moment.frameType === 'Topic') {
      					TopicFrame.getPopulated2(populatedMoment.frame, function(err, populatedTopicFrame) {
      						fn(err, moment);
      					});
      				}
      			});
            });
		});
	});
}

storySchema.statics.createTopic = function(topicFrame, topicTemplate, fn) {

	// Create Topic
	Topic.create({
		frame: topicFrame,
		reference: topicTemplate.reference || null,

		text: topicTemplate.text,
		author: topicTemplate.account

	}, function(err, topic) {

		// Save Topic to datastore
		console.log('Creating Topic.');
		if (err) { console.log('Error creating Topic: ' + topic); }
		console.log('Created Topic: ' + topic);

		// Update last Topic
		topicFrame.last = topic;
		if(topicFrame.first == null) { // For new Topics, set the first Topic.
			topicFrame.first = topic;
		}
		topicFrame.save(function(err) {

			console.log("Saved updated Topic");
			console.log(topicFrame);

			fn(null, topic);

		});
	});
}




// Motion

// Add Thought to Story.
// This consists of creating the Thought and setting up associated models  
// and relationships.
storySchema.statics.addMotion = function(template, fn) {

	// Make sure all required properties are present
	//if (!template.hasOwnProperty('points') || !template.hasOwnProperty('timeline')) {
	if (!template.hasOwnProperty('timeline')) {
		console.log('Cannot add Motion.  Required properties are missing.');
		fn('Cannot add Motion.  Required properties are missing.');
	}

	var Story = this;

	// Create thought collection.  "Recall" thought, i.e., Get existing one with specified ID or create a new one.
	template.type = 'Motion';
	Story.getOrCreateFrame(template, function (err, frame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per ThoughtFrame

    	Story.getOrCreateMoment(frame, function(err, moment) {

    		// Create Thought
    		Story.createMotion(frame, template, function(err, thought) {

      			// Create Moment on Timeline
      			console.log(moment);
      			moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {
      				if(moment.frameType === 'Motion') {
      					Frame.getPopulated2(populatedMoment.frame, function(err, populatedFrame) {
      						fn(err, moment);
      					});
      				}
      			});
            });
		});
	});
}

storySchema.statics.createMotion = function(frame, template, fn) {

	// Create Motion
	Motion.create({
		frame: frame,
		reference: template.reference || null,

		//points: template.points,

		author: template.account

	}, function(err, motion) {

		// Save Motion to datastore
		console.log('Creating Motion.');
		if (err) { console.log('Error creating Motion: ' + motion); }
		console.log('Created Motion: ' + motion);

		// Store points
		motion.points = []; // Initialize array
		for (var i = 0; i < template.points.length; i++) {
			
			var currentPoint = { x: template.points[i].x, y: template.points[i].y, z: template.points[i].z, t: template.points[i].t };
			console.log('Saving point: ');
			console.log(currentPoint);

			motion.points.push(currentPoint);
		}

		// Save Motion updated with points
		motion.save(function(err) {

			// Update reference to last Motion
			frame.last = motion;
			if(frame.first == null) { // For new Thoughts, set the first Motion.
				frame.first = motion;
			}
			frame.save(function(err) {

				console.log("Saved updated Motion");
				console.log(frame);

				fn(null, motion);

			});
		});
	});
}

// Sketch

// Add Thought to Story.
// This consists of creating the Thought and setting up associated models  
// and relationships.
storySchema.statics.addSketch = function(template, fn) {

	// Make sure all required properties are present
	//if (!template.hasOwnProperty('points') || !template.hasOwnProperty('timeline')) {
	if (!template.hasOwnProperty('timeline')) {
		console.log('Cannot add Sketch.  Required properties are missing.');
		fn('Cannot add Sketch.  Required properties are missing.');
	}

	var Story = this;

	// Create thought collection.  "Recall" thought, i.e., Get existing one with specified ID or create a new one.
	template.type = 'Sketch';
	Story.getOrCreateFrame(template, function (err, frame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per Frame

    	Story.getOrCreateMoment(frame, function(err, moment) {

    		// Create Thought
    		Story.createSketch(frame, template, function(err, thought) {

      			// Create Moment on Timeline
      			console.log(moment);
      			moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {
      				if(moment.frameType === template.type) {
      					Frame.getPopulated2(populatedMoment.frame, function(err, populatedFrame) {
      						fn(err, moment);
      					});
      				}
      			});
            });
		});
	});
}

storySchema.statics.createSketch = function(frame, template, fn) {

	// Create Sketch
	Sketch.create({
		frame: frame,
		reference: template.reference || null,

		imageData: template.imageData,
		imageWidth: template.imageWidth,
		imageHeight: template.imageHeight,

		author: template.account

	}, function(err, sketch) {

		// Save Sketch to datastore
		console.log('Creating Sketch.');
		if (err) { console.log('Error creating Sketch: ' + sketch); }
		console.log('Created Sketch: ' + sketch);

		// Update reference to last Sketch
		frame.last = sketch;
		if(frame.first == null) { // For new Frame, set the first Sketch.
			frame.first = sketch;
		}
		frame.save(function(err) {

			console.log("Saved updated Sketch");
			console.log(frame);

			fn(null, sketch);

		});
	});
}

// Narration

// Add Narration to Story.
// This consists of creating the Narration and setting up associated models  
// and relationships.
storySchema.statics.addNarration = function(template, fn) {

	// Make sure all required properties are present
	//if (!template.hasOwnProperty('points') || !template.hasOwnProperty('timeline')) {
	if (!template.hasOwnProperty('timeline')) {
		console.log('Cannot add Sketch.  Required properties are missing.');
		fn('Cannot add Narration.  Required properties are missing.');
	}

	var Story = this;

	// Create Narration collection.  "Recall" Narration, i.e., Get existing one with specified ID or create a new one.
	template.type = 'Narration';
	Story.getOrCreateFrame(template, function (err, frame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per Frame

    	Story.getOrCreateMoment(frame, function(err, moment) {

    		// Create Thought
    		Story.createNarration(frame, template, function(err, thought) {

      			// Create Moment on Timeline
      			console.log(moment);
      			moment.populate({ path: 'frame', model: 'Frame' }, function(err, populatedMoment) {
      				if(moment.frameType === template.type) {
      					Frame.getPopulated2(populatedMoment.frame, function(err, populatedFrame) {
      						fn(err, moment);
      					});
      				}
      			});
            });
		});
	});
}

storySchema.statics.createNarration = function(frame, template, fn) {

	// Create Narration
	Narration.create({
		frame: frame,
		reference: template.reference || null,

		text: template.text,

		author: template.account

	}, function(err, narration) {

		// Save Narration to datastore
		console.log('Creating Narration.');
		if (err) { console.log('Error creating Narration: ' + narration); }
		console.log('Created Narration: ' + narration);

		// Update reference to last Narration
		frame.last = narration;
		if(frame.first == null) { // For new Frame, set the first Narration.
			frame.first = narration;
		}
		frame.save(function(err) {

			console.log("Saved updated Narration");
			console.log(frame);

			fn(null, narration);

		});
	});
}

module.exports = mongoose.model('Story', storySchema); // Compile schema to a model