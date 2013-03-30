var mongoose = require('mongoose')
	, AccountSchema = require('./account');

var timelineSchema = new mongoose.Schema({
	parentTimeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' },
	hidden: { type: Boolean, default: false },
	date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Timeline', timelineSchema); // Compile schema to a model