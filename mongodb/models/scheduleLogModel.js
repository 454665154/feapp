// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const scheduleModel = mongoose.model('scheduleModel');
// const systemParam = require('../../utils/system-param');

// const scheduleLogSchema = new Schema({
//     schedule: { type: Schema.Types.ObjectId, ref: 'scheduleModel' },
//     executeResultType: { type: String, enum: Object.keys(systemParam.scheduleExecuteResultType.param), required: true },
//     type: { type: String, enum: Object.keys(systemParam.scheduleLogType.param), require: true },
//     createdAt: { type: Date, default: Date.now },
//     createdBy: { type: String }
// });

// scheduleLogSchema.pre('save', function(next) {
//     next();
// });

// scheduleLogSchema.methods = {
//     updateAndSave: function() {
//         return this.save();
//     }
// };

// scheduleLogSchema.statics = {

// };

// mongoose.model('scheduleLogModel', scheduleLogSchema);
