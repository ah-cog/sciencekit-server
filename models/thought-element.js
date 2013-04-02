var mongoose = require('mongoose')
	, Account = require('./account')
	, Thought = require('./thought');

var thoughtElementSchema = new mongoose.Schema({
	thought: { type: mongoose.Schema.Types.ObjectId, ref: 'Thought' },
	reference: { type: mongoose.Schema.Types.ObjectId, ref: 'ThoughtElement' },

	text: { type: String, required: true }, // e.g., 'Thought'
	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

thoughtElementSchema.statics.createThoughtElement = function(thought, thoughtElementTemplate, fn) {

	// Create thought node
	this.create({
		thought: thought,
		reference: thoughtElementTemplate.reference || null,

		text: thoughtElementTemplate.text,
		author: thoughtElementTemplate.account
		}, function(err, thoughtElement) {
			// Save thought to datastore
			console.log('Creating thought element.');
			if (err) {
				console.log('Error creating thought element: ' + thoughtElement);
			}
			console.log('Created thought element: ' + thoughtElement);

			// Update latest thought
			// TODO: create function 'thought.setLatest' and 'thought.setFirst' or just '.set' and '.get'
			var updateOptions = {};
			updateOptions.latest = thoughtElement;
			if(thought.first == null) { // If the thought is new
				updateOptions.first = thoughtElement;
			}

			Thought.update({ _id: thought._id, }, updateOptions, function(err, numberAffected) {

			fn(null, thoughtElement);

		});
	});
}

// Mongoose by default produces a collection name by passing the model name 
// to the utils.toCollectionName method. This method pluralizes the name. Set 
// this option if you need a different name for your collection.
//
// var dataSchema = new Schema({..}, { collection: 'data' });
// 
// [Source: http://mongoosejs.com/docs/guide.html]
module.exports = mongoose.model('ThoughtElement', thoughtElementSchema); // Compile schema to a model