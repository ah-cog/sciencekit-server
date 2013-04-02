var mongoose = require('mongoose')
	, Timeline = require('./timeline')
	, TimelineElement = require('./timeline-element');

var timelineElementViewSchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' },
	element: { type: mongoose.Schema.Types.ObjectId, ref: 'TimelineElement' },

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

// TODO: Virtual attribute to populate the 'element' attribute based on the value of 'elementType'?

module.exports = mongoose.model('TimelineElementView', timelineElementViewSchema); // Compile schema to a model