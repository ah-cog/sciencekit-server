var mongoose = require('mongoose')
	, AccountSchema = require('./account');

var timelineSchema = new mongoose.Schema({

	// Element with which the timeline starts (i.e., the first timeline element)
	element: { type: mongoose.Schema.Types.ObjectId, ref: 'TimelineElement' },

	hidden: { type: Boolean, default: false },
	date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timeline', timelineSchema); // Compile schema to a model