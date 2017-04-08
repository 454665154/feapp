const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const ftpSchema = new Schema({
    name: { type: String, required: true },
    path: { type: String, required: true },
    host: { type: String, required: true },
    port: { type: Number, default: 22 },
    username: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    remark: { type: String }
})

ftpSchema.pre('save', function(next) {
    next()
})

ftpSchema.methods = {
    updateAndSave: function() {
        return this.save();
    }
}

ftpSchema.statics = {
        getFtpById: function(id) {
            return this.findOne({ _id: id })
                .exec();
        },
        isExistFtpName: function(ftpName){
            return this.findOne({ name: ftpName }).exec();
        },
        getFtpListByCriteria: function(options) {
            if (options.search && options.search.name) {
                var re = new RegExp("\.\*" + options.search.name + "\.\*", "i");
                options.search = { name: { '$regex': re, $options: '$i' } };
            }
            const search = options.search || {};
            const criteria = options.criteria || search;
            const page = options.page || 0;
            const limit = options.limit || 30;
            const count = this.find(criteria).count().exec();
            const list = this.find(criteria)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * page)
                .exec();
            return [count, list];
        }
    }
    //注册mongoose模型，其他地方可以直接 mongoose.model('Ftp)调用
mongoose.model('ftpModel', ftpSchema);
