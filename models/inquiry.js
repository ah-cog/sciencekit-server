var mongoose = require('mongoose')
	, Timeline = require('./timeline')
	, Story = require('./story')
	, Page = require('./page')
	, Moment = require('./moment')
	, Text = require('./text')
	, Thought = require('./thought')
	, Question = require('./question')
	, Observation = require('./observation')
	, Sequence = require('./sequence')
	, Photo = require('./photo')
	, Collaboration = require('./collaboration')
	, Identity = require('./identity')
	, Video = require('./video')
	, Sketch = require('./sketch')
	, Topic = require('./topic');

var inquirySchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true },

	date: { type: Date, default: Date.now },
	hidden: Boolean
});




// Timeline

inquirySchema.statics.getTimelineById = function(timelineId, fn) {

	Timeline.findById(timelineId, function(err, timeline) {
		if(err) throw err;
		if (timeline === null)
			fn("Could not find Timeline.");

		console.log(timeline);

		fn(null, timeline);
	});
}

// Create Timeline for associated Activity.  Create parent Moment for Timeline associated with specified Activity.
inquirySchema.statics.createTimelineByActivity = function(activity, fn) {

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
//
// TODO: Rename to "addEntry"
inquirySchema.statics.getOrCreateMoment = function(entryTemplate, fn) {
	// e.g., entryTemplate = {
	// 	type: "Thought",
	//  timeline: "..."
	// 	text: "Here's my thought"
	// }

	var Inquiry = this;

	console.log("entryTemplate:");
	console.log(entryTemplate);

	// Create entry according to 'type' property
	if (entryTemplate.type === 'Thought') {

	}

	Moment.findOne({ entry: entry, timeline: frame.timeline }, function(err, existingMoment) {
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
				Inquiry.createMomentTimeline(moment, function(err, momentTimeline) {
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
inquirySchema.statics.createMomentTimeline = function(moment, fn) {

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
inquirySchema.statics.getOrCreatePerspective = function(frame, account, fn) {

	var Inquiry = this;

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

// Add Text to Inquiry
inquirySchema.statics.addText = function(entryTemplate, fn) {

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Text';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get oldest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	// if (!entryTemplate.hasOwnProperty('text')) {
	// 	console.log('Cannot add Text.  Required properties are missing.');
	// 	fn('Cannot add Text.  Required properties are missing.');
	// }

	//
	// Create Text
	//

	Text.create({
		author: entryTemplate.account,
		// text: entryTemplate.text

	}, function(err, entry) {
		if (err) throw err;

		//
		// Create Entry
		//

		Moment.create({
			timeline: entryTemplate.timeline,
			author: entryTemplate.account,
			entry: entry,
			entryType: entry.constructor.modelName,

		}, function(err, entry) {
			if (err) throw err;

			console.log("Created and saved Entry:");
			console.log(entry);

			entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
				entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, entryPopulated);
				});
			});
		});
	});
}

// Add Thought to Inquiry
inquirySchema.statics.addThought = function(entryTemplate, fn) {

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Thought';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get oldest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	if (!entryTemplate.hasOwnProperty('text')) {
		console.log('Cannot add thought.  Required properties are missing.');
		fn('Cannot add thought.  Required properties are missing.');
	}

	//
	// Create Thought
	//

	Thought.create({
		author: entryTemplate.account,
		text: entryTemplate.text

	}, function(err, entry) {
		if (err) throw err;

		//
		// Create Entry
		//

		Moment.create({
			timeline: entryTemplate.timeline,
			author: entryTemplate.account,
			entry: entry,
			entryType: entry.constructor.modelName,

		}, function(err, entry) {
			if (err) throw err;

			console.log("Created and saved Entry:");
			console.log(entry);

			entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
				entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, entryPopulated);
				});
			});
		});
	});
}



// Add Collaboration to Inquiry
inquirySchema.statics.addCollaboration = function(entryTemplate, fn) {

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Collaboration';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get oldest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	if (!entryTemplate.hasOwnProperty('parent')) {
		console.log('Cannot add Collaboration.  Required properties are missing.');
		fn('Cannot add Collaboration.  Required properties are missing.');
	}

	//
	// Create Collaboration
	//

	Collaboration.create({
		author: entryTemplate.account,
		entry: entryTemplate.parent,
		authors: entryTemplate.authors
		// author
		// entry
		// authors

	}, function(err, entry) {
		if (err) throw err;

		//
		// Create Entry
		//

		fn(null, entry);

		// Moment.create({
		// 	timeline: entryTemplate.timeline,
		// 	author: entryTemplate.account,
		// 	entry: entry,
		// 	entryType: entry.constructor.modelName,

		// }, function(err, entry) {
		// 	if (err) throw err;

		// 	console.log("Created and saved Entry:");
		// 	console.log(entry);

		// 	entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
		// 		entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
		// 			fn(null, entryPopulated);
		// 		});
		// 	});
		// });
	});
}

// Question

inquirySchema.statics.addIdentity = function(entryTemplate, fn) {

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Identity';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get newest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	if (!entryTemplate.hasOwnProperty('identity')) {
		console.log('Cannot add Identity.  Required properties are missing.');
		fn('Cannot add Identity.  Required properties are missing.');
	}

	//
	// Create Thought
	//

	Identity.create({
		author: entryTemplate.account,
		parent: entryTemplate.parent,
		identity: entryTemplate.identity

	}, function(err, entry) {
		if (err) throw err;

		fn(null, entry);

		//
		// Create Entry
		//

		// Moment.create({
		// 	timeline: entryTemplate.timeline,
		// 	author: entryTemplate.account,
		// 	entry: entry,
		// 	entryType: entry.constructor.modelName,

		// }, function(err, entry) {
		// 	if (err) throw err;

		// 	console.log("Created and saved Entry:");
		// 	console.log(entry);

		// 	entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
		// 		entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
		// 			fn(null, entryPopulated);
		// 		});
		// 	});
		// });
	});
}



// Question

inquirySchema.statics.addQuestion = function(entryTemplate, fn) {

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Question';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get newest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	if (!entryTemplate.hasOwnProperty('text')) {
		console.log('Cannot add Question.  Required properties are missing.');
		fn('Cannot add Question.  Required properties are missing.');
	}

	//
	// Create Thought
	//

	Question.create({
		author: entryTemplate.account,
		parent: entryTemplate.parent,
		question: entryTemplate.text

	}, function(err, entry) {
		if (err) throw err;

		//
		// Create Entry
		//

		Moment.create({
			timeline: entryTemplate.timeline,
			author: entryTemplate.account,
			entry: entry,
			entryType: entry.constructor.modelName,

		}, function(err, entry) {
			if (err) throw err;

			console.log("Created and saved Entry:");
			console.log(entry);

			entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
				entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, entryPopulated);
				});
			});
		});
	});
}




// Question

inquirySchema.statics.addObservation = function(entryTemplate, fn) {

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Observation';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get newest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	if (!entryTemplate.hasOwnProperty('cause') || !entryTemplate.hasOwnProperty('effect')) {
		console.log('Cannot add Observation.  Required properties are missing.');
		fn('Cannot add Observation.  Required properties are missing.');
	}

	//
	// Create Thought
	//

	Observation.create({
		author: entryTemplate.account,
		parent: entryTemplate.parent,
		effect: entryTemplate.effect,
		cause: entryTemplate.cause

	}, function(err, entry) {
		if (err) throw err;

		//
		// Create Entry
		//

		Moment.create({
			timeline: entryTemplate.timeline,
			author: entryTemplate.account,
			entry: entry,
			entryType: entry.constructor.modelName,

		}, function(err, entry) {
			if (err) throw err;

			console.log("Created and saved Entry:");
			console.log(entry);

			entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
				entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, entryPopulated);
				});
			});
		});
	});
}




// Question

inquirySchema.statics.addSequence = function(entryTemplate, fn) {

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Sequence';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get newest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	if (!entryTemplate.hasOwnProperty('steps')) {
		console.log('Cannot add Sequence.  Required properties are missing.');
		fn('Cannot add Sequence.  Required properties are missing.');
	}

	//
	// Create Thought
	//

	Sequence.create({
		author: entryTemplate.account,
		parent: entryTemplate.parent,
		steps: entryTemplate.steps

	}, function(err, entry) {
		if (err) throw err;

		//
		// Create Entry
		//

		Moment.create({
			timeline: entryTemplate.timeline,
			author: entryTemplate.account,
			entry: entry,
			entryType: entry.constructor.modelName,

		}, function(err, entry) {
			if (err) throw err;

			console.log("Created and saved Entry:");
			console.log(entry);

			entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
				entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, entryPopulated);
				});
			});
		});
	});
}




// Photo

inquirySchema.statics.addPhoto = function(entryTemplate, fn) {
	console.log("addPhoto");

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Photo';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get oldest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	//
	// Create Photo
	//

	Photo.create({
		uri: entryTemplate.uri,
		author: entryTemplate.account

	}, function(err, entry) {
		if (err) throw err;

		//
		// Create Entry
		//

		Moment.create({
			timeline: entryTemplate.timeline,
			author: entryTemplate.account,
			entry: entry,
			entryType: entry.constructor.modelName,

		}, function(err, entry) {
			if (err) throw err;

			console.log("Created and saved Entry:");
			console.log(entry);

			entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
				entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, entry);
				});
			});
		});
	});
}




// Video

inquirySchema.statics.addVideo = function(entryTemplate, fn) {
	console.log("addVideo");

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Video';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get oldest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	//
	// Create Video
	//

	Video.create({
		uri: entryTemplate.uri,
		author: entryTemplate.account

	}, function(err, entry) {
		if (err) throw err;

		//
		// Create Entry
		//

		Moment.create({
			timeline: entryTemplate.timeline,
			author: entryTemplate.account,
			entry: entry,
			entryType: entry.constructor.modelName,

		}, function(err, entry) {
			if (err) throw err;

			console.log("Created and saved Entry:");
			console.log(entry);

			entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
				entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, entry);
				});
			});
		});
	});
}




// Topic

// Add Topic to Inquiry
// This consists of creating the Topic and setting up associated models  
// and relationships.
inquirySchema.statics.addTopic = function(topicTemplate, fn) {

	// Make sure all required properties are present
	if (!topicTemplate.hasOwnProperty('text') || !topicTemplate.hasOwnProperty('timeline')) {
		console.log('Cannot add Topic.  Required properties are missing.');
		fn('Cannot add Topic.  Required properties are missing.');
	}

	var Inquiry = this;

	// "Recall" Topic, i.e., Get existing one with specified ID or create a new one.
	Inquiry.getOrCreateFrame(topicTemplate, function (err, topicFrame) {

        // Create Moment
        //
        // Notes:
        // - There's only one Moment per TopicFrame

    	Inquiry.getOrCreateMoment(topicFrame, function(err, moment) {

    		// Create Topic
    		Inquiry.createTopic(topicFrame, topicTemplate, function(err, topic) {

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

inquirySchema.statics.createTopic = function(topicFrame, topicTemplate, fn) {

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

// Sketch

// Add Sketch to Inquiry
inquirySchema.statics.addSketch = function(entryTemplate, fn) {

	console.log("addSketch");

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Sketch';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get oldest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;
		});
	}

	//
	// Create Video
	//

	Sketch.create({
		imageData: entryTemplate.imageData,
		imageWidth: entryTemplate.imageWidth,
		imageHeight: entryTemplate.imageHeight,
		author: entryTemplate.account

	}, function(err, entry) {
		if (err) throw err;

		//
		// Create Entry
		//

		Moment.create({
			timeline: entryTemplate.timeline,
			author: entryTemplate.account,
			entry: entry,
			entryType: entry.constructor.modelName,

		}, function(err, entry) {
			if (err) throw err;

			console.log("Created and saved Entry:");
			console.log(entry);

			entry.populate({ path: 'entry', model: entry.entryType }, function(err, entryPopulated) {
				entryPopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, entry);
				});
			});
		});
	});
}

// Story

// Add Story for Inquiry
inquirySchema.statics.addStory = function(storyTemplate, fn) {

	//
	// Make sure all required properties are present
	//

	storyTemplate.type = 'Story';

	// Make sure all required properties are present
	if (!storyTemplate.hasOwnProperty('title')) {
		console.log('Cannot add Story.  Required properties are missing.');
		fn('Cannot add Story.  Required properties are missing.');
	}

	// 'timeline'
	if (!storyTemplate.hasOwnProperty('timeline')) {
		// Get oldest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			console.log(timeline);

			storyTemplate.timeline = timeline._id;


			// if (!storyTemplate.hasOwnProperty('text')) {
			// 	console.log('Cannot add thought.  Required properties are missing.');
			// 	fn('Cannot add thought.  Required properties are missing.');
			// }

			//
			// Create Story
			//

			Story.create({
				timeline: storyTemplate.timeline,
				title: storyTemplate.title,
				author: storyTemplate.account

			}, function(err, story) {
				if (err) throw err;

				//
				// Create Pages for each Entry
				//

				for (entry in storyTemplate.entries) {
					console.log(storyTemplate.entries[entry]);

					//
					// Create Page
					//

					Page.create({
						story: story,
						author: storyTemplate.account,
						entry: storyTemplate.entries[entry].entry

					}, function(err, page) {
						if (err) throw err;

						console.log("Created and saved Page:");
						console.log(page);

						page.populate({ path: 'entry', model: 'Moment' }, function(err, pagePopulated) {
							pagePopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
								fn(null, pagePopulated);
							});
						});
					});
				}
				
			});
		});
	}
}

module.exports = mongoose.model('Inquiry', inquirySchema); // Compile schema to a model