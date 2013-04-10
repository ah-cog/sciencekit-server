// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account')
	, Photo = require('../models/photo')
	, PhotoElement = require('../models/photo-element')
	, Moment = require('../models/moment');

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
  passport.authenticate('bearer', { session: false }),
  function(req, res, next) {

    var timeline = '5156b399cefe76e37d000001';

    console.log(req.files);

    Account.findById(req.user.id, function(err, account) {
      // res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })

      //var photoElementTemplate     = req.body;
      var photoElementTemplate     = {};
      var filenameStart = req.files.myphoto.path.indexOf("/photos");
      photoElementTemplate.file = req.files.myphoto;
      photoElementTemplate.uri = req.files.myphoto.path.substring(filenameStart);
      photoElementTemplate.account = account;
      // var filenameStart = req.files.myphoto.path.indexOf("/photos");
      // var photoUri = req.files.myphoto.path.substring(filenameStart);
      console.log("photoUri = " + photoElementTemplate.uri);






      // "Recall" thought, i.e., Get existing one with specified ID or create a new one.
      Photo.getOrCreatePhoto(photoElementTemplate, function(err, photo) {

        // Create thought element
        PhotoElement.createPhotoElement(photo, photoElementTemplate, function(err, photoElement) {

          // Create timeline element
          // TODO: Only create one "timeline element" per "thought element"
          
          Moment.createTimelineElement(timeline, photo, function(err, timelineElement) {

            // Return result to clients
            io.sockets.emit('photo', photoElement);
            res.json(photoElement);
          });
        });
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