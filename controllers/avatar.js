// Controller
// Exports methods for Account model.
var passport = require('passport')
  , socketio = require('socket.io')
  , Account = require('../models/account')
  , Avatar = require('../models/avatar')
  , Moment = require('../models/moment')
  , Inquiry = require('../models/inquiry');

exports.read = [
    passport.authenticate('bearer', { session: false }),
    function(req, res, next) {

        var conditions = {};
        if (req.query['id']) {
            conditions['_id'] = req.query['id'];
        } else {
            conditions['_id'] = req.user.id;
        }

        // Get avatar
        Account.findOne(conditions, function(err, account) {

            Avatar.findOne({ account: account.id }, function(err, avatar) {
                io.sockets.emit('avatar', avatar);
                res.json(avatar);
            });

        });

    }
]

exports.create = [
    passport.authenticate('bearer', { session: false }),
    function(req, res, next) {

        // Get POST data
        var data     = req.body;

        // Get avatar
        Account.findById(req.user.id, function(err, account) {

            var avatarTemplate      = {};
            var filenameStart       = req.files.avatar.path.indexOf("/uploads");
            avatarTemplate.file     = req.files.avatar;
            avatarTemplate.uri      = req.files.avatar.path.substring(filenameStart);
            avatarTemplate.account  = account;
            console.log("avatarUri = " + avatarTemplate.uri);
            console.log(avatarTemplate);

            Avatar.create({
                account: account,
                uri: avatarTemplate.uri

            }, function(err, avatar) {
                io.sockets.emit('avatar', avatar);
                res.json(avatar);
            });

        });

    }
]