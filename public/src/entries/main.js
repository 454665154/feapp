import Vue from 'vue';
import App from '../components/App.vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-default/index.css';
import VueRouter from 'vue-router';
import NProgress from 'nprogress';
import axios from 'axios'
import 'nprogress/nprogress.css';
import Nav from '../components/Nav.vue';
import TaskList from '../router-components/TaskList.vue';
import VersionList from '../router-components/VersionList.vue';
import TagList from '../router-components/TagList.vue';
import TagLogList from '../router-components/log/TagLogList.vue';
import VersionLogList from '../router-components/log/VersionDeleteLogList.vue';
import TaskBuildLogList from '../router-components/log/taskBuildLogList.vue';
import AdminTaskList from '../router-components/admin/TaskList.vue';
import AdminAppList from '../router-components/admin/AppList.vue';
import AdminFtpList from '../router-components/admin/FtpList.vue';
import AdminUserList from '../router-components/admin/UserList.vue';
// import AdminScheduleList from '../router-components/admin/ScheduleList.vue';
import util from '../../../utils/util';
const systemParam = util.getSystemParam();

Vue.use(ElementUI);
Vue.use(VueRouter);

//从全局变量获取用户信息，判断用户是否为Admin
const isAdmin = systemParam.userRole.constant.ADMIN === window.globalData.userInfo.role;

const routes = [{
    path: '/',
    hidden: true,
    redirect: '/task/taskList'
}, {
    path: '/',
    component: Nav,
    name: '任务列表',
    iconCls: 'fa fa-address-card',
    leaf: true,
    children: [
        { path: '/task/taskList', component: TaskList, name: '任务列表' }
    ]
}, {
    path: '/',
    component: Nav,
    name: '版本管理',
    iconCls: 'el-icon-date',
    leaf: true,
    children: [
        { path: '/versionList', component: VersionList, name: '版本管理' }
    ]
}, {
    path: '/',
    component: Nav,
    name: 'Tag管理',
    iconCls: 'el-icon-menu',
    leaf: true,
    children: [
        { path: '/tagList', component: TagList, name: 'Tag管理' }
    ]
}, {
    path: '/',
    component: Nav,
    name: '日志',
    iconCls: 'el-icon-document',
    children: [
        { path: '/log/taskBuildLogList', component: TaskBuildLogList, name: '任务构建日志' },
        { path: '/log/versionDeleteLogList', component: VersionLogList, name: '版本删除日志' },
        { path: '/log/tagLogList', component: TagLogList, name: 'Tag操作日志' }
    ]
}, {
    path: '/',
    component: Nav,
    hidden: !isAdmin,
    name: '后台管理',
    iconCls: 'el-icon-setting',
    children: [
        { path: '/admin/taskList', component: AdminTaskList, name: '任务管理' },
        { path: '/admin/appList', component: AdminAppList, name: '应用管理' },
        { path: '/admin/ftpList', component: AdminFtpList, name: 'FTP管理' },
        { path: '/admin/userList', component: AdminUserList, name: '用户管理' }
        // { path: '/admin/scheduleList', component: AdminScheduleList, name: '调度管理' }
    ]
}, {
    path: '*',
    redirect: '/task/taskList',
    hidden: true
}];

const router = new VueRouter({
    routes
});

router.beforeEach((to, from, next) => {
    NProgress.start();
    next();
});

router.afterEach(transition => {
    NProgress.done();
});

// axios拦截器，未授权时跳转到登录页面
axios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response) {
            if (error.response.status === 401) {
                if (window.globalData.nodeEnv === 'dev') {
                    location.href = '/dev/login';
                } else {
                    location.href = '/index/login';
                }
            }
        }
        return Promise.reject(error.response.data);
    });

new Vue({
    el: '#app',
    template: '<App/>',
    router,
    axios,
    components: { App }
}).$mount('#app');
