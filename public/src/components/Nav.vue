<template>
    <el-row class="panel">
        <!--顶部导航栏-->
        <el-col :span="24" class="panel-top">
            <el-col :span="3" align="right">
                <img src="../assets/logo.png" alt="" style="height:55px;border-radius: 10px;">
            </el-col>
            <el-col :span="21">
                <!-- 用户信息下拉菜单 -->
                <el-dropdown class="user-info-dropdown" trigger="click" @command="handleUserMenuByCommand">
                    <span class="el-dropdown-link">
                    你好，{{userInfo.username}}<i class="el-icon-caret-bottom el-icon--right"></i>
                  </span>
                    <el-dropdown-menu slot="dropdown" class="user-info-menu">
                        <el-dropdown-item command="userInfo">个人信息</el-dropdown-item>
                        <el-dropdown-item command="logout">退出</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
                <!-- 个人信息模态框 -->
                <el-dialog title="个人信息" size="tiny" v-model="userInfoDialogVisible" class="user-info-dialog" :close-on-click-modal="false">
                    <el-form label-width="80px">
                        <el-form-item label="用户名：">
                            <el-input v-model="userInfo.username" :readonly="true"></el-input>
                        </el-form-item>
                        <el-form-item label="角色：">
                            <el-input v-model="userInfo.roleName" :readonly="true"></el-input>
                        </el-form-item>
                    </el-form>
                </el-dialog>
            </el-col>
        </el-col>
        <!--顶部导航栏END-->
        <el-col :span="24" class="panel-center">
            <!--左侧导航菜单-->
            <aside class="left-aside">
                <el-menu :default-active="$route.path" :default-openeds="openedArr" class="aside-menu" theme="dark" unique-opened router>
                    <!--通过循环构造右侧菜单-->
                    <template v-for="(item,index) in $router.options.routes" v-if="!item.hidden">
                        <!--对于非单个菜单的-->
                        <el-submenu :index="index+''" v-if="!item.leaf">
                            <!--标题-->
                            <template slot="title"><i :class="item.iconCls"></i>{{item.name}}</template>
                            <!--内嵌菜单-->
                            <el-menu-item v-for="child in item.children" v-if="!child.hidden" :index="child.path">{{child.name}}</el-menu-item>
                        </el-submenu>
                        <!--单个菜单-->
                        <el-menu-item v-if="item.leaf&&item.children.length>0" :index="item.children[0].path"><i :class="item.iconCls"></i>{{item.children[0].name}}</el-menu-item>
                    </template>
                </el-menu>
            </aside>
            <!--左侧导航菜单END-->
            <!--右侧内容-->
            <section class="panel-c-c">
                <div class="grid-content bg-purple-light">
                    <!--右侧顶部面包屑-->
                    <el-col :span="24" class="panel-inner-top">
                        <strong>{{$route.params.panelTitle || $route.name}}</strong>
                        <el-breadcrumb separator="/" class="bread-crumb">
                            <el-breadcrumb-item :to="{ path: '/' }" v-if="$route.path!='/'">首页</el-breadcrumb-item>
                            <el-breadcrumb-item v-if="$route.path!='/'">{{$route.matched[0].name}}</el-breadcrumb-item>
                            <el-breadcrumb-item>{{$route.name}}</el-breadcrumb-item>
                        </el-breadcrumb>
                    </el-col>
                    <!--右侧顶部面包屑END-->
                    <el-col :span="24" class="panel-inner-bottom">
                        <!--路由视图-->
                        <router-view></router-view>
                    </el-col>
                </div>
            </section>
            <!--右侧内容END-->
        </el-col>
    </el-row>
</template>
<script>
export default {
    data() {
            return {
                openedArr: [],
                currentPath: '',
                userInfo: window.globalData.userInfo,
                nodeEnv: window.globalData.nodeEnv,
                userInfoDialogVisible: false
            };
        },
        watch: {
            '$route' (to, from) { //监听路由改变
                if (to.path === '/') {
                    this.openedArr = [];
                }
            }
        },
        methods: {
            handleUserMenuByCommand(command) {
                if (command === 'userInfo') {
                    this.showUserInfo();
                }
                if (command === 'logout') {
                    this.logout();
                }
            },
            showUserInfo() {
                this.userInfoDialogVisible = true;
            },
            logout() {
                var _this = this;
                this.$confirm('确认退出吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    if (this.nodeEnv === 'dev') {
                        location.replace('/dev/logout');
                    } else {
                        location.replace('/prd/logout');
                    }
                }).catch(() => {});
            }
        }
};
</script>
<style lang="scss">
.panel {
    position: absolute;
    top: 0px;
    bottom: 0px;
    width: 100%;
}

.panel-top {
    height: 60px;
    background: #1F2D3D url(/assets/log.png) no-repeat left center;
    color: #c0ccda;
}

.panel-center {
    background: #324057;
    position: absolute;
    top: 60px;
    bottom: 0px;
    overflow: hidden;
}

.logo-txt {
    margin-left: 10px;
    font-size: 20px;
    i {
        color: #20a0ff;
        font-style: normal;
    }
    a {
        font-size: 14px;
        margin-left: 5px;
        color: #fff;
        text-decoration: none;
        &:hover {
            color: #ddd;
        }
    }
}

.left-aside {
    width: 230px;
    .aside-menu {}
}

.panel-c-c {
    background: #f1f2f7;
    position: absolute;
    right: 0px;
    top: 0px;
    bottom: 0px;
    left: 230px;
    overflow-y: scroll;
    padding: 20px;
    .panel-inner-top {
        margin-bottom: 15px;
        .bread-crumb {
            height: 22px;
            line-height: 22px;
            float: right;
        }
        strong {
            width: 200px;
            float: left;
            color: #475669;
        }
    }
    .panel-inner-bottom {
        background-color: #fff;
        box-sizing: border-box;
        padding: 15px;
    }
}

.logo {
    width: 40px;
    float: left;
    margin: 10px 10px 10px 18px;
}

.user-info-dropdown {
    float: right;
    margin-top: 15px;
    height: 30px;
    line-height: 30px;
    margin-right: 20px;
}

.user-info-dropdown .el-dropdown-link {
    color: #fff;
    cursor: pointer;
}

.user-info-menu {
    font-size: 15px;
}
</style>
<style>
.user-info-dialog input.el-input__inner {
    border: 0;
}
</style>
