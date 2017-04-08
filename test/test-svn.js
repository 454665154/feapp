const svnUltimate = require('node-svn-ultimate');

/**
 * 获取Svn目录信息
 */
function getSvnDirList() {
    const listUrl = "https://repo.ds.gome.com.cn:8443/svn/atg_poc/30_Coding/NewDevMode/tags/gome-gfe/channel-web/public";

    svnUltimate.commands.list(listUrl, {}, function(err, data) {
        console.log(data.list.entry);
    });
}
// getSvnDirList();

/**
 * 拷贝Svn项目
 */
function copySvnProject() {
    const copyOriginUrl = "https://repo.ds.gome.com.cn:8443/svn/atg_poc/30_Coding/NewDevMode/tags/gome-gfe/channel-web/public/1.0.0";
    const copyDistUrl = "https://repo.ds.gome.com.cn:8443/svn/atg_poc/30_Coding/NewDevMode/trunk/gome-gfe/channel-web/demo/1.0.0";

    svnUltimate.commands.copy(copyOriginUrl, copyDistUrl, { params: ['-m "113099:gfe auto tag:image"'] }, function(err, data) {
        console.log(data);
    });
}
// copySvnProject();


/**
 * 删除Svn项目
 */
function deleteSvnProject() {
    const deleteUrl = "https://repo.ds.gome.com.cn:8443/svn/atg_poc/30_Coding/NewDevMode/trunk/gome-gfe/channel-web/demo/1.0.0";

    svnUltimate.commands.del(deleteUrl, { params: ['-m "113099:gfe auto tag:image"'] }, function(err, data) {
        console.log(data);
    });
}

// deleteSvnProject();

/**
 * 根据版本号排序数组
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
function sortByVersionNumber(array, versionField, isInvertedOrder) {
    return array.sort(function(preItem, curItem) {
        const preItemVersion = versionField ? preItem[versionField] : preItem;
        const curItemVersion = versionField ? curItem[versionField] : curItem;
        const preItemArray = preItemVersion.replace(/[^\d\.]*/g, '').split('.');
        const curItemArray = curItemVersion.replace(/[^\d\.]*/g, '').split('.');
        var flag = isInvertedOrder ? 1 : -1;
        for (let i = 0; i < preItemArray.length; i++) {
            let n1 = parseInt(preItemArray[i], 10);
            let n2 = parseInt(curItemArray[i], 10);
            if (n1 > n2) {
                return -flag;
            } else if (n1 < n2) {
                return flag;
            }
        }
        return 0;
    });
}

// const arr = sortByVersionNumber(['1.0.9','1.0.2','1.0.7'],null,true);
// console.log(arr);


function checkoutSvnDir() {
    const svnAccountInfo = {
        username: "liuzhengwu",
        password: "4AbPFUJB"
    }
    const url = "https://repo.ds.gome.com.cn:8443/svn/atg_poc/30_Coding/NewDevMode/tags/gome-gfe/channel-web/public";
    const dir = "D:\\test";

    svnUltimate.commands.checkout(url, dir, svnAccountInfo, function(err, data) {
        console.log(data);
    });
}

function updateSvnDir() {
    const svnAccountInfo = {
        username: "liuzhengwu",
        password: "4AbPFUJB"
    }
    const wcs = "D:\\test";

    svnUltimate.commands.update(wcs, svnAccountInfo, function(err, data) {
        console.log(data);
    });
}

// checkoutSvnDir();
// updateSvnDir();
