const mongoose = require('mongoose');
const tagLogModel = mongoose.model('tagLogModel');
const logger = require('log4js').getLogger();
const { wrap: async } = require('co');
const msg = require('../../utils/message');

/**
 * 根据查询条件获取Tag日志列表
 */
exports.getTagLogListByCriteria = async(function*(req, res) {
    try {
        let query = {
            page: parseInt(req.query.page) - 1,
            limit: parseInt(req.query.limit),
            search: {}
        }
        if (req.query.projectName && req.query.projectName !== '') {
            query.search.projectName = req.query.projectName;
        }
        if (req.query.tagName && req.query.tagName !== '') {
            query.search.tagName = req.query.tagName;
        }
        if (req.query.operateType && req.query.operateType !== '') {
            query.search.operateType = req.query.operateType;
        }
        if (req.query.creatorName && req.query.creatorName !== '') {
            query.search.creatorName = req.query.creatorName;
        }
        if (req.query.createdAtStart && req.query.createdAtStart !== '') {
            query.search.createdAtStart = req.query.createdAtStart;
            query.search.createdAtEnd = req.query.createdAtEnd;
        }
        const [count, list] = yield tagLogModel.getTagLogListByCriteria(query);
        res.send(msg.genSuccessMsg('读取Tag日志列表成功', list, {
            count: count
        }));
    } catch (error) {
        logger.error(req.url, '读取Tag日志列表失败！', error);
        res.send(msg.genFailedMsg('读取Tag日志列表失败'));
    }
});
