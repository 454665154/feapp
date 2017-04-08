const express = require('express');
const router = express.Router();
const { wrap: async } = require('co');
const mongoose = require('mongoose');
const sessionModel = mongoose.model('sessionModel');
const msg = require('../utils/message');
const authFilter = require('../utils/auth-filter');
const util = require('../utils/util');
const isLogin = authFilter.isLogin;
const systemParam = util.getSystemParam();
const systemConfig = util.getSystemConfig();

//跳转到首页(生产环境)
router.get('/', isLogin, function(req, res, next) {
    const userInfo = req.session.user;
    const nodeEnv = process.env.NODE_ENV;
    userInfo.roleName = systemParam.userRole.param[userInfo.role];
    res.render('index', { userInfo: userInfo, nodeEnv: nodeEnv });
});

//退出登录(生产环境)
router.get('/prd/logout', isLogin, function(req, res) {
    delete req.session.user;
    delete req.session.token;
    const logoutURL = systemConfig.sso.logoutURL;
    const redirectURL = `${req.protocol}://${req.headers.host}/prd/ssoProxyLogin`;
    const appKey = systemConfig.sso.appKey;
    const logoutFullURL = `${logoutURL}?redirectUrl=${redirectURL}&appKey=${appKey}`;
    res.redirect(logoutFullURL);
});

//sso登录代理登录页面，不传递sign参数
router.get('/prd/ssoProxyLogin', isLogin, function(req, res) {
    const indexURL = `${req.protocol}://${req.headers.host}/`;
    res.redirect(indexURL);
});

//重定向到登录页面(生产环境)
router.get('/prd/login', function(req, res) {
    const loginURL = systemConfig.sso.loginURL;
    const redirectURL = `${req.protocol}://${req.headers.host}/`;
    const appKey = systemConfig.sso.appKey;
    const loginFullURL = `${loginURL}?redirectUrl=${redirectURL}&appKey=${appKey}`;
    res.redirect(loginFullURL);
});

//清除应用接口(生产环境)
router.post('/api/clearAppSession', async(function*(req, res) {
    const token = req.body.token;
    let result = { code: 1, msg: '删除失败', data: {} };
    if (!token) {
        result.msg = 'token不能为空';
        res.send(result);
    } else {
        try {
            const sessionList = sessionModel.getAllSessionList();
            const waitDeleteSessionIds = [];
            sessionList.forEach(function(item) {
                const session = JSON.parse(item.session);
                if (session.token && session.token === token) {
                    waitDeleteSessionIds.push(session._id);
                }
            });
            if (waitDeleteSessionIds.length > 0) {
                yield sessionModel.removeSessionByIds(waitDeleteSessionIds);
            }
            result.code = 0;
            result.msg = '删除成功';
            res.send(result);
        } catch (error) {
            res.send(result);
        }
    }
}));

module.exports = router;
