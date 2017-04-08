const mongoose = require('mongoose');
const userModel = mongoose.model('userModel');
const { wrap: async } = require('co');
const logger = require('log4js').getLogger();
const rp = require('request-promise');
const msg = require('./message');
const util = require('./util');
const systemConfig = util.getSystemConfig();
const systemParam = util.getSystemParam();

/**
 * 判断用户是否登录的中间件。
 * 未登录：(1)访问接口路由，返回失败信息(2)访问非接口路由，重定向到登录页面
 * 已登录：继续后续流程
 * @param {Object} req  Request对象
 * @param {Object} res  Response对象
 * @param {Function} next 继续流程的方法
 */
exports.isLogin = async(function*(req, res, next) {
    if (process.env.NODE_ENV !== 'dev') {
        const appKey = systemConfig.sso.appKey;
        const loginURL = systemConfig.sso.loginURL;
        const redirectURL = `${req.protocol}://${req.headers.host}/prd/ssoProxyLogin`;
        const loginFullURL = `${loginURL}?redirectUrl=${redirectURL}&appKey=${appKey}`;
        const verifyTokenURL = systemConfig.sso.verifyTokenURL;
        //先获取参数中的token，再获取session中的token
        //token先后顺序获取原因：防止feapp和其他应用同时打开，当其它应用退出后，库中的session清理了，但是应用中的session并未清理问题
        const token = req.query.sign || req.session.token;
        //token不存在，直接重定向到登录页面
        if (!token) {
            if (req.baseUrl === '/api') {
                res.status(401).send(msg.genFailedMsg('用户未登录'));
            } else {
                res.redirect(loginFullURL);
            }
        } else {
            //token存在时，校验token有效性
            const options = {
                method: 'POST',
                uri: verifyTokenURL,
                headers: { appKey: appKey },
                body: { token: token },
                json: true
            };
            try {
                const result = yield rp(options);
                //token有效时，查看user是否已入库，如果未入库，则入库，如果已入库，则继续
                if (result && result.code === 0) {
                    const userInfo = result.data;
                    let user = yield userModel.getUserByUsername(userInfo.userName);
                    if (!user) {
                        user = new userModel();
                        user.username = userInfo.userName;
                        user.role = systemParam.userRole.constant.COMMON_USER;
                        yield user.updateAndSave();
                    }
                    //设置token并继续后续流程
                    req.session.token = token;
                    req.session.user = user;
                    next();
                } else {
                    if (req.baseUrl === '/api') {
                        res.status(401).send(msg.genFailedMsg('token不存在'));
                    } else {
                        res.redirect(loginFullURL);
                    }
                }
            } catch (error) {
                logger.error(req.url, 'token校验异常', error);
                if (req.baseUrl === '/api') {
                    res.status(401).send(msg.genFailedMsg('token校验异常'));
                } else {
                    res.redirect(loginFullURL);
                }
            }
        }
    } else {
        if (!req.session.user) {
            if (req.baseUrl === '/api') {
                res.status(401).send(msg.genFailedMsg('用户未登录'));
            } else {
                res.redirect('/dev/login');
            }
        } else {
            next();
        }
    }
});


/**
 * 判断是否为管理员的中间件，用于管理员接口的增删改等操作
 * 管理员：继续流程
 * 非管理员：通知用户无权访问
 * @param {Object} req  Request对象
 * @param {Object} res  Response对象
 * @param {Function} next 继续流程的方法
 */
exports.isAdmin = async(function(req, res, next) {
    try {
        const user = req.session.user;
        if (user.role !== systemParam.userRole.constant.ADMIN) {
            res.status(401).send(msg.genFailedMsg('权限不足，此接口仅对管理员开发'));
        }
        next();
    } catch (error) {
        logger.error(req.url, '接口鉴权异常', error);
        res.status(401).send(msg.genFailedMsg('接口鉴权异常'));
    }
});
