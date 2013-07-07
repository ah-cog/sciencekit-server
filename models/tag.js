var mongoose = require('mongoose')
	, Account = require('./account');

var tagSchema = new mongoose.Schema({
	entry: { type: mongoose.Schema.Types.ObjectId },

	text: { type: String, required: true },
	
	hidden: Boolean,
	account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
	date: { type: Date, default: Date.now }
});

// Mongoose by default produces a collection name by passing the model name 
// to the utils.toCollectionName method. This method pluralizes the name. Set 
// this option if you need a different name for your collection.
//
// var dataSchema = new Schema({..}, { collection: 'data' });
// 
// [Source: http://mongoosejs.com/docs/guide.html]
module.exports = mongoose.model('Tag', tagSchema); // Compile schema to a model