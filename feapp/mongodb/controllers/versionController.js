const mongoose = require('mongoose');
const { wrap: async } = require('co');
const logger = require('log4js').getLogger();
const versionDeleteLogModel = mongoose.model('versionDeleteLogModel');
const taskModel = mongoose.model('taskModel');
const msg = require('../../utils/message');
const Client = require('ssh2-sftp-client');
const sftp = new Client();

/**
 * 根据查询条件获取版本列表
 */
exports.getVersionListByTaskId = async(function*(req, res) {
    try {
        const taskId = req.query.taskId;
        const task = yield taskModel.getTaskById(taskId);
        yield sftp.connect(task.ftp);
        let fileList = yield sftp.list(task.ftp.path);
        const taskName = task.name;
        const appId = task.app._id;
        const appName = task.app.name;
        const versionList = fileList.filter(function(item) {
            return item.type != 'd' && item.name.endsWith('.tar.gz'); //过滤掉文件夹，只保留文件
        }).map(function(item) {
            return {
                taskId: taskId,
                taskName: taskName,
                appId: appId,
                appName: appName,
                name: item.name,
                createdAt: item.modifyTime
            };
        }).sort(function(preItem, curItem) {
            const preCreatedAt = Number(preItem.createdAt);
            const curCreatedAt = Number(curItem.createdAt);
            if (preCreatedAt < curCreatedAt) {
                return 1;
            } else if (preCreatedAt > curCreatedAt) {
                return -1;
            }
            return 0;
        });
        res.send(msg.genSuccessMsg('读取版本列表成功', versionList));
    } catch (error) {
        logger.error(req.url, '获取版本列表失败', error);
        res.send(msg.genFailedMsg('读取版本列表失败'));
    }
});

/**
 * 删除版本
 */
exports.deleteVersion = async(function*(req, res) {
    try {
        console.log(req.body);
        let versionDeleteLog = new versionDeleteLogModel(req.body);
        versionDeleteLog.createdBy = req.session.user.username;
        yield versionDeleteLog.updateAndSave(); //记录版本删除日志

        const taskId = req.body.task;
        const versionName = req.body.versionName;
        const task = yield taskModel.getTaskById(taskId);
        // yield sftp.connect(task.ftp);
        // yield sftp.delete(`${task.ftp.path}/${versionName}`);
        res.send(msg.genSuccessMsg('删除成功'));
    } catch (error) {
        logger.error(req.url, '删除版本失败', error);
        res.send(msg.genFailedMsg('删除失败'));
    }
});

/**
 * 下载版本
 */
exports.downloadVersion = async(function*(req, res) {
    try {
        const taskId = req.query.taskId;
        const versionName = req.query.versionName;
        const task = yield taskModel.getTaskById(taskId);
        yield sftp.connect(task.ftp);
        const data = yield sftp.get(`${task.ftp.path}/${versionName}`);
        console.log(data);
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(versionName));
        data.pipe(res);
    } catch (error) {
        logger.error(req.url, '下载版本失败', error);
    }
});
