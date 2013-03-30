var mongoose = require('mongoose')
	, Timeline = require('./timeline');

var timelineElementSchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true },
	elementType: { type: String, required: true }, // i.e., the "ref" value, e.g., 'Thought'
	element: { type: mongoose.Schema.Types.ObjectId }, // i.e., the referenced object itself
	date: { type: Date, default: Date.now },
	hidden: Boolean
});

// TODO: Virtual attribute to populate the 'element' attribute based on the value of 'elementType'?

module.exports = mongoose.model('TimelineElement', timelineElementSchema); // Compile schema to a model