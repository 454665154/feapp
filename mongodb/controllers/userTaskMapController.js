const mongoose = require('mongoose');
const userTaskMapModel = mongoose.model('userTaskMapModel');
const { wrap: async } = require('co');
const msg = require('../../utils/message');
const logger = require('log4js').getLogger();

/**
 * 通过任务ID获取用户列表
 */
exports.getUserListByTaskId = async(function*(req, res) {
    try {
        const taskId = req.query.taskId;
        var userList = yield userTaskMapModel.getUserListByTaskId(taskId);
        res.send(msg.genSuccessMsg('获取用户列表成功', userList));
    } catch (error) {
        logger.error(req.url, '获取用户列表失败', error);
        res.send(msg.genFailedMsg('获取用户列表失败'));
    }
});

/**
 * 通过用户ID获取当前选中任务
 */
exports.getTaskListByUserId = async(function*(req, res) {
    try {
        const userId = req.query.userId;
        var taskList = yield userTaskMapModel.getTaskListByUserId(userId);
        res.send(msg.genSuccessMsg('获取任务列表成功', taskList));
    } catch (error) {
        logger.error(req.url, '获取任务列表失败', error);
        res.send(msg.genFailedMsg('获取任务列表失败'));
    }
});

