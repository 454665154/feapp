const mongoose = require('mongoose');
const appModel = mongoose.model('appModel');
const taskModel = mongoose.model('taskModel');
const Schema = mongoose.Schema;

const versionDeleteLogSchema = new Schema({
    app: { type: Schema.Types.ObjectId, ref: 'appModel' },
    task: { type: Schema.Types.ObjectId, ref: 'taskModel' },
    versionName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true }
});

versionDeleteLogSchema.pre('save', function(next) {
    next();
});

versionDeleteLogSchema.methods = {
    updateAndSave: function() {
        return this.save();
    }
};

versionDeleteLogSchema.statics = {
    getTagLogListByCriteria: function(options) {
        let criteria = {};
        if (options.search.taskId) {
            criteria.task = options.search.taskId;
        }
        if (options.search.versionName) {
            let reg = new RegExp("\.\*" + options.search.versionName + "\.\*");
            criteria.versionName = { '$regex': reg };
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
        const count = this.find(criteria).count().exec();
        const list = this.find(criteria)
            .populate([{ path: 'app', select: { name: 1 } }, { path: 'task', select: { name: 1 } }])
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * page)
            .exec();
        return [count, list];
    }
};

mongoose.model('versionDeleteLogModel', versionDeleteLogSchema);
