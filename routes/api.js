const express = require('express');
const router = express.Router();
const authFilter = require('../utils/auth-filter');
const userController = require('../mongodb/controllers/userController');
const ftpController = require('../mongodb/controllers/ftpController');
const appController = require('../mongodb/controllers/appController');
const taskController = require('../mongodb/controllers/taskController');
const tagController = require('../mongodb/controllers/tagController');
const tagLogController = require('../mongodb/controllers/tagLogController');
const versionController = require('../mongodb/controllers/versionController');
const versionDeleteLogController = require('../mongodb/controllers/versionDeleteLogController');
const userTaskMapController = require('../mongodb/controllers/userTaskMapController');
const isAdmin = authFilter.isAdmin;

//用户管理(后台管理 -> 用户管理)
router.param('userId', userController.load);
router.get('/user/getUserListByCriteria', isAdmin,userController.getUserListByCriteria);
router.get('/user/getAllUserList', userController.getAllUserList);
router.post('/user/createUser', isAdmin, userController.createUser);
router.post('/user/updateUser/:userId', isAdmin, userController.updateUser);
router.delete('/user/deleteUser/:userId', isAdmin, userController.deleteUser);

//ftp路由(后台管理 -> FTP管理)
router.param('ftpId', ftpController.load);
router.get('/ftp/getFtpListByCriteria', isAdmin,ftpController.getFtpListByCriteria);
router.post('/ftp/createFtp', isAdmin, ftpController.createFtp);
router.post('/ftp/updateFtp/:ftpId', isAdmin, ftpController.updateFtp);
router.delete('/ftp/deleteFtp/:ftpId', isAdmin, ftpController.deleteFtp);
router.get('/ftp/isExistFtpName',  isAdmin, ftpController.isExistFtpName);

//app路由(后台管理 -> 应用管理)
router.param('appId', appController.load);
router.get('/app/getAppListByCriteria', isAdmin,appController.getAppListByCriteria);
router.post('/app/createApp', isAdmin, appController.createApp);
router.post('/app/updateApp/:appId', isAdmin, appController.updateApp);
router.delete('/app/deleteApp/:appId', isAdmin, appController.deleteApp);
router.get('/app/getAllAppList', appController.getAllAppList);
router.get('/app/isExistAppName',  isAdmin, appController.isExistAppName);

//task路由(后台管理 -> 任务管理)
router.param('taskId', taskController.load);
router.get('/task/getTaskListByCriteria', taskController.getTaskListByCriteria);
router.post('/task/createTask', isAdmin, taskController.createTask);
router.post('/task/updateTask/:taskId', isAdmin, taskController.updateTask);
router.delete('/task/deleteTask/:taskId', isAdmin, taskController.deleteTask);
router.get('/task/isExistTaskName',  isAdmin, taskController.isExistTaskName);
router.get('/task/getAllBranchTypeByAppId',taskController.getAllBranchTypeByAppId);

router.get('/task/getAllTaskList', taskController.getAllTaskList);
router.get('/task/getProject', taskController.getProject);
router.get('/task/getTaskListByAppId', taskController.getTaskListByAppId);
router.post('/task/goBuild', taskController.goBuild);
router.get('/task/getTagVersion',taskController.getTagVersion);

//任务构建日志
router.get('/taskBuildLog/getTaskBuildLogByCriteria', taskController.getTaskBuildLogByCriteria);

//Tag管理
router.get('/tag/getLatestTagNameByTagPath', tagController.getLatestTagNameByTagPath);
router.get('/tag/getTagListByCriteria', tagController.getTagListByCriteria);
router.get('/tag/getProjectListByAppPath', tagController.getProjectListByAppPath);
router.post('/tag/createTag', tagController.createTag);
router.post('/tag/copyTag', tagController.copyTag);
router.post('/tag/deleteTag', tagController.deleteTag);

//Tag日志管理
router.get('/tagLog/getTagLogListByCriteria', tagLogController.getTagLogListByCriteria);

//版本管理
router.get('/version/getVersionListByTaskId', versionController.getVersionListByTaskId);
router.post('/version/deleteVersion', versionController.deleteVersion);
router.get('/version/downloadVersion', versionController.downloadVersion);

//版本删除日志管理
router.get('/versionDeleteLog/getVersionDeleteLogListByCriteria', versionDeleteLogController.getVersionDeleteLogListByCriteria);

//中间表(通过任务ID获取用户列表)
router.get('/usertaskmap/getUserListByTaskId', userTaskMapController.getUserListByTaskId);
router.get('/usertaskmap/getTaskListByUserId', userTaskMapController.getTaskListByUserId)
module.exports = router;
