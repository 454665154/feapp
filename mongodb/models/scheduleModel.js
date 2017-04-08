const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const util = require('../../utils/util');
const systemParam = util.getSystemParam();

const scheduleSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: Object.keys(systemParam.scheduleType.param), required: true },
    cronExpression: { type: String, required: true },
    remark: { type: String },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true }
});

scheduleSchema.pre('save', function(next) {
    next();
});

scheduleSchema.methods = {
    updateAndSave: function() {
        return this.save();
    }
};

scheduleSchema.statics = {

};

mongoose.model('scheduleModel', scheduleSchema);
