// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Note = require('../models/note')
	, Inquiry = require('../models/inquiry');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        console.log(req.body);

        Account.findById(req.user.id, function(err, account) {

            var noteTemplate = req.body;
            noteTemplate.account = account;
            // console.log("Received: ");
            // console.log(collaborationTemplate);
            // console.log("Timeline = %s", collaborationTemplate.timeline);

            if (noteTemplate.note.length <= 0) {
                res.json({});
                return;
            }

            Note.create({
                account: noteTemplate.account,
                page: noteTemplate.page,
                note: noteTemplate.note

            }, function(err, note) {

                if (err) throw err;

                note.populate({ path: 'page', model: 'Page' }, function(err, notePopulated) {

                    io.sockets.emit('note', note);
                    res.json(note);
                });

            });
            
        });
    }
];

exports.read = [
    function(req, res, next) {

        // Get requested activity type from URI
        // e.g., /api/<activityType>/tag
        //var activityType = req.params.activityType;

        // Get Frame ID
        var pageId = null;
        if (req.query['pageId']) {
            pageId = req.query['pageId'];
        }
        //var frameType = activityType.charAt(0).toUpperCase() + activityType.slice(1) + 'Frame';
        console.log('Getting Notes for Page ' + pageId);

        var result = [];

        if (pageId !== null) {

            Note.findOne({ page: pageId }).sort('-date').exec(function(err, note) {
                if (err) throw err;

                if (note === null) {
                    res.json([]);
                    return;
                }

                note.populate({ path: 'page', model: 'Page' }, function(err, notePopulated) {

                    io.sockets.emit('note', notePopulated);
                    res.json(notePopulated);
                });
                
            });
        } else {
            res.json(result);
        }
    }
];