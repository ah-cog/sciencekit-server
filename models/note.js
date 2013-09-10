var mongoose = require('mongoose')
	, Account = require('./account');

var noteSchema = new mongoose.Schema({
	page: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },

	note: { type: String, required: true },
	
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
module.exports = mongoose.model('Note', noteSchema); // Compile schema to a model