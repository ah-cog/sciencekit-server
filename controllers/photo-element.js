// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
  , AccountAvatar = require('../models/account-avatar')
	, Moment = require('../models/moment');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
  passport.authenticate('bearer', { session: false }),
  function(req, res, next) {

    // var timeline = '5156b399cefe76e37d000001';

    console.log(req.files);

    Account.findById(req.user.id, function(err, account) {
      // res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })

      //var accountAvatarTemplate     = req.body;
      var accountAvatarTemplate     = {};
      var filenameStart = req.files.avatar.path.indexOf("/photos");
      accountAvatarTemplate.file = req.files.avatar;
      accountAvatarTemplate.uri = req.files.avatar.path.substring(filenameStart);
      accountAvatarTemplate.account = account;
      // var filenameStart = req.files.avatar.path.indexOf("/photos");
      // var photoUri = req.files.avatar.path.substring(filenameStart);
      console.log("photoUri = " + accountAvatarTemplate.uri);






      // Create thought element
      AccountAvatar.createAvatar(photo, accountAvatarTemplate, function(err, accountAvatar) {

        // Create timeline element
        // TODO: Only create one "timeline element" per "thought element"
        
        // Moment.createTimelineElement(timeline, photo, function(err, timelineElement) {

          // Return result to clients
          io.sockets.emit('accountavatar', accountAvatar);
          res.json(accountAvatar);
        // });
      });

      // // Create photo
      // var photo = new Photo({
      //   uri: photoUri,
      //   author: account
      // });

      // // // Save thought to datastore
      // photo.save(function(err, photo) {
      //   if (err) {
      //     console.log('Error creating photo: ' + photo);
      //   }
      //   console.log('Created photo: ' + photo);

      //   io.sockets.emit('photo', photo);
      //   res.json(photo);
      // });
    });

  }
]