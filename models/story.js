var mongoose = require('mongoose')
	, Moment = require('moment');

var storySchema = new mongoose.Schema({
    timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true },
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },

	title: { type: String, default: 'Unnamed Story' },

	hidden: { type: Boolean, default: false },
	date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Story', storySchema); // Compile schema to a model