const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const userModel = mongoose.model('userModel');
const taskModel = mongoose.model('taskModel');

const userTaskMapSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'userModel'
    },
    task: {
        type: Schema.Types.ObjectId,
        ref: 'taskModel'
    }
})

userTaskMapSchema.pre('save', function(next) {
    next()
})

userTaskMapSchema.methods = {
    updateAndSave: function() {
        return this.save();
    }
}

userTaskMapSchema.statics = {
    getUserListByTaskId: function(taskId) {
        return this.find({
                task: taskId
            })
            .populate({
                path: 'user',
                select: {
                    _id: 1
                }
            })
            .exec();
    },
    getTaskListByUserId: function(userId) {
        return this.find({
                user: userId
            })
            .populate({
                path: 'task',
                select: {
                    _id: 1
                }
            })
            .exec();
    },
    removeUserTaskMapByCriteria: function(criteria) { //通过ID删除用户任务中间表
        return this.remove(criteria).exec();
    }
}

//注册mongoose模型，其他地方可以直接 mongoose.model('User)调用
mongoose.model('userTaskMapModel', userTaskMapSchema);
