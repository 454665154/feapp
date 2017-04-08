const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    _id: { type: String, required: true },
    session: { type: String, required: true },
    expires: { type: Date, default: Date.now }
});

sessionSchema.statics = {
    removeSessionByIds: function(sessionIds) {
        return this.remove({ _id: { $in: sessionIds } }).exec();
    },
    getAllSessionList: function() {
        return this.find().exec();
    }
};
mongoose.model('sessionModel', sessionSchema);
