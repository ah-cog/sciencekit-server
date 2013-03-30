var mongoose = require('mongoose')
	, AccountSchema = require('./account');

var timelineViewspecSchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' },
	date: { type: Date, default: Date.now },
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

module.exports = mongoose.model('TimelineViewspec', timelineViewspecSchema); // Compile schema to a model