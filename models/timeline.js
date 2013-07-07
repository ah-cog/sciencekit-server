var mongoose = require('mongoose')
	, Moment = require('moment');

var timelineSchema = new mongoose.Schema({
	hidden: { type: Boolean, default: false },
	date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timeline', timelineSchema); // Compile schema to a model