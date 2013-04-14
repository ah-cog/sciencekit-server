var mongoose = require('mongoose');

var avatarSchema = new mongoose.Schema({
	account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },

	uri: { type: String, required: true },

	date: { type: Date, default: Date.now },
	hidden: Boolean,
});

module.exports = mongoose.model('Avatar', avatarSchema);