var mongoose = require('mongoose');

var perspectiveSchema = new mongoose.Schema({

    // The Frame that this Perspective describes
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

perspectiveSchema.statics.getPopulated = function(perspective, fn) {

    this.findById(perspective.id, function(err, perspective) {
        perspective.populate({ path: 'activity', model: perspective.activityType }, function(err, populatedPerspective) {
            populatedPerspective.populate({ path: 'account' }, function(err, populatedAuthor) {
                fn(err, perspective);
            });
        });
    });
}

perspectiveSchema.statics.getPopulated2 = function(perspective, fn) {

    console.log('Perspective being populated: ');
    console.log(perspective);

    console.log('Activity:');
    console.log(perspective.activity);

    if (perspective.activity !== undefined) {

        //
        // Populate the Perspective.
        //

        perspective.populate({ path: 'activity', model: perspective.activityType }, function(err, populatedPerspective) {
            if (err) throw err;

            populatedPerspective.activity.populate({ path: 'author' }, function(err, populatedAuthor) {
                if (err) throw err;

                fn(err, populatedPerspective);
            });
        });

    } else {

        //
        // Return the original object.
        //

        fn(null, perspective);
    }
}

module.exports = mongoose.model('Perspective', perspectiveSchema); // Compile schema to a model