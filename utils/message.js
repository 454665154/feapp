/**
 * 生成消息对象
 * @param  {Boolean} success 成功消息or失败消息
 * @param  {String} msg     消息内容
 * @param  {Array}  data    附加数据
 * @param  {Object} meta    附加元数据
 * @return {Object}         消息对象
 */
exports.genMsg = (success, msg, data = [], meta = {}) => {
    return {
        success: success,
        msg: msg,
        data: data,
        meta: meta
    }
}

/**
 * 生成成功消息对象
 * @param  {String} msg     消息内容
 * @param  {Array}  data    附加数据
 * @param  {Object} meta    附加元数据
 * @return {Object}         消息对象
 */
exports.genSuccessMsg = (msg, data, meta) => {
    return this.genMsg(true, msg, data, meta)
}

/**
 * 生成失败消息对象
 * @param  {String} msg     消息内容
 * @param  {Array}  data    附加数据
 * @param  {Object} meta    附加元数据
 * @return {Object}         消息对象
 */
exports.genFailedMsg = (msg, data, meta) => {
    return this.genMsg(false, msg, data, meta)
}
