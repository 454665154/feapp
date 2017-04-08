const util = module.exports;
/**
 * 根据版本号进行数组排序
 * @param  {Array} array        待排序数组
 * @param  {String} versionFiled 数组中的的版本号字段，有字段则为字段key值，没有字段则为null
 * @param  {Boolean} isInvertedOrder   是否为倒序排序，true:倒序，false正序
 * @return {Array} 排序后的新数组
 * @example
 * sortByVersionNumber(['1.0.9','1.0.2','1.0.7'],null)
 *      =>['1.0.9','1.0.7','1.0.2']
 * sortByVersionNumber([{name:'1.0.9'},{name:'1.0.2'},{name:'1.0.7'}],'name')
 *      =>[{name:'1.0.9'},{name:'1.0.7'},{name:'1.0.2'}]
 */
util.sortByVersionNumber = function(array, versionField, isInvertedOrder) {
    return array.sort(function(preItem, curItem) {
        const preItemVersion = versionField ? preItem[versionField] : preItem;
        const curItemVersion = versionField ? curItem[versionField] : curItem;
        const preItemArray = preItemVersion.replace(/[^\d\.]*/g, '').split('.');
        const curItemArray = curItemVersion.replace(/[^\d\.]*/g, '').split('.');
        var flag = isInvertedOrder ? 1 : -1;
        for (var i = 0; i < preItemArray.length; i++) {
            const n1 = parseInt(preItemArray[i], 10);
            const n2 = parseInt(curItemArray[i], 10);
            if (n1 > n2) {
                return -flag;
            } else if (n1 < n2) {
                return flag;
            }
        }
        return 0;
    });
}

/**
 * 获取相应环境系统配置
 * @return {Object} 相应环境系统配置
 */
util.getSystemConfig = function() {
    const systemConfigBase = require('./config/system-config-base');
    const systemConfigDev = require('./config/system-config-dev');
    const systemConfigPrd = require('./config/system-config-prd');
    const devConfig = Object.assign(systemConfigDev, systemConfigBase);
    const prdConfig = Object.assign(systemConfigPrd, systemConfigBase);
    const systemConfig = process.env.NODE_ENV === 'dev' ? devConfig : prdConfig;
    return systemConfig;
}

/**
 * 获取系统参数
 * @return {Object} 系统参数
 */
util.getSystemParam = function() {
    return require('./config/system-param');
};

/**
 * 判断是否是管理员
 * @param  {Object}  user 用户对象
 * @return {Boolean}      是否为管理员
 */
util.isAdmin = function(user) {
    if (user.role === util.getSystemParam().userRole.constant.ADMIN) {
        return true;
    }
    return false;
};
