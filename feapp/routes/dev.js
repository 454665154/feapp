const express = require('express');
const router = express.Router();
const { wrap: async } = require('co');
const mongoose = require('mongoose');
const userModel = mongoose.model('userModel');
const sessionModel = mongoose.model('sessionModel');
const msg = require('../utils/message');
const util = require('../utils/util');
const systemParam = util.getSystemParam();

//退出登录(开发环境)
router.get('/dev/logout', function(req, res) {
    delete req.session.user;
    res.redirect('/dev/login');
});

//跳转至用户登录页面(开发环境)
router.get('/dev/login', function(req, res) {
    res.render('../login', {});
});

//用户登录逻辑处理(开发环境)
router.post('/dev/login', async(function*(req, res) {
    const username = req.body.username;
    try {
        const user = yield userModel.getUserByUsername(username);
        if (!user) {
            res.send(msg.genFailedMsg('用户名不存在'));
        } else {
            req.session.user = user;
            res.send(msg.genSuccessMsg('用户名正确', user));
        }
    } catch (error) {
        res.send(msg.genFailedMsg('系统繁忙'));
    }
}));

//判断是否登录，已登录：继续渲染页面，未登录：跳转到登录页面(开发环境)
router.get('/dev/index', function(req, res) {
    if (!req.session || !req.session.user) {
        res.redirect('/dev/login');
    } else {
        const userInfo = req.session.user;
        const nodeEnv = process.env.NODE_ENV;
        userInfo.roleName = systemParam.userRole.param[userInfo.role];
        res.render('../index', { userInfo: userInfo, nodeEnv: nodeEnv });
    }
});

module.exports = router;
