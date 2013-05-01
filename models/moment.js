var mongoose = require('mongoose');

var momentSchema = new mongoose.Schema({
    timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true }, // Timeline upon which this event occurred (not the one created for this event)

    frame: { type: mongoose.Schema.Types.ObjectId, required: true }, // i.e., the referenced object itself
    frameType: { type: String, required: true }, // i.e., the "ref" value, e.g., 'ThoughtFrame'

    date: { type: Date, default: Date.now },
    hidden: Boolean
});

module.exports = mongoose.model('Moment', momentSchema); // Compile schema to a model