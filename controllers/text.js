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