// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Text = require('../models/text')
	, Inquiry = require('../models/inquiry');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var textTemplate = req.body;
            textTemplate.account = account;
            console.log("Received: ");
            console.log(textTemplate);
            console.log("Timeline = %s", textTemplate.timeline);


            Inquiry.addText(textTemplate, function(err, entry) {
                io.sockets.emit('text', entry); // TODO: is this the wrong place?  better place?  guaranteed here?
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

            var textTemplate = req.body;
            textTemplate.account = account;
            console.log("Received: ");
            console.log(textTemplate);
            console.log("Timeline = %s", textTemplate.timeline);

            // TODO: Verify valid JSON
            // TODO: Verify required fields for element are present

            Perspective.findOne({ frame: textTemplate.frame, account: account }, function(err, perspective) {
                if (textTemplate.hasOwnProperty('active')) {
                    perspective.active = textTemplate.active;
                }

                if (textTemplate.hasOwnProperty('visible')) {
                    perspective.visible = textTemplate.visible;
                }

                if (textTemplate.hasOwnProperty('activity')) {
                    perspective.activity = textTemplate.activity;
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