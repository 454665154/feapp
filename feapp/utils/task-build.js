const fs = require('fs');
const exec = require('child_process').exec;
const svnUltimate = require('node-svn-ultimate');
const tarPack = require('tar-pack');
const Client = require('ssh2-sftp-client');
const sftp = new Client();
const logger = require('log4js').getLogger();
const { wrap: async } = require('co');
const Jenkins = require('jenkins');
const mongoose = require('mongoose');
const taskModel = mongoose.model('taskModel');
const taskBuildLogModel = mongoose.model('taskBuildLogModel');
const msg = require('./message');
const util = require('./util');
const systemConfig = util.getSystemConfig();
const systemParam = util.getSystemParam();
const _ = require('./fis-util');


module.exports = TaskBuild = {
    //打包队列Map
    packQueueMap: {},
    //合包队列Map
    combineQueueMap: {},
    //发包队列Map
    publishQueueMap: {},
    //合包定时器
    combineTimer: {},
    //发包定时器
    publishTimer:{},
    //添加打包队列元素
    addPackQueueItem: function(req, res) {
        const taskId = req.body.taskId;

        if (!TaskBuild.packQueueMap[taskId]) {
            TaskBuild.packQueueMap[taskId] = [];
        }
        TaskBuild.packQueueMap[taskId].push({ req: req, res: res });
        if (TaskBuild.packQueueMap[taskId].length === 1) {
            TaskBuild.packApp(req, res);
        }
    },
    //打包逻辑处理
	packApp:async(function*(req, res) {
        const taskId = req.body.taskId; //任务id
        const projectName = req.body.projectName; //项目名字
        const tagVersion = req.body.tagVersion; //tag版本
        const backEndVersion = req.body.backEndVersion; //后端版本号
        const task = yield taskModel.getTaskById(taskId); //task对象
	    const ftp = task.ftp; //ftp对象
        const app = task.app; //app对象
        req.body.appId = app._id;
        const isCombine = task.isCombinePackage; //是否合包
        const isPublish = task.isPublish; //是否发包
        const BUILD_PROJECT_ROOT_DIR = systemConfig.buildProjectRootDir; //基础根目录
        const TEMP_STATIC_DIR_NAME = systemConfig.tempStaticDirName; //静态目录名
        const TEMP_APP_DIR_NAME = systemConfig.tempAppDirName; //应用目录名
        const TEMP_APP_SOURCE_DIR_NAME = systemConfig.tempAppSourceDirName; //应用源码目录名
        const isPackageAll = (projectName === 'all project'); //是否打全量
        const TASK_DIR_PATH = `${BUILD_PROJECT_ROOT_DIR}/${task.name}`; //任务目录
        const TASK_DIR_SOURCE_PATH = `${TASK_DIR_PATH}/${TEMP_APP_SOURCE_DIR_NAME}`; //任务下源码目录
        const TEMP_STATIC_PATH = `${TASK_DIR_PATH}/${TEMP_STATIC_DIR_NAME}`; //静态目录
        const TEMP_APP_PATH = `${TASK_DIR_PATH}/${TEMP_APP_DIR_NAME}`; //应用目录
        const taskBranchType = task.branchType;//任务的分支类型
        const isTag = (taskBranchType === 'tag'); //是否打tag包
        const buildCommand = task.command; //输出build时的命令行
        //删除构建目录下内容
        delFolder(TASK_DIR_PATH);
        //创建任务目录
        _.mkdir(TASK_DIR_SOURCE_PATH);
        //创建static目录
        // _.mkdir(TEMP_STATIC_PATH);
        //创建app目录
        // _.mkdir(TEMP_APP_PATH);
        //获取应用的SVN路径
        const appSvnPath = getAppSvnPath(app,taskBranchType);
        //全量包，checkout应用目录
        if(isPackageAll){
            if(isTag){
                //获取所有的项目名称,[],遍历[]找最大的版本
                let allProject = [];
                let svnChildDirList = yield getSvnChildDirList(appSvnPath);
                svnChildDirList.forEach(function(item){
                    allProject.push(item.name);
                });                
                for (let item of allProject) {
                    let versionList = [];
                    let svnTagChildDirList = yield getSvnChildDirList(`${appSvnPath}/${item}`);
                    svnTagChildDirList.forEach(function(item){
                        versionList.push(item.name);
                    });
                    let version = util.sortByVersionNumber(versionList,null,true);
                    version = version.length>0 ? version[0] : '';
                    yield checkoutSvnProject(`${appSvnPath}/${item}/${version}`,`${TASK_DIR_SOURCE_PATH}/${item}`);
                }
            }else{
                yield checkoutSvnProject(appSvnPath,TASK_DIR_SOURCE_PATH);
            }
        }
        //非全量包，checkout项目目录
        else{
            //checkout项目目录 tagVersion:tag版本号
            if(isTag){
                yield checkoutSvnProject(`${appSvnPath}/${projectName}/${tagVersion}`,`${TASK_DIR_SOURCE_PATH}/${projectName}`);
            }
            //checkout项目目录
            else{ 
                yield checkoutSvnProject(`${appSvnPath}/${projectName}`,`${TASK_DIR_SOURCE_PATH}/${projectName}`);
            }
        }
        //遍历任务目录中各项目，提取build中内容存放至static或app目录中
        let projectsDefault = fs.readdirSync(TASK_DIR_SOURCE_PATH);
        //过滤.svn文件夹
        let projects = [];
        projectsDefault.forEach(function(item){
            if(item!=='.svn'){
                projects.push(item);
            }
        });
        var execCommandPromise = [];
        for (let item of projects) {
            execCommandPromise.push(execCommand(`${TASK_DIR_SOURCE_PATH}/${item}`,buildCommand,req,res));
        }
        yield execCommandPromise;
        for (let item of projects) {
            // let configContent = yield execCommand(`${TASK_DIR_SOURCE_PATH}/${item}`,buildCommand,req,res);
            let configContent = JSON.parse(fs.readFileSync(`${TASK_DIR_SOURCE_PATH}/${item}/config.json`));
            console.info(configContent);
            let packageDir = configContent.packageDir;
            let staticPath = configContent.staticPath;
            let staticFolder = configContent.staticFolder;
            let projectApp = configContent.projectApp;
            let appendFiles = configContent.appAppend;
            let appPath = configContent.appPath;
            let appFolder = configContent.appFolder;
            // let tempStaticDir = `${TEMP_STATIC_PATH}/${projectApp}/${staticPath}/${item}`;
            let tempStaticDir = `${TEMP_STATIC_PATH}/${projectApp}/${staticPath}`;
            let tempAppDir = `${TEMP_APP_PATH}/${appPath}/${item}`;

            _.mkdir(tempStaticDir); //创建TEMP_STATIC_PATH那层目录
            _.mkdir(tempAppDir); //创建TEMP_APP_PATH那层目录

            //拷贝config.json中配置的文件
            copyFiles(staticFolder,`${TASK_DIR_SOURCE_PATH}/${item}/${packageDir}`,tempStaticDir);
            copyFiles(appFolder,`${TASK_DIR_SOURCE_PATH}/${item}/${packageDir}`,tempAppDir);
            copyFiles(appendFiles,`${TASK_DIR_SOURCE_PATH}/${item}`,tempAppDir);
        }
        //获取app的SvnRevision;
        let svnInfo = yield getSvnInfo(appSvnPath);
        let revision = svnInfo.entry.$.revision;
        
        //生成压缩包tar.gz文件
        const originStaticPackPath = getSubDirPath(TEMP_STATIC_PATH);
        const targetStaticPackPath = `${TEMP_STATIC_PATH}.tar.gz`;
        const originAppPackPath = getSubDirPath(TEMP_APP_PATH);
        const targetAppPackPath = `${TEMP_APP_PATH}.tar.gz`;
        yield packDirectory(originStaticPackPath,targetStaticPackPath,TEMP_STATIC_DIR_NAME);
        yield packDirectory(originAppPackPath,targetAppPackPath,TEMP_APP_DIR_NAME);
        
        //上传ftp
        yield uploadFtp(ftp,revision,targetStaticPackPath,targetAppPackPath,app);
        
        if(!isCombine && !isPublish){
            let buildStatus = systemParam.buildStatus.constant.STEP1;
            yield TaskBuild.putBuildLogInDB(req,buildStatus);
            res.send(msg.genSuccessMsg('打包成功'));
        }
        //判断是否合包
        if(isCombine){
            TaskBuild.addCombineQueueItem(req,res,revision,task);
        }
        if(isPublish && !isCombine){
            TaskBuild.addPublishQueueItem(req,res,revision,task);
        }

	    TaskBuild.packQueueMap[taskId].shift();//移除打包完的任务
	    //如果队列中还有其它任务，则继续打包
	    if(TaskBuild.packQueueMap[taskId].length > 0){
	        const frontQueueItem = TaskBuild.packQueueMap[taskId].slice(0,1);
	        TaskBuild.packApp(frontQueueItem.req,frontQueueItem.res);   
	    }
        
	}),
    //添加合包队列元素
    addCombineQueueItem: function(req, res, revision,task) {
        const combineName = systemConfig.combineJenkinsName;
        if(!TaskBuild.combineQueueMap[combineName]){
            TaskBuild.combineQueueMap[combineName] = [];
        }
        TaskBuild.combineQueueMap[combineName].push({ req: req, res: res,revision:revision,task:task });
        if (TaskBuild.combineQueueMap[combineName].length === 1) {
            TaskBuild.combinePackager(req, res, revision,task);
        }
    },
    //合包逻辑处理
    combinePackager: async(function*(req, res, revision,task) {
        const backEndVersion = req.body.backEndVersion; //后端版本号
        const app = task.app;
        //连接jenkins
        const jenkins = Jenkins(`http:\/\/${task.jenkinsUsername}:${task.jenkinsPassword}@${task.jenkinsPath}`);
        //获取jenkins的job名
        const jenkinsName = systemConfig.combineJenkinsName;
        //获取任务中jenkins的传参项,初始化合包jenkins对象
        let combineJenkins = {};
        combineJenkins.name = jenkinsName;
        combineJenkins.parameters = {};
        combineJenkins.parameters[task.jobFirstParamKey] = backEndVersion;
        combineJenkins.parameters[task.jobSecondParamKey] = revision;
        combineJenkins.parameters.SERVER_NAME = app.name;
        // combineJenkins.parameters[task.jobFirstParamKey] = '1.0.173.3';
        // combineJenkins.parameters[task.jobSecondParamKey] = '517266';
        // combineJenkins.parameters.SERVER_NAME = 'channel-web';
        //调用jenkins合包
        yield jenkinsJobBuild(jenkins,combineJenkins);
        //拿到jenkins的job序号
        const jobObj = yield jenkinsJobGet(jenkins,jenkinsName);
        const jobNumber = jobObj.nextBuildNumber;

        TaskBuild.combineTimer[jenkinsName] = setTimeout(function(){
            TaskBuild.combineJenkinsSchedule(req,res,jenkins,jenkinsName,jobNumber,task,revision);
        },3000);

    }),
    combineJenkinsSchedule: async(function*(req, res,jenkins,jenkinsName,jobNumber,task,revision) {
        //调用jenkins的log方法
        try{
            yield jenkinsBuildLog(jenkins,jenkinsName,jobNumber);
            const jenkinsBuildingData = yield jenkinsJobGet(jenkins,jenkinsName);
            console.log(jenkinsBuildingData.color);
            var color = jenkinsBuildingData.color;
            if (color === 'blue' || color === 'red' || color==='aborted'){
                if (TaskBuild.combineTimer[jenkinsName]) {
                    console.log('合包成功---');
                    clearTimeout(TaskBuild.combineTimer[jenkinsName]);
                }

                TaskBuild.combineQueueMap[jenkinsName].shift();//移除合包完的任务
                //如果队列中还有其它任务，则继续合包
                if(TaskBuild.combineQueueMap[jenkinsName].length > 0){
                    const frontQueueItem = TaskBuild.combineQueueMap[jenkinsName].slice(0,1);
                    TaskBuild.combinePackager(frontQueueItem.req,frontQueueItem.res,frontQueueItem.revision,frontQueueItem.task);   
                }

                if(task.isPublish){
                    if(color=='blue'){
                        TaskBuild.addPublishQueueItem(req,res,revision,task);
                    }
                }else{
                    if(color=='blue'){
                        let buildStatus = systemParam.buildStatus.constant.STEP2;
                        yield TaskBuild.putBuildLogInDB(req,buildStatus);
                        res.send(msg.genSuccessMsg('合包成功'));
                    }
                }
                if(color=='red'){
                    let buildStatus = systemParam.buildStatus.constant.STEP2;
                    yield TaskBuild.putBuildLogInDB(req,buildStatus);
                    res.send(msg.genSuccessMsg('合包失败'));
                }
                if(color=='aborted'){
                    let buildStatus = systemParam.buildStatus.constant.STEP2;
                    yield TaskBuild.putBuildLogInDB(req,buildStatus);
                    res.send(msg.genSuccessMsg('合包任务被终止'));
                }
                
            }else{
                combineTimer(req,res,jenkins,jenkinsName,jobNumber,task,revision);
            }
        }catch(err){
            combineTimer(req,res,jenkins,jenkinsName,jobNumber,task,revision);
        } 
    }),

    //添加发包队列元素
    addPublishQueueItem: function(req, res, revision, task) {
        const jenkinsName = task.jenkinsName;
        if(!TaskBuild.publishQueueMap[jenkinsName]){
            TaskBuild.publishQueueMap[jenkinsName] = [];
        }
        TaskBuild.publishQueueMap[jenkinsName].push({ req: req, res: res,revision:revision,task:task });
        if (TaskBuild.publishQueueMap[jenkinsName].length === 1) {
            TaskBuild.publishPackager(req, res,revision,task );
        }
    },
    //发包逻辑处理
    publishPackager: async(function*(req, res, revision, task) {
        const app = task.app;
        //连接jenkins
        const jenkins = Jenkins(`http:\/\/${task.jenkinsUsername}:${task.jenkinsPassword}@${task.jenkinsPath}`);
        //获取jenkins的job名
        const jenkinsName = task.jenkinsName;
        const backEndVersion = req.body.backEndVersion; //后端版本号
        //获取任务中jenkins的传参项,初始化合包jenkins对象
        let publishJenkins = {};
        publishJenkins.name = jenkinsName;
        publishJenkins.parameters = {};
        publishJenkins.parameters.NUM = backEndVersion+'.'+revision; //五位版本号
        publishJenkins.parameters.SERVER_NAME = app.name; //服务器名
        // publishJenkins.parameters.NUM = '1.0.173.3.517163';
        // publishJenkins.parameters.SERVER = 'channel-web';
        //调用jenkins发包
        yield jenkinsJobBuild(jenkins,publishJenkins);
        //拿到jenkins的job序号
        const jobObj = yield jenkinsJobGet(jenkins,jenkinsName);
        const jobNumber = jobObj.nextBuildNumber;
        TaskBuild.publishTimer[jenkinsName] = setTimeout(function(){
            TaskBuild.publishJenkinsSchedule(req,res,jenkins,jenkinsName,jobNumber);
        },3000);
    }),
    publishJenkinsSchedule:async(function*(req, res,jenkins,jenkinsName,jobNumber) {
        //调用jenkins的log方法
        try{
            yield jenkinsBuildLog(jenkins,jenkinsName,jobNumber);
            const jenkinsBuildingData = yield jenkinsJobGet(jenkins,jenkinsName);
            console.log(jenkinsBuildingData.color);
            var color = jenkinsBuildingData.color;
            if (color === 'blue' || color === 'red' || color==='aborted'){
                if (TaskBuild.publishTimer[jenkinsName]) {
                    console.log('发包完毕');
                    clearTimeout(TaskBuild.publishTimer[jenkinsName]);
                }
                TaskBuild.publishQueueMap[jenkinsName].shift();//移除发包完的任务
                //如果队列中还有其它任务，则继续发包
                if(TaskBuild.publishQueueMap[jenkinsName].length > 0){
                    const frontQueueItem = TaskBuild.publishQueueMap[jenkinsName].slice(0,1);
                    TaskBuild.publishPackager(frontQueueItem.req,frontQueueItem.res,frontQueueItem.revision,frontQueueItem.task);   
                }
                
                if(color=='blue'){
                    let buildStatus = systemParam.buildStatus.constant.SUCCESS;
                    yield TaskBuild.putBuildLogInDB(req,buildStatus);
                    res.send(msg.genSuccessMsg('构建成功！'));
                }
                
                if(color=='red'){
                    let buildStatus = systemParam.buildStatus.constant.STEP3;
                    console.log(systemParam.buildStatus);
                    console.log('2222222222222222222222222');
                    yield TaskBuild.putBuildLogInDB(req,buildStatus);
                    console.log('3333333333333333333333');
                    res.send(msg.genSuccessMsg('发包失败！'));
                }
                if(color=='aborted'){
                    let buildStatus = systemParam.buildStatus.constant.STEP3;
                    yield TaskBuild.putBuildLogInDB(req,buildStatus);
                    res.send(msg.genSuccessMsg('发包任务被终止'));
                }
            }else{
                publishTimer(req,res,jenkins,jenkinsName,jobNumber);
            }
        }catch(err){
            publishTimer(req,res,jenkins,jenkinsName,jobNumber);
        }
    }),
    putBuildLogInDB:async(function*(req,buildStatus){
        req.body.createdBy = req.session.user.username;
        req.body.buildStatus = buildStatus;
        req.body.task = req.body.taskId;
        req.body.app = req.body.appId;
        console.log(req.body);
        console.log('*******************************');
        let taskBuildLog = new taskBuildLogModel(req.body);
        try{
            yield taskBuildLog.updateAndSave();
            console.info('任务构建日志保存成功');
        } catch(error){
            logger.error(req.url, '任务构建日志保存失败', error);
            console.info('任务构建日志保存失败');
        }
    })
};

/**
 * 循环调用jenkins的job,判断color状态
 * @param  {Object} req         request对象
 * @param  {Object} res         response对象
 * @param  {Object} jenkins     jenkins对象
 * @param  {String} jenkinsName jenkins的job名
 * @param  {Number} jobNumber   jenkins的job的number
 */
function publishTimer(req,res,jenkins,jenkinsName,jobNumber){
    if (TaskBuild.publishTimer[jenkinsName]) {
        clearTimeout(TaskBuild.publishTimer[jenkinsName]);
    }
    TaskBuild.publishTimer[jenkinsName] = setTimeout(function(){
        TaskBuild.publishJenkinsSchedule(req,res,jenkins,jenkinsName,jobNumber);
    },3000);
}

/**
 * 循环调用jenkins的job,判断color状态
 * @param  {Object} req         request对象
 * @param  {Object} res         response对象
 * @param  {Object} jenkins     jenkins对象
 * @param  {String} jenkinsName jenkins的job名
 * @param  {Number} jobNumber   jenkins的job的number
 */
function combineTimer(req,res,jenkins,jenkinsName,jobNumber,task,revision){
    if (TaskBuild.combineTimer[jenkinsName]) {
        clearTimeout(TaskBuild.combineTimer[jenkinsName]);
    }
    TaskBuild.combineTimer[jenkinsName] = setTimeout(function(){
        TaskBuild.combineJenkinsSchedule(req,res,jenkins,jenkinsName,jobNumber,task,revision);
    },3000);
}

/**
 * jenkins的get
 * @param  {Object} jenkins     jenkins对角
 * @param  {Object} jenkinsObj  jenkins的合包参数对象
 */
function jenkinsJobBuild(jenkins,jenkinsObj){
    return new Promise(function(resolve,reject){
        jenkins.job.build(jenkinsObj,function(err) {
            if (err) {
                reject(err);
            }else{
                resolve();
            }
        });
    });
}
/**
 * jenkins的get
 * @param  {Object} jenkins     jenkins对角
 * @param  {String} jobName     jenkins的job名
 */
function jenkinsJobGet(jenkins,jobName){
    return new Promise(function(resolve,reject){
        jenkins.job.get(jobName, function(err, data) {
            if (err) {
                reject(err);
            }else{
                resolve(data);
            }
        });
    });
}
/**
 * jenkins的log
 * @param  {Object} jenkins     jenkins对角
 * @param  {String} jobName     jenkins的job名
 * @param  {Number} jobNumber   jenkins的job的number
 */
function jenkinsBuildLog(jenkins,jobName,jobNumber){
    return new Promise(function(resolve,reject){
        jenkins.build.log(jobName, jobNumber, function(err, data) {
            if (err) {
                console.log(err);
                reject(err);
            }else{
                resolve(data);
            }
        });
    });
}

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
 * 拷贝文件夹
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
                    // let configFilePath = path+'/config.json';
                    // let configContent = JSON.parse(fs.readFileSync(configFilePath));
                    // resolve(configContent);
                    resolve();
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