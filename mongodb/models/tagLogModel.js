const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const appModel = mongoose.model('appModel');
const util = require('../../utils/util');
const systemParam = util.getSystemParam();

const tagLogSchema = new Schema({
    app: { type: Schema.Types.ObjectId, ref: 'appModel' },
    projectName: { type: String, required: true },
    tagName: { type: String, required: true },
    tagPath: { type: String, required: true },
    tagOriginPath: { type: String },
    operateType: { type: String, enum: Object.keys(systemParam.tagLogOperateType.param), required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true }
});

tagLogSchema.pre('save', function(next) {
    next();
});

tagLogSchema.methods = {
    updateAndSave: function() {
        return this.save();
    }
};

tagLogSchema.statics = {
    getTagLogListByCriteria: function(options) {
        let criteria = {};
        if (options.search.projectName) {
            criteria.projectName = options.search.projectName;
        }
        if (options.search.tagName) {
            let reg = new RegExp("\.\*" + options.search.tagName + "\.\*");
            criteria.tagName = { '$regex': reg, $options: '$i' };
        }
        if (options.search.operateType) {
            criteria.operateType = options.search.operateType;
        }
        if (options.search.createdAtStart) {
            criteria.createdAt = {
                "$gte": new Date(options.search.createdAtStart),
                "$lte": new Date(options.search.createdAtEnd)
            };
        }
        if (options.search.createdBy) {
            let reg = new RegExp("\.\*" + options.search.createdBy + "\.\*");
            criteria.createdBy = { '$regex': reg, $options: '$i' };
        }
        const page = options.page || 0;
        const limit = options.limit || 30;

        const count = this.find(criteria).count().exec();
        const list = this.find(criteria)
            .populate({ path: 'app', select: { name: 1 } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * page)
            .exec();
        return [count, list];
    }
};

mongoose.model('tagLogModel', tagLogSchema);
