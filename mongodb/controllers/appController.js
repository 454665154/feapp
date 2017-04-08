const mongoose = require('mongoose');
const appModel = mongoose.model('appModel');
const { wrap: async } = require('co');
const msg = require('../../utils/message');
const logger = require('log4js').getLogger();
const util = require('../../utils/util');
const userTaskMapModel = mongoose.model('userTaskMapModel');
const taskModel = mongoose.model('taskModel');
const underscore = require('underscore');

exports.load = async(function*(req, res, next, id) {
    try {
        req.app = yield appModel.getAppById(id);
        if (!req.app) return next(new Error('Use not found'));
    } catch (error) {
        logger.error(req.url, 'load', error);
        return next(err);
    }
    next()
});
/**
 * 创建应用
 */
exports.createApp = async(function*(req, res) {
    let app = new appModel(req.body);
    try {
        yield app.updateAndSave();
        res.send(msg.genSuccessMsg('创建应用保存成功'))
    } catch (error) {
        logger.error(req.url, '创建应用保存失败', error);
        res.send(msg.genFailedMsg('创建应用保存失败'));
    }
});
/**
 * 更新应用
 */
exports.updateApp = async(function*(req, res) {
    try {
        let app = req.app;
        app = Object.assign(app, req.body);
        yield app.updateAndSave();
        res.send(msg.genSuccessMsg('更新应用保存成功'));
    } catch (error) {
        logger.error(req.url, '更新应用保存失败', error);
        res.send(msg.genFailedMsg('更新应用保存失败'));
    }
});
/**
 * 校验App名是否已经存在
 */
exports.isExistAppName = async(function*(req,res){
    try{
        let appName = req.query.appName;
        req.app = yield appModel.isExistAppName(appName);
        req.app==null?res.send(msg.genSuccessMsg('此应用名可用')):res.send(msg.genFailedMsg('此应用名已经存在'));
    }catch(error){
        logger.error(req.url,'应用名校验失败');
        res.send(msg.genFailedMsg('应用名校验失败'));
    }
});
/**
 * 通过查询条件获取应用列表
 */
exports.getAppListByCriteria = async(function*(req, res) {
    try {
        var query = {
            page: parseInt(req.query.page) - 1,
            limit: parseInt(req.query.limit)
        }
        if (req.query.searchKey && req.query.searchKey != '') {
            query.search = {
                name: req.query.searchKey
            }
        }
        const [count, list] = yield appModel.getAppListByCriteria(query);
        res.send(msg.genSuccessMsg('读取应用列表成功', list, {
            count: count
        }));
    } catch (error) {
        logger.error(req.url, '读取应用列表失败', error);
        res.send(msg.genFailedMsg('读取应用列表失败'));
    }
});
/**
 * 获取所有应用
 */
exports.getAllAppList = async(function*(req, res) {
    try {
        let list;
        let user = req.session.user;
        let isAdmin = util.isAdmin(user);
        if(isAdmin){
            list = yield appModel.getAllAppList();
        }else{
            let taskList = yield userTaskMapModel.getTaskListByUserId(user._id);
            let taskIdList = taskList.map(function(item){
                return item.task._id;
            });

            let tasks = yield taskModel.getTaskListByTaskIds(taskIdList);
            let appIdList = tasks.map(function(item){
                return item.app.toString();
            });
            appIdList = underscore.uniq(appIdList);

            let query = {
                appIdList:appIdList
            };

            list = yield appModel.getAllAppList(query);
        }
        
        res.send(msg.genSuccessMsg('读取应用列表成功', list));
    } catch (error) {
        logger.error(req.url, '读取应用列表失败', error);
        res.send(msg.genFailedMsg('读取应用列表失败'));
    }
});
/**
 * 删除应用
 */
exports.deleteApp = async(function*(req, res) {
    try {
        let app = req.app;
        yield app.remove()
        res.send(msg.genSuccessMsg('删除应用成功', app))
    } catch (error) {
        logger.error(req.url, '删除应用失败', error);
        res.send(msg.genFailedMsg('删除应用失败'))
    }
});

