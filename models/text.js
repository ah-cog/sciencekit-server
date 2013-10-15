var mongoose = require('mongoose')
	, Account = require('./account');

var textSchema = new mongoose.Schema({
	// reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Thought' },
	moment: { type: mongoose.Schema.Types.ObjectId, ref: 'Moment' },

	// text: { type: String, required: false }, // e.g., 'Thought'
	// text: { type: String, required: true },

	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

// Mongoose by default produces a collection name by passing the model name 
// to the utils.toCollectionName method. This method pluralizes the name. Set 
// this option if you need a different name for your collection.
//
// var dataSchema = new Schema({..}, { collection: 'data' });
// 
// [Source: http://mongoosejs.com/docs/guide.html]
module.exports = mongoose.model('Text', textSchema); // Compile schema to a model