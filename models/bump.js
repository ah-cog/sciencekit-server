var mongoose = require('mongoose')
	, Account = require('./account');

// A "bump" is defined as a general mechanism for assignming polarity to an Artifact.
var bumpSchema = new mongoose.Schema({
	entry: { type: mongoose.Schema.Types.ObjectId, ref: 'Moment' },

	tag: { type: String, default: 'bump' }, // (i.e., the adjective) The bump label can be thought of as a category into which the bump will go (e.g., "popular").
	degree: { type: Number, default: 1 }, // (i.e., the adverb) The bump degree is a signed magnitude representing the positive or negative weight of the bump, defaults to zero
	
	date: { type: Date, default: Date.now },
	hidden: { type: Boolean, default: false },
	account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

// Mongoose by default produces a collection name by passing the model name 
// to the utils.toCollectionName method. This method pluralizes the name. Set 
// this option if you need a different name for your collection.
//
// var dataSchema = new Schema({..}, { collection: 'data' });
// 
// [Source: http://mongoosejs.com/docs/guide.html]
module.exports = mongoose.model('Bump', bumpSchema); // Compile schema to a model