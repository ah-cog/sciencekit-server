var mongoose = require('mongoose')
	, Timeline = require('./timeline')
	, Story = require('./story')
	, Page = require('./page')
	, Moment = require('./moment')
	, Text = require('./text')
	, Question = require('./question')
	, Observation = require('./observation')
	, Sequence = require('./sequence')
	, Photo = require('./photo')
	, Collaboration = require('./collaboration')
	, Identity = require('./identity')
	, Video = require('./video')
	, Note = require('./note')
	, Sketch = require('./sketch')
	, Reflection = require('./reflection')
	, ffmpeg = require('fluent-ffmpeg');

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
	// Create Identity
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
	// Create Question
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
	// Create Observation
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
	// Create Sequence
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
		// Create thumbnails images for video
		//

		var proc = new ffmpeg({ source: entryTemplate.file.path })
			.withSize('480x360')
			.takeScreenshots({
						count: 1,
						filename: entryTemplate.uri.split('/')[2].split('.')[0]
					}, './public/thumbnails', function(err, filenames) {
					if(err) {
						throw err;
					}
					console.log(filenames);
					console.log('screenshots were saved');
				});

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

// Reflection

// Add Reflection to Inquiry
inquirySchema.statics.addReflection = function(entryTemplate, fn) {

	console.log("addReflection");

	//
	// Make sure all required properties are present
	//

	entryTemplate.type = 'Reflection';

	// 'timeline'
	if (!entryTemplate.hasOwnProperty('timeline')) {
		// Get oldest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			entryTemplate.timeline = timeline._id;

			createReflection();
		});

	} else {

		createReflection();
	}

	function createReflection() {

		//
		// Create Reflection
		//

		Reflection.create({
			text: entryTemplate.text,
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
}

// Story

// Add Story for Inquiry
// inquirySchema.statics.addStory = function(storyTemplate, fn) {

// 	//
// 	// Make sure all required properties are present
// 	//

// 	storyTemplate.type = 'Story';

// 	// Make sure all required properties are present
// 	if (!storyTemplate.hasOwnProperty('title')) {
// 		console.log('Cannot add Story.  Required properties are missing.');
// 		fn('Cannot add Story.  Required properties are missing.');
// 	}

// 	// 'timeline'
// 	if (!storyTemplate.hasOwnProperty('timeline')) {
// 		// Get oldest Timeline
// 		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
// 			if (err) { throw err; }

// 			console.log(timeline);

// 			storyTemplate.timeline = timeline._id;

// 			//
// 			// Create Story
// 			//

// 			Story.create({
// 				timeline: storyTemplate.timeline,
// 				title: storyTemplate.title,
// 				author: storyTemplate.account

// 			}, function(err, story) {
// 				if (err) throw err;

// 				//
// 				// Create Pages for each Entry
// 				//

// 				for (entryGroup in storyTemplate.entries) {
// 					console.log(storyTemplate.entries[entryGroup]);

// 					for (entryPosition in storyTemplate.entries[entryGroup]) {

// 						// TODO: Create Reflection objects in the database

// 						//
// 						// Create Page
// 						//

// 						Page.create({
// 							story: story,
// 							author: storyTemplate.account,
// 							entry: storyTemplate.entries[entryGroup][entryPosition].entry,
// 							group: storyTemplate.entries[entryGroup][entryPosition]['group'],
// 							position: storyTemplate.entries[entryGroup][entryPosition]['position']

// 						}, function(err, page) {
// 							if (err) throw err;

// 							console.log("Created and saved Page:");
// 							console.log(page);

// 							//
// 							// Create Page
// 							//

// 							// console.log(storyTemplate.entries[note]);

// 							// if (storyTemplate.entries[entry].note !== undefined && storyTemplate.entries[entry].note !== '') {
// 							// 	Note.create({
// 							// 		page: page,
// 							// 		note: storyTemplate.entries[entry].note

// 							// 	}, function(err, note) {
// 							// 		if (err) throw err;

// 							// 		console.log("Created and saved Note:");
// 							// 		console.log(note);

// 							// 		page.populate({ path: 'entry', model: 'Moment' }, function(err, pagePopulated) {
// 							// 			pagePopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
// 							// 				fn(null, pagePopulated);
// 							// 			});
// 							// 		});
// 							// 	});
// 							// } else {
// 								//console.log("Created and saved Note:");
// 								// console.log(note);

// 								page.populate({ path: 'entry', model: 'Moment' }, function(err, pagePopulated) {
// 									pagePopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
// 										fn(null, pagePopulated);
// 									});
// 								});
// 							// }

// 							// page.populate({ path: 'entry', model: 'Moment' }, function(err, pagePopulated) {
// 							// 	pagePopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
// 							// 		fn(null, pagePopulated);
// 							// 	});
// 							// });
// 						});
// 					}
// 				}
				
// 			});
// 		});
// 	}
// }

inquirySchema.statics.addPage = function(pageTemplate, fn) {

	//
	// Make sure all required properties are present
	//

	pageTemplate.type = 'Page';

	// Make sure all required properties are present
	// if (!pageTemplate.hasOwnProperty('title')) {
	// 	console.log('Cannot add Story.  Required properties are missing.');
	// 	fn('Cannot add Story.  Required properties are missing.');
	// }

	// 'timeline'
	if (!pageTemplate.hasOwnProperty('timeline')) {
		// Get oldest Timeline
		Timeline.findOne({}).sort('date').exec(function(err, timeline) {
			if (err) { throw err; }

			console.log(timeline);

			pageTemplate.timeline = timeline._id;

			console.log('PAGE');
			console.log(pageTemplate);

			//
			// Create Story
			//

			console.log('CREATING PAGE');
			Page.create({
				timeline: pageTemplate.timeline,

				story: pageTemplate.story, // story
				entry: pageTemplate.entry, // entry
				group: pageTemplate.group, // group
				position: pageTemplate.position, // position

				author: pageTemplate.account

			}, function(err, page) {
				console.log('CREATED PAGE');
				if (err) throw err;

				page.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, page);
				});

				return;
			});
		});
	}
}

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

			//
			// Create Story
			//

			Story.create({
				timeline: storyTemplate.timeline,
				title: storyTemplate.title,
				author: storyTemplate.account

			}, function(err, story) {
				if (err) throw err;

				story.populate({ path: 'author' }, function(err, populatedAuthor) {
					fn(null, story);
				});


				return;

				//
				// Create Pages for each Entry
				//

				for (entryGroup in storyTemplate.entries) {
					console.log(storyTemplate.entries[entryGroup]);

					for (entryPosition in storyTemplate.entries[entryGroup]) {

						// TODO: Create Reflection objects in the database

						//
						// Create Page
						//

						Page.create({
							story: story,
							author: storyTemplate.account,
							entry: storyTemplate.entries[entryGroup][entryPosition].entry,
							group: storyTemplate.entries[entryGroup][entryPosition]['group'],
							position: storyTemplate.entries[entryGroup][entryPosition]['position']

						}, function(err, page) {
							if (err) throw err;

							console.log("Created and saved Page:");
							console.log(page);

							//
							// Create Page
							//

							// console.log(storyTemplate.entries[note]);

							// if (storyTemplate.entries[entry].note !== undefined && storyTemplate.entries[entry].note !== '') {
							// 	Note.create({
							// 		page: page,
							// 		note: storyTemplate.entries[entry].note

							// 	}, function(err, note) {
							// 		if (err) throw err;

							// 		console.log("Created and saved Note:");
							// 		console.log(note);

							// 		page.populate({ path: 'entry', model: 'Moment' }, function(err, pagePopulated) {
							// 			pagePopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
							// 				fn(null, pagePopulated);
							// 			});
							// 		});
							// 	});
							// } else {
								//console.log("Created and saved Note:");
								// console.log(note);

								page.populate({ path: 'entry', model: 'Moment' }, function(err, pagePopulated) {
									pagePopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
										fn(null, pagePopulated);
									});
								});
							// }

							// page.populate({ path: 'entry', model: 'Moment' }, function(err, pagePopulated) {
							// 	pagePopulated.populate({ path: 'author' }, function(err, populatedAuthor) {
							// 		fn(null, pagePopulated);
							// 	});
							// });
						});
					}
				}
				
			});
		});
	}
}

module.exports = mongoose.model('Inquiry', inquirySchema); // Compile schema to a model