var mongoose = require('mongoose')
	, Account = require('./account')
	, Thought = require('./thought');

// A thought is a tree, structurally, but can be listed linearly.
var thoughtSchema = new mongoose.Schema({
	first: { type: mongoose.Schema.Types.ObjectId, ref: 'ThoughtElement' }, // first thought, the root, seed thought
	latest: { type: mongoose.Schema.Types.ObjectId, ref: 'ThoughtElement' }, // most recent thought temporally

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

thoughtSchema.statics.getOrCreateThought = function(thoughtElementTemplate, fn) {

	// Store reference to Thought object
	var myThis = this;

	this.findById(thoughtElementTemplate.thought, function(err, existingThought) {
		if(err) throw err;

		// Check if a thought exists with the specified ID.  If not, create a new thought.
		if(existingThought !== null) {
		console.log("Found existing thought: " + existingThought);

		// Create timeline element
		//createThoughtElement(thoughtElementTemplate, existingThought);
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
				// TODO: Move this elsewhere and add a callback parameter for further calls

				// Create timeline element
				//createTimelineElement(thoughtElementTemplate, newThought, createThoughtElement);
				//createThoughtElement(thoughtElementTemplate, newThought);
				fn(null, thought);
			});
		}
	});
}

module.exports = mongoose.model('Thought', thoughtSchema); // Compile schema to a model