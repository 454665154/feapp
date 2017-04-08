/**
 * prd环境系统配置
 */
module.exports = {
    //构建项目根路径
    buildProjectRootDir: "/app/feapp",
    //sso信息
    sso: {
        //appKey
        appKey: "0570bc6b54a944f086dcefbd78b091ac",
        //登录页面URL
        loginURL: "http://popeye.ds.gome.com.cn/app/login",
        //退出页面URL
        logoutURL: "http://popeye.ds.gome.com.cn/app/logout",
        //反向校验Token的接口地址
        verifyTokenURL: "http://popeye.ds.gome.com.cn/app/token"
    }
}
