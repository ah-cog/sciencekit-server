// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Observation = require('../models/observation')
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


            Inquiry.addObservation(entryTemplate, function(err, entry) {
                io.sockets.emit('observation', entry); // TODO: is this the wrong place?  better place?  guaranteed here?
                res.json(entry);
            });
        });
    }
];