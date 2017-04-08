const mongoose = require('mongoose');
const util = require('../../utils/util');
const systemParam = util.getSystemParam();
const appModel = mongoose.model('appModel');
const Schema = mongoose.Schema;

const taskBuildLogSchema = new Schema({
    app: { type: Schema.Types.ObjectId, ref: 'appModel' },
    task: { type: Schema.Types.ObjectId, ref: 'taskModel' },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String},
    buildStatus:{ type: String, enum: Object.keys(systemParam.buildStatus.param)},
});

taskBuildLogSchema.pre('save', function(next) {
    next();
});

taskBuildLogSchema.methods = {
    updateAndSave: function() {
        return this.save();
    }
};

taskBuildLogSchema.statics = {
    getTaskBuildLogByCriteria: function(options) {
        console.log(options);
        let criteria = {};
        if (options.search.appId) {
            criteria.app = options.search.appId;
        }
        if (options.search.taskId) {
            criteria.task = options.search.taskId;
        }
        if (options.search.buildStatus){
            criteria.buildStatus = options.search.buildStatus;
        }
        if (options.search.createdAtStart) {
            criteria.createdAt = {
                "$gte": new Date(options.search.createdAtStart),
                "$lte": new Date(options.search.createdAtEnd)
            };
        }
        if (options.search.createdBy) {
            let reg = new RegExp("\.\*" + options.search.createdBy + "\.\*");
            criteria.createdBy = { '$regex': reg };
        }
        const page = options.page || 0;
        const limit = options.limit || 30;
        return this.find(criteria)
            .populate([{ path: 'app', select: { name: 1 } }, { path: 'task', select: { name: 1 } }])
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * page)
            .exec();
    }
};

mongoose.model('taskBuildLogModel', taskBuildLogSchema);
