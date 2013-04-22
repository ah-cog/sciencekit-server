// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, ThoughtFrame = require('../models/thought-frame')
	, Thought = require('../models/thought')
    , FrameView = require('../models/frame-view')
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

exports.update = [
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

            FrameView.findOne({ frame: thoughtTemplate.frame, account: account }, function(err, frameView) {
                if (thoughtTemplate.hasOwnProperty('active')) {
                    frameView.active = thoughtTemplate.active;
                }

                if (thoughtTemplate.hasOwnProperty('visible')) {
                    frameView.visible = thoughtTemplate.visible;
                }

                frameView.save(function(err) {
                    if(err) throw err;

                    //io.sockets.emit('thought', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                    //res.json(moment);
                    res.json({});
                });
            });
        });
    }
]

exports.read = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            conditions = {};
            if (req.query.hasOwnProperty('frame')) {
                conditions['frame'] = req.query['frame'];
            }

            // TODO: Verify valid JSON
            // TODO: Verify required fields for element are present

            Thought.find(conditions, function(err, thoughts) {

                //io.sockets.emit('thought', moment); // TODO: is this the wrong place?  better place?  guaranteed here?
                //res.json(moment);
                res.json(thoughts);

            });
        });
    }
]