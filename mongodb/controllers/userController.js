const mongoose = require('mongoose');
const userModel = mongoose.model('userModel');
const userTaskMapModel = mongoose.model('userTaskMapModel');
const { wrap: async } = require('co');
const msg = require('../../utils/message');
const logger = require('log4js').getLogger();

exports.load = async(function* (req,res,next,id){
    try {
        req.user = yield userModel.getUserById(id)
        if (!req.user) return next(new Error('Use not found'));
    } catch (error) {
        logger.error(req.url, 'load', error);
        return next(err);
    }
    next()
});
/**
 * 创建用户
 */
exports.createUser = async(function* (req,res){
    let  user = new userModel(req.body);
    try {
        yield user.updateAndSave();
        res.send(msg.genSuccessMsg('创建用户保存成功'));
    } catch (error) {
        logger.error(req.url, '创建用户保存失败', error);
        res.send(msg.genFailedMsg('创建用户保存失败'));
    }
});
/**
 * 更新用户
 */
exports.updateUser = async(function*(req,res){
    try {
        let user = req.user;
        user = Object.assign(user,req.body);
        yield user.updateAndSave();

        let currentTasks = req.body.currentTasks;

        userTaskMapModel.removeUserTaskMapByCriteria({user:user._id});
        let userTaskMapPromise = [];
        currentTasks.forEach(function(taskId){
            let userTaskMap = new userTaskMapModel();
            userTaskMap.task = taskId;
            userTaskMap.user = user._id;
            userTaskMapPromise.push(userTaskMap.updateAndSave());
        });
        yield userTaskMapPromise;
        
        res.send(msg.genSuccessMsg('更新用户保存成功'))
    } catch (error) {
        logger.error(req.url, '更新用户保存失败', error);
        res.send(msg.genFailedMsg('更新用户保存失败'));
    }
});
/**
 * 通过查询条件获取用户列表
 */
// exports.list = async(function* (req,res){
exports.getUserListByCriteria = async(function*(req, res) {
    try {
        var query = {
            page: parseInt(req.query.page) - 1,
            limit: parseInt(req.query.limit)
        }
        if (req.query.searchKey && req.query.searchKey != '') {
            query.search = {
                username: req.query.searchKey
            }
        }
        const [count, list] = yield userModel.getUserListByCriteria(query);
        res.send(msg.genSuccessMsg('读取用户列表成功', list, {
            count: count
        }))
    } catch (error) {
        logger.error(req.url, '读取用户列表失败', error);
        res.send(msg.genFailedMsg('读取用户列表失败'));
    }
});
/**
  * 获取所有用户
*/
exports.getAllUserList = async(function* (req,res){
    try {
        var list = yield userModel.getAllUserList();
        res.send(msg.genSuccessMsg('获取用户列表成功', list));
    } catch(error){
        logger.error(req.url, '获取用户列表失败', error);
        res.send(msg.genFailedMsg('获取用户列表失败'));
    }
})

/**
 * 删除用户
 */
exports.deleteUser = async(function* (req,res){
    try {
        let user = req.user;
        yield user.remove()
        res.send(msg.genSuccessMsg('删除用户成功',user));
    } catch (error) {
        logger.error(req.url, '删除用户失败', error);
        res.send(msg.genFailedMsg('删除用户失败'));
    }
});
