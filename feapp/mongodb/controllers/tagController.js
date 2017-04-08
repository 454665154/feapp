const mongoose = require('mongoose');
const { wrap: async } = require('co');
const svnUltimate = require('node-svn-ultimate');
const tagLogModel = mongoose.model('tagLogModel');
const logger = require('log4js').getLogger();
const msg = require('../../utils/message');
const util = require('../../utils/util');
const systemParam = util.getSystemParam();
const systemConfig = util.getSystemConfig();

/**
 * 根据查询条件获取Tag列表
 */
exports.getTagListByCriteria = async(function*(req, res) {
    try {
        const projectTagPath = req.query.projectTagPath;
        const svnChildDirList = yield getSvnChildDirList(projectTagPath);
        let tagList = [];
        svnChildDirList.forEach(function(item) {
            let tag = {};
            tag.tagName = item.name;
            tag.createdAt = item.commit.date;
            tag.creatorName = item.commit.author;
            tag.revision = item.commit.$.revision;
            tagList.push(tag);
        });
        util.sortByVersionNumber(tagList, 'tagName', true); //版本号倒序排列
        res.send(msg.genSuccessMsg('读取Tag列表成功', tagList));
    } catch (error) {
        logger.error(req.url, '读取Tag列表失败', error);
        res.send(msg.genFailedMsg('读取Tag列表失败'));
    }
});

/**
 * 根据Tag路径获取最新的Tag名称
 */
exports.getLatestTagNameByTagPath = async(function*(req, res) {
    try {
        const projectTagPath = req.query.projectTagPath;
        const svnChildDirList = yield getSvnChildDirList(projectTagPath);
        let tagList = svnChildDirList.map(function(item) {
            return item.name;
        });
        util.sortByVersionNumber(tagList, null, true); //版本号倒序排列
        res.send(msg.genSuccessMsg('获取最新Tag名称成功', tagList[0]));
    } catch (error) {
        logger.error(req.url, '获取最新Tag名称失败', error);
        res.send(msg.genFailedMsg('获取最新Tag名称失败'));
    }
});

/**
 * 根据应用的SVN目录获取项目列表
 */
exports.getProjectListByAppPath = async(function*(req, res) {
    try {
        const tagPath = req.query.tagPath;
        const svnChildDirList = yield getSvnChildDirList(tagPath);
        let projectList = svnChildDirList.map(function(item) {
            return { name: item.name };
        });
        res.send(msg.genSuccessMsg('读取项目列表成功', projectList));
    } catch (error) {
        logger.error(req.url, '读取项目列表失败', error);
        res.send(msg.genFailedMsg('读取项目列表失败'));
    }
});

/**
 * 创建Tag
 */
exports.createTag = async(function*(req, res) {
    try {
        let tagLog = new tagLogModel(req.body);
        tagLog.createdBy = req.session.user.username;
        tagLog.operateType = systemParam.tagLogOperateType.constant.CREATE;
        yield tagLog.updateAndSave(); //记录Tag日志
        //yield copySvnProject(tagLog.tagOriginPath, tagLog.tagPath);//创建Tag
        res.send(msg.genSuccessMsg('保存成功'));
    } catch (error) {
        logger.error(req.url, '保存Tag失败', error);
        res.send(msg.genFailedMsg('保存失败'));
    }
});

/**
 * 拷贝Tag
 */
exports.copyTag = async(function*(req, res) {
    try {
        let tagLog = new tagLogModel(req.body);
        tagLog.createdBy = 'liuzhengwu';
        tagLog.operateType = systemParam.tagLogOperateType.constant.COPY;
        yield tagLog.updateAndSave(); //记录Tag日志
        //yield copySvnProject(tagLog.tagOriginPath, tagLog.tagPath);//拷贝Tag
        res.send(msg.genSuccessMsg('保存成功'));
    } catch (error) {
        logger.error(req.url, '拷贝Tag失败', error);
        res.send(msg.genFailedMsg('保存失败'));
    }
});

/**
 * 删除Tag
 */
exports.deleteTag = async(function*(req, res) {
    try {
        let tagLog = new tagLogModel(req.body);
        tagLog.createdBy = req.session.user.username;
        tagLog.operateType = systemParam.tagLogOperateType.constant.DELETE;
        yield tagLog.updateAndSave(); //记录Tag日志
        //yield deleteSvnProject(tagLog.tagPath);//删除Tag
        res.send(msg.genSuccessMsg('删除成功'));
    } catch (error) {
        logger.error(req.url, '删除Tag失败!', error);
        res.send(msg.genFailedMsg('删除失败'));
    }
});


/**
 * 拷贝svn项目
 * @param  {String} originUrl 原始路径
 * @param  {String} distUrl   目标路径
 * @return {Object} Promise对象
 */
function copySvnProject(originUrl, distUrl) {
    return new Promise(function(resolve, reject) {
        svnUltimate.commands.copy(originUrl, distUrl, { params: systemConfig.svnDefaultComments }, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * 删除svn项目
 * @param  {String} svnUrl 被删除项目的svn路径
 * @return {Object} Promise对象
 */
function deleteSvnProject(svnUrl) {
    return new Promise(function(resolve, reject) {
        svnUltimate.commands.copy(svnUrl, {}, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * 获取SVN的子目录列表
 * @param  {String} svnUrl 被删除项目的svn路径
 * @return {Object} Promise对象
 */
function getSvnChildDirList(svnUrl) {
    return new Promise(function(resolve, reject) {
        svnUltimate.commands.list(svnUrl, {}, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.list.entry.constructor === Array ? data.list.entry : [data.list.entry]);
            }
        });
    });
}
