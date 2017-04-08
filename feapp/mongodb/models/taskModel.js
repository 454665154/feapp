const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userModel = mongoose.model('userModel');
const appModel = mongoose.model('appModel');

const taskSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    app: {
        type: Schema.Types.ObjectId,
        ref: 'appModel'
    },
    command: {
        type: String,
        required: true
    },
    branchType: {
        type: String,
        required: true
    },
    ftp: {
        type: Schema.Types.ObjectId,
        ref: 'ftpModel'
    },
    isCombinePackage: {
        type: Boolean,
        default: true
    },
    backEndPackagePath: {
        type: String,
        required: true
    },
    isPublish: {
        type: Boolean,
        default: false
    },
    jenkinsPath: {
        type: String,
        required: true
    },
    jenkinsName: {
        type: String,
        required: true
    },
    jenkinsUsername: {
        type: String,
        required: true
    },
    jenkinsPassword: {
        type: String,
        required: true
    },
    jobFirstParamKey: {
        type: String
    },
    jobFirstParamValue: {
        type: String
    },
    jobSecondParamKey: {
        type: String
    },
    jobSecondParamValue: {
        type: String
    },
    jobThirdParamKey: {
        type: String
    },
    jobThirdParamValue: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    remark: {
        type: String
    },
    users:{ 
        type : Array, 
        default : [], 
        ref: 'userModel' 
    },
    createdAt:{ 
        type : Date, 
        default : Date.now 
    }
})

taskSchema.pre('save',function(next){
    next()
})

taskSchema.methods = {
    updateAndSave: function(){
        return this.save();
    }
}

taskSchema.statics = {
    getTaskById: function(id){
        return this.findOne({_id:id})
            .populate([{
                path: 'ftp'
            },{
                path: 'app'
            }])
            .exec();
    },
    getAllTaskList : function(){
        return this.find()
            .sort({ name: 1 })
            .exec();
    },
    getTaskListByTaskIds: function(taskIds){
        return this.find({_id:{$in: taskIds}})
            .select('app')
            .exec();
    },
    getTaskListByAppId: function(appId,query){
        return this.find({
            app: appId,
            _id:{$in: query.taskIdList}
        })
        .select('name')
        .sort({ name: 1 })
        .exec();
    },
    isExistTaskName : function(taskName){
        return this.findOne({name:taskName}).exec();
    },
    getTaskListByCriteria: function(options){ //{ _id: { $in: sessionIds }
        if(options.search && options.search.name){
            var re =new RegExp("\.\*" + options.search.name + "\.\*","i");
            options.search = {name:{'$regex': re, $options: '$i'}};
        }
        const search = options.search || {};
        const criteria = options.criteria || search;
        const page = options.page || 0;
        const limit = options.limit || 30;
        if(options.taskIdList){
            criteria._id = { $in: options.taskIdList };
        }
        const count = this.find(criteria).count().exec();
        const list = this.find(criteria)
            .populate([{
                path: 'app',
                select: {
                    name: 1
                }
            },{
                path: 'ftp',
                select: {
                    name: 1
                }
            }])
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(limit * page)
            .exec();
        return [count,list];
    }
}

//注册mongoose模型，其他地方可以直接 mongoose.model('Task)调用
mongoose.model('taskModel',taskSchema);
