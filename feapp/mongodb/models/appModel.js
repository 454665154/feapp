const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const util = require('../../utils/util');
const systemParam = util.getSystemParam();

const appSchema = new Schema({
    name:{ type: String, required: true },
    createdAt  : { type : Date, default : Date.now },
    vcsType:{ type: String, enum: Object.keys(systemParam.vcsType.param), required: true },
    masterPath:{ type: String, required: true },
    branchPath:{ type: String },
    tagPath:{ type: String, required: true },
    remark:{ type: String}
})

appSchema.pre('save',function(next){
    next()
})

appSchema.methods = {
    updateAndSave : function () {
        return this.save();
    }
}

appSchema.statics = {
    getAppById : function(id){
        return this.findOne({_id : id })
          .exec();
    },
    isExistAppName : function(appName){
        return this.findOne({name:appName}).exec();
    },
    getAppListByCriteria : function(options){
        if(options.search && options.search.name){
            var re =new RegExp("\.\*" + options.search.name + "\.\*");
            options.search = {name:{'$regex': re}};
        }
        const search = options.search || {};
        const criteria = options.criteria || search;
        const page = options.page || 0;
        const limit = options.limit || 30;
        const count = this.find(criteria).count().exec();
        const list = this.find(criteria)
            .sort({ name: 1 }) //名称排序
            .limit(limit)
            .skip(limit * page)
            .exec();
        return [count,list];
    },
    getAllAppList : function(options){
        let criteria = {};
        if(options){
            criteria._id = { $in: options.appIdList };
        }
        return this.find(criteria)
            .sort({ name: 1 })
            .exec();
        }
}
//注册mongoose模型，其他地方可以直接 mongoose.model('Ftp)调用
mongoose.model('appModel',appSchema);
