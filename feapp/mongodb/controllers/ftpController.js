const mongoose = require('mongoose');
const ftpModel = mongoose.model('ftpModel');
const { wrap: async } = require('co');
const msg = require('../../utils/message');
const logger = require('log4js').getLogger();

exports.load = async(function*(req, res, next, id) {
    try {
        req.ftp = yield ftpModel.getFtpById(id);
        if (!req.ftp) return next(new Error('Use not found'));
    } catch (error) {
        logger.error(req.url, 'load', error);
        return next(err);
    }
    next()
});
/**
 * 创建ftp
 */
exports.createFtp = async(function*(req, res) {
    let ftp = new ftpModel(req.body);
    try {
        yield ftp.updateAndSave();
        res.send(msg.genSuccessMsg('创建FTP保存成功'));
    } catch (error) {
        logger.error(req.url, '创建FTP保存失败', error);
        res.send(msg.genFailedMsg('创建FTP保存失败'));
    }
});
/**
 * 更新ftp
 */
exports.updateFtp = async(function*(req, res) {
    try {
        let ftp = req.ftp;
        ftp = Object.assign(ftp, req.body);
        yield ftp.updateAndSave();
        res.send(msg.genSuccessMsg('更新FTP保存成功'));
    } catch (error) {
        logger.error(req.url, '更新FTP保存失败', error);
        res.send(msg.genFailedMsg('更新FTP保存失败'));
    }
});
/**
 * 校验FTP名是否已经存在
 */
exports.isExistFtpName = async(function*(req,res){
    try{
        let ftpName = req.query.ftpName;
        req.ftp = yield ftpModel.isExistFtpName(ftpName);
        req.ftp==null?res.send(msg.genSuccessMsg('此FTP名可用')):res.send(msg.genFailedMsg('FTP名已经存在'));
    }catch(error){
        logger.error(req.url,'FTP名校验失败');
        res.send(msg.genFailedMsg('FTP名校验失败'));
    }
});
/**
 * 通过查询条件获取用户列表
 */
exports.getFtpListByCriteria = async(function*(req, res) {
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
        const [count, list] = yield ftpModel.getFtpListByCriteria(query);
        res.send(msg.genSuccessMsg('读取ftp列表成功', list, {
            count: count
        }))
    } catch (error) {
        logger.error(req.url, '读取ftp列表失败', error);
        res.send(msg.genFailedMsg('读取ftp列表失败'))
    }
});
/**
 * 删除ftp
 */
exports.deleteFtp = async(function*(req, res) {
    try {
        let ftp = req.ftp;
        yield ftp.remove()
        res.send(msg.genSuccessMsg('删除ftp成功', ftp));
    } catch (error) {
        logger.error(req.url, '删除ftp失败', error);
        res.send(msg.genFailedMsg('删除ftp失败'));
    }
});
