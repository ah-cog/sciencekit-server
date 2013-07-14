// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Identity = require('../models/identity')
	, Inquiry = require('../models/inquiry');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {

        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var entryTemplate = req.body;
            entryTemplate.account = account;
            console.log("Received: ");
            console.log(entryTemplate);

            Inquiry.addIdentity(entryTemplate, function(err, entry) {
                io.sockets.emit('identity', entry);
                res.json(entry);
            });
        });
    }
];