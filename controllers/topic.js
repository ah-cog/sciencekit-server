// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Topic = require('../models/topic')
    , FrameView = require('../models/frame-view')
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
];

// PUT /api/topic
exports.update = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var topicTemplate = req.body;
            topicTemplate.account = account;
            console.log("Received: ");
            console.log(topicTemplate);
            console.log("Timeline = %s", topicTemplate.timeline);

            // TODO: Verify valid JSON
            // TODO: Verify required fields for element are present

            FrameView.findOne({ frame: topicTemplate.frame, account: account }, function(err, frameView) {
                if (topicTemplate.hasOwnProperty('active')) {
                    frameView.active = topicTemplate.active;
                }

                if (topicTemplate.hasOwnProperty('visible')) {
                    frameView.visible = topicTemplate.visible;
                }

                if (topicTemplate.hasOwnProperty('activity')) {
                    frameView.activity = topicTemplate.activity;
                }

                frameView.save(function(err) {
                    if(err) throw err;

                    //io.sockets.emit('thought', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                    //res.json(moment);
                    res.json(frameView);
                });
            });
        });
    }
];