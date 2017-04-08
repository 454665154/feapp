const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username:{ type: String, required: true },
    role:{ type: String, required: true },
    createdAt: { type : Date, default : Date.now }
})

userSchema.pre('save',function(next){
    next()
})

userSchema.methods = {
    updateAndSave : function () {
        return this.save();
    }
}

userSchema.statics = {
    getUserById : function(id){
        return this.findOne({_id : id })
          .exec();
    },
    getUserByUsername:function(username){
        return this.findOne({username : username })
          .exec();
    },
    getAllUserList:function(){
        return this.find().select('username').sort({ username: 1 }).exec();
    },
    getUserListByCriteria : function(options){
        if(options.search && options.search.username){
            var re =new RegExp("\.\*" + options.search.username + "\.\*");
            options.search = {username:{'$regex': re}};
        }
        const search = options.search || {};
        const criteria = options.criteria || search;
        const page = options.page || 0;
        const limit = options.limit || 30;
        const count = this.find(criteria).count().exec();
        const list = this.find(criteria)
            .sort({ username: 1 })
            .limit(limit)
            .skip(limit * page)
            .exec();
        return [count,list];
    }
}
//注册mongoose模型，其他地方可以直接 mongoose.model('User)调用
mongoose.model('userModel',userSchema);
