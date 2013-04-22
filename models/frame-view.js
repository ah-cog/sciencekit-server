var mongoose = require('mongoose');

var frameViewSchema = new mongoose.Schema({

    // The Frame that this FrameView describes
    frame: { type: mongoose.Schema.Types.ObjectId, required: true }, // i.e., the referenced object itself
    frameType: { type: String, required: true }, // i.e., the "ref" value, e.g., 'ThoughtFrame'

    // The Frame becomes "active" when a user of Account engages with it (e.g., 
    // by changing it, selecing a particular acitivty).  Until the Frame 
    // becomes active, it will show the most recent Activity associated with 
    // the Frame.
    active: { type: Boolean, default: false },

    // The visibility of the current Frame (did the user click "hide" button?)
    visible: { type: Boolean, default: true },

    // The current Activity for the Frame for the Account (e.g., the Thought to show for the ThoughtFrame for an Account)
    activity: { type: mongoose.Schema.Types.ObjectId },
    activityType: { type: String, required: true },

    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    date: { type: Date, default: Date.now },
    hidden: { type: Boolean, default: false }
});

frameViewSchema.statics.getPopulated = function(frameView, fn) {

    this.findById(frameView.id, function(err, frameView) {
        frameView.populate({ path: 'activity', model: frameView.activityType }, function(err, populatedFrameView) {
            populatedFrameView.populate({ path: 'account' }, function(err, populatedAuthor) {
                fn(err, frameView);
            });
        });
    });
}

frameViewSchema.statics.getPopulated2 = function(frameView, fn) {

    if (frameView.frameType.indexOf('Frame') !== -1) {
        frameView.populate({ path: 'activity', model: frameView.activityType }, function(err, populatedFrameView) {
            populatedFrameView.populate({ path: 'account' }, function(err, populatedAuthor) {
                fn(err, populatedFrameView);
            });
        });
    } else {
        fn(err, null);
    }
}

// momentSchema.statics.createTimelineElement = function(timeline, element, fn) {

//     var elementType = element.constructor.modelName;

//     // Create timeline element
//     this.create({
//         timeline: timeline,
//         elementType: elementType,
//         element: element
//     }, function(err, timelineElement) {
//         if (err) {
//             console.log('Error creating timeline element: ' + timelineElement);
//         }
//         console.log('Created timeline element: ' + timelineElement);

//         // TODO: Update this to return the element element based on user's view
//         fn(null, timelineElement);
//     });
// }

module.exports = mongoose.model('FrameView', frameViewSchema); // Compile schema to a model