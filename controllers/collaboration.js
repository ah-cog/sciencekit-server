// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Collaboration = require('../models/collaboration')
	, Inquiry = require('../models/inquiry');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var collaborationTemplate = req.body;
            collaborationTemplate.account = account;
            // console.log("Received: ");
            // console.log(collaborationTemplate);
            // console.log("Timeline = %s", collaborationTemplate.timeline);


            Inquiry.addCollaboration(collaborationTemplate, function(err, entry) {
                io.sockets.emit('collaboration', entry);
                res.json(entry);
            });
            
        });
    }
];