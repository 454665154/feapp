const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const exec = require('child_process').exec;
const svnUltimate = require('node-svn-ultimate');
const tarPack = require('tar-pack');
const Client = require('ssh2-sftp-client');
const sftp = new Client();
const logger = require('log4js').getLogger();
const { wrap: async } = require('co');
const mongoose = require('mongoose');
const taskModel = mongoose.model('taskModel');
const taskBuildLogModel = mongoose.model('taskBuildLogModel');
const appModel = mongoose.model('appModel');
const userTaskMapModel = mongoose.model('userTaskMapModel');
const msg = require('../../utils/message');
const taskBuild = require('../../utils/task-build');
const util = require('../../utils/util');
const systemConfig = util.getSystemConfig();
const _ = require('../../utils/fis-util');

exports.load = async(function* (req,res,next,id){
    try {
        req.task = yield taskModel.getTaskById(id)
        if (!req.task) return next(new Error('Use not found'));
    } catch (error) {
        logger.error(req.url, 'load', error);
        return next(err);
    }
    next()
});
/**
 * 创建任务
 */
exports.createTask = async(function* (req,res){
    let  task = new taskModel(req.body);
    try {
        yield task.updateAndSave();

        let currentUsers = req.body.currentUsers;
        userTaskMapModel.removeUserTaskMapByCriteria({task:task._id});
        let userTaskMapPromise = [];
        currentUsers.forEach(function(userId){
            let userTaskMap = new userTaskMapModel();
            userTaskMap.task = task._id;
            userTaskMap.user = userId;
            userTaskMapPromise.push(userTaskMap.updateAndSave());
        });
        yield userTaskMapPromise;

        res.send(msg.genSuccessMsg('创建任务保存成功'));
    } catch (error) {
        logger.error(req.url, '创建任务保存失败', error);
        res.send(msg.genFailedMsg('创建任务保存失败'));
    }
});
/**
 * 更新任务
 */
exports.updateTask = async(function*(req,res){
    try {
        let task = req.task;
        task = Object.assign(task,req.body);
        yield task.updateAndSave();

        let currentUsers = req.body.currentUsers;
        userTaskMapModel.removeUserTaskMapByCriteria({task:task._id});
        let userTaskMapPromise = [];
        currentUsers.forEach(function(userId){
            let userTaskMap = new userTaskMapModel();
            userTaskMap.task = task._id;
            userTaskMap.user = userId;
            userTaskMapPromise.push(userTaskMap.updateAndSave());
        });
        yield userTaskMapPromise;

        res.send(msg.genSuccessMsg('更新任务保存成功'))
    } catch (error) {
        logger.error(req.url, '更新任务保存失败', error);
        res.send(msg.genFailedMsg('更新任务保存失败'));
    }
});
/**
 * 校验任务名是否已经存在
 */
exports.isExistTaskName = async(function*(req,res){
    try{
        let taskName = req.query.taskName;
        req.task = yield taskModel.isExistTaskName(taskName);
        req.task==null?res.send(msg.genSuccessMsg('此任务名可用')):res.send(msg.genFailedMsg('此任务名已经存在'));
    }catch(error){
        logger.error(req.url,'任务名校验失败');
        res.send(msg.genFailedMsg('任务名校验失败'));
    }
})
/**
 * 通过查询条件获取任务列表
 */
exports.getTaskListByCriteria = async(function* (req,res){
    try{
        let userId = req.session.user._id;
        let taskList = yield userTaskMapModel.getTaskListByUserId(userId);
        let taskIdList = taskList.map(function(item){
            return item.task._id;
        })
        var query = {
            page : parseInt(req.query.page)-1,
            limit : parseInt(req.query.limit),
            taskIdList:taskIdList
        }
        if(req.query.searchKey && req.query.searchKey!=''){
            query.search = {name:req.query.searchKey}
        }
        const [count, list] = yield taskModel.getTaskListByCriteria(query);
        res.send(msg.genSuccessMsg('读取任务列表成功',list,{count:count}))
    } catch (error){
        logger.error(req.url, '读取任务列表失败', error);
        res.send(msg.genFailedMsg('读取任务列表失败'));
    }
});

/**
  * 获取所有任务列表
*/
exports.getAllTaskList = async(function* (req,res){
   try{
        var list = yield taskModel.getAllTaskList();
        res.send(msg.genSuccessMsg('获取任务列表成功',list))
   } catch(error){
        logger.error(req.url, '获取任务列表失败', error);
        res.send(msg.genFailedMsg('获取任务列表失败'));
   }
});
/**
  *通过应用id获取此应用下的所有任务
*/
exports.getTaskListByAppId = async(function* (req,res){
    try{
        let list;
        let user = req.session.user;
        let isAdmin = util.isAdmin(user);
        let appId = req.query.id;
        if(isAdmin){
            list = yield taskModel.getTaskListByAppId(appId);
        }else{
            let taskList = yield userTaskMapModel.getTaskListByUserId(user._id);
            let taskIdList = taskList.map(function(item){
                return item.task._id;
            });
            let query = {
                taskIdList:taskIdList
            };
            list = yield taskModel.getTaskListByAppId(appId,query);
        }
        res.send(msg.genSuccessMsg('读取当前应用下所有任务成功',list));
    } catch (error){
        logger.error(req.url, '读取当前应用下所有任务失败', error);
        res.send(msg.genFailedMsg('读取当前应用下所有任务失败'));
    }
});
/**
 * 通过任务id获取应用下所有分支类型(分支类型为空则不取)
*/
exports.getAllBranchTypeByAppId = async(function* (req,res){
    try{
        let appId = req.query.appId;
        let app = yield appModel.getAppById(appId);
        let allBranchType = [];
        if(app.masterPath!==''){
            allBranchType.push('master');
        }
        if(app.branchPath!==''){
            allBranchType.push('branch');
        }
        if(app.tagPath!==''){
            allBranchType.push('tag');
        }
        res.send(msg.genSuccessMsg('读取当前应用下所有分支类型成功',allBranchType));
    }catch(error){
        logger.error(req.url, '读取当前应用下所有分支类型失败', error);
        res.send(msg.genFailedMsg('读取当前应用下所有分支类型失败'));
    }
});
/**
 * 删除任务
 */
exports.deleteTask = async(function* (req,res){
    try {
        let task = req.task;
        yield task.remove();
        userTaskMapModel.removeUserTaskMapByCriteria({task:task._id});
        res.send(msg.genSuccessMsg('删除任务成功',task));
    } catch (error) {
        logger.error(req.url, '删除任务失败', error);
        res.send(msg.genFailedMsg('删除任务失败'));
    }
});

/**
 * 根据查询条件获取任务构建日志列表
 */
exports.getTaskBuildLogByCriteria = async(function*(req, res) {
    try {
        let query = {
            page: parseInt(req.query.page) - 1,
            limit: parseInt(req.query.limit),
            search: {}
        }
        if (req.query.taskId && req.query.taskIdtaskId !== '') {
            query.search.taskId = req.query.taskId;
        }
        if (req.query.appId && req.query.appId !== '') {
            query.search.appId = req.query.appId;
        }
        if (req.query.buildStatus && req.query.buildStatus!=''){
            query.search.buildStatus = req.query.buildStatus;
        }
        if (req.query.createdBy && req.query.createdBy !== '') {
            query.search.createdBy = req.query.createdBy;
        }
        if (req.query.createdAtStart && req.query.createdAtStart !== '') {
            query.search.createdAtStart = req.query.createdAtStart;
            query.search.createdAtEnd = req.query.createdAtEnd;
        }
        const list = yield taskBuildLogModel.getTaskBuildLogByCriteria(query);
        const count = yield taskBuildLogModel.count();
        res.send(msg.genSuccessMsg('读取版本删除日志列表成功', list, {
            count: count
        }));
    } catch (error) {
        logger.error(req.url, '读取版本删除日志列表失败', error);
        res.send(msg.genFailedMsg('读取版本删除日志列表失败'));
    }
});
/**
  *获取项目列表
*/
exports.getProject = async(function*(req,res){
    try{
        const taskId = req.query.taskId;
        const task = yield taskModel.getTaskById(taskId);
        const branchType = task.branchType;
        const app = task.app;
        const svnPath = getAppSvnPath(app,branchType);
        let targetPath = svnPath;
        let svnChildDirList = yield getSvnChildDirList(targetPath);
        let project = [];
        svnChildDirList.forEach(function(item){
            project.push(item.name);
        });
        res.send(msg.genSuccessMsg('获取项目目录成功',project));
    } catch(error){
        logger.error(req.url, '获取项目目录失败', error);
        res.send(msg.genFailedMsg('获取项目目录失败'));
    }
});
/**
  *获取tag版本
*/
exports.getTagVersion = async(function*(req,res){
    try{
        const taskId = req.query.taskId;
        const task = yield taskModel.getTaskById(taskId);
        const app = task.app;
        const projectName = req.query.projectName;
        const targetPath = app.tagPath+'/'+projectName;
        let svnChildDirList = yield getSvnChildDirList(targetPath);
        let tagVersion = [];
        svnChildDirList.forEach(function(item){
            tagVersion.push(item.name);
        });
        res.send(msg.genSuccessMsg('获取tag版本成功',tagVersion));
    }catch(error){
        logger.error(req.url, '获取tag版本失败', error);
        res.send(msg.genFailedMsg('获取tag版本失败'));
    }
});
/**
  *build流程
*/
exports.goBuild = async(function* (req,res){
    try{
     taskBuild.addPackQueueItem(req,res);    
    } catch(error){
        logger.error(req.url, '创建任务目录失败', error);
        res.send(msg.genFailedMsg('创建任务目录失败'));
    }
});
/**
 * 获取子目录路径
 * @param  {String} parentDirPath 父级目录路径
 * @return {String}               子目录路径
 */
function getSubDirPath(parentDirPath){
    const subDirs = fs.readdirSync(parentDirPath);
    if(subDirs.length>0){
        return `${parentDirPath}/${subDirs[0]}`;
    }else{
        throw new Error('无目标打包目录');
    }
}
/**
 * 上传到FTP
 * @param  {String} folder 要拷贝的文件夹名
 * @param  {String} originPath 要拷贝文件的原始目录
 * @param  {String} targetPath 要拷贝文件的目标目录
 */
function copyFiles(folder,originPath,targetPath){
    let fol = folder.split('|');
    for(let folderName of fol){
        let originPathNew = `${originPath}/${folderName}`;
        let targetPathNew = `${targetPath}/${folderName}`;
        if(fs.existsSync(originPathNew)){
            _.copy(originPathNew,targetPathNew);
        }
    }
}
/**
 * 上传到FTP
 * @param  {Object} ftp ftp对象
 * @param  {String} revision svn版本号
 * @param  {String} originStaticPath 原始目录
 * @param  {String} originAppPath ftp上的目标目录
 * @param  {Object} app app对象
 */
function uploadFtp(ftp,revision,originStaticPath,originAppPath,app){
    return new Promise(function(resolve,reject){
        let ftpConfig = {
            host: ftp.host,
            port: ftp.port,
            username: ftp.username,
            password: ftp.password
        };
        let remoteFilePath = ftp.path;
        sftp.connect(ftpConfig).then(() => {
            return sftp.mkdir(remoteFilePath, true);
        }).then((data) => {
            let targetStaticPath = `${remoteFilePath}/${app.name}_image_${revision}.tar.gz`;
            let targetAppPath = `${remoteFilePath}/${app.name}_${revision}.tar.gz`;
            sftp.put(originStaticPath,targetStaticPath);
            sftp.put(originAppPath,targetAppPath);
            resolve();
        }).catch((err) => {
            reject(err);
        });
    })
}
/**
 * 压缩文件夹
 * @param  {String} originPath 要压缩的原始目录
 * @return {String} targetPath 要压缩的目标目录
 * @return {String} text 压缩说明
 */
function packDirectory(originPath,targetPath,text){
    return new Promise(function(resolve,reject){
        let write = fs.createWriteStream;
        let pack = tarPack.pack;
        pack(originPath)
          .pipe(write(targetPath+'/'))
          .on('error', function (err) {
            reject(err);
          })
          .on('close', function () {
            console.log('pack '+text+' directory done');
            resolve();
          })
    });
}
/**
  * svn info 查看项目的svn信息
  * @param  {String} targetPath 要查看svn信息的项目路径
*/
function getSvnInfo(targetPath){
    return new Promise(function(resolve,reject){
        svnUltimate.commands.info('https://repo.ds.gome.com.cn:8443/svn/atg_poc/30_Coding/NewDevMode/trunk/gome-gfe/channel-web/demo', {}, function(err,info){
            if(err){
                reject(err);
            }else{
                console.log("svn info : get svn info complete");
                resolve(info);
            }
        });
    });
}
/**
  * 执行command命令
  * @param {String} path 要执行命令的文件夹路径
  * @param {String} buildCommand 要执行的命令
*/
function execCommand(path,buildCommand,req,res){
    return new Promise(function(resolve, reject) {
        exec(buildCommand,{cwd:path},function(error,stdout, stderr){
            if(error){
                reject(error);
            }else{
                if(path.indexOf('.svn')==-1){
                    let configFilePath = path+'/config.json';
                    let configContent = JSON.parse(fs.readFileSync(configFilePath));
                    resolve(configContent);
                }
            }
        });
    });
}
/**
  * 删除指定文件夹
  * @param {String} path 要删除的文件夹路径
*/
function delFolder(path){
    while(fs.existsSync(path)){
        try{
            _.del(path);
            fs.rmdirSync(path);
        }catch(error){}    
    }
}
/**
  * 根据任务的分支类型获取应用的svn路径
  * @param {Object} app 应用对象
  * @param {String} taskBranchType 任务分支类型
*/
function getAppSvnPath(app,taskBranchType){
    if(taskBranchType==="tag"){
        return app.tagPath;
    }
    if(taskBranchType==="master"){
        return app.masterPath;
    }
    if(taskBranchType==="branch"){
        return app.branchPath;
    }
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
/**
  * svn checkout 检出项目
  * @param  {String} originUrl 原始路径
  * @param  {String} targetPath 目标路径
  * @return {Object} Promise对象
*/
function checkoutSvnProject(originPath,targetPath){
    return new Promise(function(resolve, reject) {
        svnUltimate.commands.checkout( originPath, targetPath, function( err ) {
            if (err) {
                reject(err);
            } else {
                console.log("svn command : Checkout complete");
                resolve();
            }
        });
    });
}
/**
  * svn update 更新项目
  * @param  {String} targetPath 要更新的目标路径
  * @return {Object} Promise对象
*/
function updateSvnProject(targetPath){
    return new Promise(function(resolve, reject) {
        svnUltimate.commands.update( targetPath,{},
        function( err ) {
            if(err){
                reject(err);
            }else{
                console.log( "svn command : Update complete" );
                resolve();
            }
        });
    });
}
/**
  * svn info 查看项目的svn信息
  * @param  {String} targetPath 要查看svn信处的项目路径
  * @return {Object} Promise对象
*/
function getSvnInfo(targetPath){
    return new Promise(function(resolve,reject){
        svnUltimate.commands.info('https://repo.ds.gome.com.cn:8443/svn/atg_poc/30_Coding/NewDevMode/trunk/gome-gfe/channel-web/demo', {}, function(err,info){
            if(err){
                reject(err);
            }else{
                console.log("svn info : get svn info complete");
                resolve(info);
            }
        });
    });
}