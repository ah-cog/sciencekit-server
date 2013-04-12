var mongoose = require('mongoose')
	, Moment = require('moment');

var timelineSchema = new mongoose.Schema({

	// Element with which the timeline starts (i.e., the first timeline element)
	moment: { type: mongoose.Schema.Types.ObjectId, ref: 'Moment' },

	hidden: { type: Boolean, default: false },
	date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timeline', timelineSchema); // Compile schema to a model