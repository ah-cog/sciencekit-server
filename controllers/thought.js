// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, ThoughtFrame = require('../models/thought-frame')
	, Thought = require('../models/thought')
	, Story = require('../models/story');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var thoughtTemplate = req.body;
            thoughtTemplate.account = account;
            console.log("Received: ");
            console.log(thoughtTemplate);
            console.log("Timeline = %s", thoughtTemplate.timeline);

            // TODO: Verify valid JSON
            // TODO: Verify required fields for element are present

            Story.addThought(thoughtTemplate, function(err, moment) {
                io.sockets.emit('thought', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                res.json(moment);
            });
        });
    }
]