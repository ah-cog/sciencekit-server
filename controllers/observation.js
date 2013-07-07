// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Question = require('../models/question')
	, Inquiry = require('../models/inquiry');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        // TODO: Make sure required parameters are present, correct

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var entryTemplate = req.body;
            entryTemplate.account = account;
            console.log("Received: ");
            console.log(entryTemplate);
            console.log("Timeline = %s", entryTemplate.timeline);


            Inquiry.addQuestion(entryTemplate, function(err, entry) {
                io.sockets.emit('question', entry); // TODO: is this the wrong place?  better place?  guaranteed here?
                res.json(entry);
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