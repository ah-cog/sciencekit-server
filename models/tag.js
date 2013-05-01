var mongoose = require('mongoose')
	, Account = require('./account');

var tagSchema = new mongoose.Schema({
	frame: { type: mongoose.Schema.Types.ObjectId },
	frameType: { type: String }, // e.g., 'ThoughtFrame'

	text: { type: String, required: true },
	
	date: { type: Date, default: Date.now },
	hidden: Boolean,
	account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

// Mongoose by default produces a collection name by passing the model name 
// to the utils.toCollectionName method. This method pluralizes the name. Set 
// this option if you need a different name for your collection.
//
// var dataSchema = new Schema({..}, { collection: 'data' });
// 
// [Source: http://mongoosejs.com/docs/guide.html]
module.exports = mongoose.model('Tag', tagSchema); // Compile schema to a model