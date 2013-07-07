// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Thought = require('../models/thought')
	, Inquiry = require('../models/inquiry');

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


            Inquiry.addThought(thoughtTemplate, function(err, entry) {
                io.sockets.emit('thought', entry); // TODO: is this the wrong place?  better place?  guaranteed here?
                res.json(entry);
            });
            
        });
    }
];

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

            Perspective.findOne({ frame: thoughtTemplate.frame, account: account }, function(err, perspective) {
                if (thoughtTemplate.hasOwnProperty('active')) {
                    perspective.active = thoughtTemplate.active;
                }

                if (thoughtTemplate.hasOwnProperty('visible')) {
                    perspective.visible = thoughtTemplate.visible;
                }

                if (thoughtTemplate.hasOwnProperty('activity')) {
                    perspective.activity = thoughtTemplate.activity;
                }

                perspective.save(function(err) {
                    if(err) throw err;

                    io.sockets.emit('thought', perspective); // TODO: is this the wrong place?  better place?  guaranteed here?
                    //res.json(moment);
                    res.json(perspective);
                });
            });
        });
    }
];

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