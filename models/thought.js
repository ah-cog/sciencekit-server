var mongoose = require('mongoose')
	, Account = require('./account')
	, Thought = require('./thought')
	, Timeline = require('./timeline');

// A thought is a tree, structurally, but can be listed linearly.
var thoughtSchema = new mongoose.Schema({
	first: { type: mongoose.Schema.Types.ObjectId, ref: 'ThoughtElement' }, // first thought, the root, seed thought
	latest: { type: mongoose.Schema.Types.ObjectId, ref: 'ThoughtElement' }, // most recent thought temporally

	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' }, // Timeline for which this element is the head

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

thoughtSchema.statics.getPopulated = function(thought, fn) {

	this.findById(thought.id, function(err, thought) {
		thought.populate({ path: 'latest', model: 'ThoughtElement' }, function(err, populatedThought) {
			populatedThought.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, thought);
			});
		});
	});
}

thoughtSchema.statics.getPopulated2 = function(thought, fn) {

	thought.populate({ path: 'latest', model: 'ThoughtElement' }, function(err, populatedThought) {
		populatedThought.populate({ path: 'author' }, function(err, populatedAuthor) {
			fn(err, thought);
		});
	});
}

thoughtSchema.statics.getOrCreateThought = function(thoughtElementTemplate, fn) {

	// Store reference to Thought object
	var myThis = this;

	this.findById(thoughtElementTemplate.thought, function(err, existingThought) {
		if(err) throw err;

		// Check if a thought exists with the specified ID.  If not, create a new thought.
		if(existingThought !== null) {
		console.log("Found existing thought: " + existingThought);

		// Create timeline element
		fn(null, existingThought);

		} else {

			// Save a new thought to datastore
			var thought = new myThis();
			console.log('Saving thought: ' + thought);
			thought.save(function(err) {
				// if(err) throw err;
				if (err) {
					console.log('Error creating thought: ' + thought);
				}
				console.log('Created thought: ' + thought);

				// Create timeline element (always do this when creating any kind collection like a thought, but not elements in collections)
				// Timeline.create({
				// 	element: thoughtElement,
				// }, function(err, timeline) {
				// 	// Save thought to datastore
				// 	console.log('Creating timeline for element.');
				// 	if (err) {
				// 		console.log('Error creating timeline for element: %s', thought);
				// 	}
				// 	console.log('Created timeline for element: %s', thought);

					// Update latest thought
					// TODO: create function 'thought.setLatest' and 'thought.setFirst' or just '.set' and '.get'
					// var updateOptions = {};
					// updateOptions.timeline = timeline;
					//Thought.update({ _id: thought._id, }, updateOptions, function(err, numberAffected) {

						//fn(null, timeline);

					//});

					// Set timeline
					//thought.timeline = timeline;
					thought.timeline = thoughtElementTemplate.timeline;

					thought.save(function(err) {

						console.log("Saved thought:");
						console.log(thought);

						// Create timeline element
						fn(null, thought);
					// });
				});
			});
		}
	});
}

module.exports = mongoose.model('Thought', thoughtSchema); // Compile schema to a model