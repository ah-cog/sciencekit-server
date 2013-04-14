// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, TopicFrame = require('../models/topic-frame')
	, Topic = require('../models/topic')
	, Story = require('../models/story');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var activityTemplate = req.body;
            activityTemplate.account = account;
            console.log("Received Topic: ");
            console.log(activityTemplate);
            console.log("Timeline = %s", activityTemplate.timeline);

            // TODO: Verify valid JSON
            // TODO: Verify required fields for element are present

            Story.addTopic(activityTemplate, function(err, moment) {
                io.sockets.emit('topic', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                res.json(moment);
            });
        });
    }
]