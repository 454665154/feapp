<template>
    <section>
        <el-col :span="24" class="toolbar">
            <el-form :inline="true" :rules="searchFormRules" :model="searchForm" ref="searchForm">
                <el-form-item prop="appId" label="应用名称">
                    <el-select v-model="searchForm.appId" placeholder="请选择应用" @change="getProjectListForSearchForm">
                        <el-option v-for="app in searchForm.appList" :label="app.name" :value="app._id"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item prop="projectName" label="项目名称">
                    <el-select v-model="searchForm.projectName" placeholder="请选择项目" @change="submitSearchForm">
                        <el-option v-for="project in searchForm.projectList" :label="project.name" :value="project.name"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="warning" icon="plus" @click="handleAdd">新增</el-button>
                </el-form-item>
            </el-form>
        </el-col>
        <!-- tag路径 -->
        <div class="tag-path-wrapper">
            <label>tag的路径：</label>
            <a class="tag-path" :href="projectTagPath" target="_blank">{{projectTagPath}}</a>
        </div>
        <!-- 数据表格 -->
        <el-table highlight-current-row v-loading="listLoading" :data="tableData" :empty-text="tableEmptyText" style="width: 100%;">
            <el-table-column prop="tagName" label="Tag名称">
            </el-table-column>
            <el-table-column prop="creatorName" label="创建人">
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" :formatter="formatDate">
            </el-table-column>
            <el-table-column prop="revision" label="Revision">
            </el-table-column>
            <el-table-column label="操作" width="100">
                <template scope="scope">
                    <el-button type="text" size="small" @click="handleDel(scope.row)">删除</el-button>
                    <el-button type="text" size="small" @click="handleCopy(scope.row)">拷贝</el-button>
                </template>
            </el-table-column>
        </el-table>
        <!--新增Tag模态框-->
        <el-dialog title="新增Tag" v-model="addFormVisible" :close-on-click-modal="true">
            <el-form :model="addForm" label-width="120px" :rules="addFormRules" ref="addForm">
                <el-form-item label="应用" prop="appId">
                    <el-select v-model="addForm.appId" placeholder="请选择应用" @change="getProjectListForAddForm">
                        <el-option v-for="app in addForm.appList" :label="app.name" :value="app._id"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="项目" prop="projectName">
                    <el-select v-model="addForm.projectName" placeholder="请选择项目" @change="getBranchTypeList">
                        <el-option v-for="project in addForm.projectList" :label="project.name" :value="project.name"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="分支" prop="branchType">
                    <el-select v-model="addForm.branchType" placeholder="请选择分支">
                        <el-option v-for="branchType in addForm.branchTypeList" :label="branchType.name" :value="branchType.projectPath"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="Tag名称" prop="tagName">
                    <el-input v-model="addForm.tagName" auto-complete="off"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="addFormVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitAddForm" :loading="addLoading">{{btnAddText}}</el-button>
            </div>
        </el-dialog>
        <!--拷贝Tag模态框-->
        <el-dialog title="拷贝Tag" v-model="copyFormVisible" :close-on-click-modal="true">
            <el-form :rules="copyFormRules" :model="copyForm" label-width="120px" ref="copyForm">
                <el-form-item label="应用">
                    {{copyForm.appName}}
                </el-form-item>
                <el-form-item label="项目">
                    {{copyForm.projectName}}
                </el-form-item>
                <el-form-item label="分支">
                    tag
                </el-form-item>
                <el-form-item label="Tag名称" prop="tagName">
                    <el-input v-model="copyForm.tagName" auto-complete="off"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="copyFormVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitCopyForm" :loading="copyLoading">{{btnCopyText}}</el-button>
            </div>
        </el-dialog>
    </section>
</template>
<script>
import NProgress from 'nprogress';
import axios from 'axios';
import moment from 'moment';
import _ from 'underscore';
import util from '../../../utils/util';
const systemParam = util.getSystemParam();
export default {
    data() {
            return {
                searchForm: {
                    appId: '',
                    projectName: '',
                    projectList: [],
                    appList: []
                },
                searchFormRules: {
                    appId: [{
                        required: true,
                        message: '请选择应用'
                    }],
                    projectName: [{
                        required: true,
                        message: '请选择项目'
                    }]
                },
                listLoading: false,
                tableDataLength: 0,
                tableData: [],
                tableMeta: {},
                tableEmptyText: '请选择查询条件后，再查询！',
                projectTagPath: '',
                addForm: {
                    appId: '',
                    projectName: '',
                    branchType: '',
                    tagName: '',
                    projectTagPath: '',
                    branchTypeList: [],
                    projectList: [],
                    appList: []
                },
                addFormRules: {
                    appId: [{
                        required: true,
                        message: '请选择应用'
                    }],
                    projectName: [{
                        required: true,
                        message: '请选择项目'
                    }],
                    branchType: [{
                        required: true,
                        message: '请选择分支'
                    }],
                    tagName: {
                        required: true,
                        message: '请输入Tag名称'
                    }
                },
                addLoading: false,
                btnAddText: '提 交',
                addFormVisible: false, //拷贝界面显是否显示
                copyForm: {
                    appId: '',
                    appName: '',
                    projectName: '',
                    tagOriginPath: '',
                    tagName: ''
                },
                copyFormRules: {
                    tagName: {
                        required: true,
                        message: '请输入Tag名称'
                    }
                },
                copyLoading: false,
                btnCopyText: '提 交',
                copyFormVisible: false //拷贝界面显是否显示
            };
        },
        created() {
            this.getAppList();
        },
        methods: {
            //提交搜索Tag表单
            submitSearchForm() {
                const _this = this;
                _this.$refs.searchForm.validate((valid) => {
                    if (valid) {
                        _this.getTagList();
                    }
                });
            },
            //提交新增Tag表单
            submitAddForm() {
                const _this = this;
                _this.$refs.addForm.validate((valid) => {
                    if (valid) {
                        _this.$confirm('确认提交吗？', '提示', {}).then(() => {
                            _this.addLoading = true;
                            NProgress.start();
                            _this.btnAddText = '提交中';
                            const tagData = {
                                app: _this.addForm.appId,
                                projectName: _this.addForm.projectName,
                                tagName: _this.addForm.tagName,
                                tagOriginPath: _this.addForm.branchType,
                                tagPath: `${_this.addForm.projectTagPath}/${_this.addForm.tagName}`
                            };

                            axios.post('/api/tag/createTag', tagData).then(function(res) {
                                if (res.data.success) {
                                    _this.$message({
                                        message: res.data.msg,
                                        type: 'success'
                                    });
                                    _this.addFormVisible = false;
                                    _this.getTagList();
                                } else {
                                    _this.$message({
                                        message: res.data.msg,
                                        type: 'error'
                                    });
                                }
                                _this.btnAddText = '提 交';
                                _this.addLoading = false;
                                NProgress.done();
                            });
                        });
                    }
                });
            },
            //提交拷贝Tag表单
            submitCopyForm() {
                const _this = this;
                _this.$refs.copyForm.validate((valid) => {
                    if (valid) {
                        _this.$confirm('确认提交吗？', '提示', {}).then(() => {
                            _this.copyLoading = true;
                            NProgress.start();
                            _this.btnCopyText = '提交中';
                            const tagData = {
                                app: _this.copyForm.appId,
                                projectName: _this.copyForm.projectName,
                                tagName: _this.copyForm.tagName,
                                tagOriginPath: _this.copyForm.tagOriginPath,
                                tagPath: `${_this.tableMeta.projectTagPath}/${_this.copyForm.tagName}`
                            };
                            axios.post('/api/tag/copyTag', tagData).then(function(res) {
                                if (res.data.success) {
                                    _this.$message({
                                        message: res.data.msg,
                                        type: 'success'
                                    });
                                    _this.copyFormVisible = false;
                                    _this.getTagList();
                                } else {
                                    _this.$message({
                                        message: res.data.msg,
                                        type: 'error'
                                    });
                                }
                                _this.btnCopyText = '提 交';
                                _this.copyLoading = false;
                                NProgress.done();
                            });
                        });
                    }
                });
            },
            //初始化新增Tag表单
            handleAdd() {
                this.addFormVisible = true;
                if (this.$refs.addForm) {
                    this.$refs.addForm.resetFields(); //重置表单
                }
                if (this.searchForm.appId !== '' && this.searchForm.projectName !== '') {
                    this.addForm.appId = this.searchForm.appId;
                    this.getProjectListForAddForm('init');
                    this.addForm.projectName = this.searchForm.projectName;
                    this.getBranchTypeList();
                }
            },
            //初始化拷贝Tag表单
            handleCopy: function(row) {
                this.copyFormVisible = true;
                if (this.$refs.copyForm) {
                    this.$refs.copyForm.resetFields(); //重置表单
                }

                this.copyForm.appId = this.tableMeta.appId;
                this.copyForm.appName = this.tableMeta.appName;
                this.copyForm.projectName = this.tableMeta.projectName;
                this.copyForm.tagOriginPath = `${this.tableMeta.projectTagPath}/${row.tagName}`;
                this.copyForm.tagName = this.tableData[0].tagName;
            },
            //删除Tag处理
            handleDel(row) {
                const _this = this;
                _this.$confirm('确认删除该记录吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    const tagData = {
                        app: _this.tableMeta.appId,
                        projectName: _this.tableMeta.projectName,
                        tagName: row.tagName,
                        tagOriginPath: '',
                        tagPath: `${_this.tableMeta.projectTagPath}/${row.tagName}`
                    };
                    NProgress.start();
                    axios.post('/api/tag/deleteTag', tagData).then(function(res) {
                        if (res.data.success) {
                            _this.$message({
                                message: res.data.msg,
                                type: 'success'
                            });
                            NProgress.done();
                            _this.getTagList();
                        } else {
                            _this.$message({
                                message: res.data.msg,
                                type: 'error'
                            });
                        }
                    });
                });
            },
            //获取Tag列表
            getTagList() {
                const _this = this;
                if (_this.tableEmptyText !== '暂无数据') {
                    _this.tableEmptyText = '暂无数据';
                }
                const app = _.findWhere(_this.searchForm.appList, {
                    _id: _this.searchForm.appId
                });
                _this.projectTagPath = `${app.tagPath}/${_this.searchForm.projectName}`;
                _this.listLoading = true;

                //向tableMeta填充和表格关联的元数据，执行单行操作时使用
                _this.tableMeta = {
                    appId: app._id,
                    appName: app.name,
                    projectTagPath: _this.projectTagPath,
                    projectName: _this.searchForm.projectName
                };
                axios.get('/api/tag/getTagListByCriteria', {
                    params: {
                        projectTagPath: _this.projectTagPath
                    }
                }).then(function(res) {
                    _this.listLoading = false;
                    if (res.data.success) {
                        _this.tableData = res.data.data;
                        _this.tableDataLength = res.data.data.length;
                    } else {
                        _this.$message({
                            message: res.data.msg,
                            type: 'error'
                        });
                    }
                });
            },
            //获取App列表
            getAppList() {
                const _this = this;
                axios.get('/api/app/getAllAppList').then(function(res) {
                    if (res.data.success) {
                        _this.searchForm.appList = res.data.data;
                        _this.addForm.appList = res.data.data;
                    } else {
                        _this.$message({
                            message: res.data.msg,
                            type: 'error'
                        });
                    }

                });
            },
            //获取项目列表-搜索Tag表单
            getProjectListForSearchForm() {
                const _this = this;
                if (_this.searchForm.appId !== '') {
                    const app = _.findWhere(_this.searchForm.appList, {
                        _id: _this.searchForm.appId
                    });
                    const params = {
                        tagPath: app.tagPath
                    };
                    axios.get('/api/tag/getProjectListByAppPath', {
                        params: params
                    }).then(function(res) {
                        if (res.data.success) {
                            _this.searchForm.projectList = res.data.data;
                            if (_this.searchForm.projectList.length > 0) {
                                _this.searchForm.projectName = _this.searchForm.projectList[0].name;
                            }
                        } else {
                            _this.$message({
                                message: res.data.msg,
                                type: 'error'
                            });
                        }

                    });
                }
            },
            //获取项目列表-添加Tag表单
            getProjectListForAddForm(source) {
                const _this = this;
                const appId = _this.addForm.appId;
                if (appId === '') {
                    _this.addForm.projectList = [];
                } else {
                    const app = _.findWhere(_this.addForm.appList, {
                        _id: appId
                    });
                    const params = {
                        tagPath: app.tagPath
                    };
                    axios.get('/api/tag/getProjectListByAppPath', {
                        params: params
                    }).then(function(res) {
                        if (res.data.success) {
                            _this.addForm.projectList = res.data.data;
                            if (source === 'init') {
                                _this.addForm.projectName = _this.searchForm.projectName;
                            } else {
                                if (_this.addForm.projectList.length > 0) {
                                    _this.addForm.projectName = _this.addForm.projectList[0].name;
                                }
                            }
                        } else {
                            _this.$message({
                                message: res.data.msg,
                                type: 'error'
                            });
                        }

                    });
                }
            },
            //获取分类类型列表-添加Tag表单
            getBranchTypeList() {
                this.addForm.branchType = '';
                this.addForm.branchTypeList = [];
                if (this.addForm.appId !== '') {
                    const app = _.findWhere(this.addForm.appList, {
                        _id: this.addForm.appId
                    });
                    this.addForm.projectTagPath = `${app.tagPath}/${this.addForm.projectName}`;
                    if (app.masterPath) {
                        this.addForm.branchTypeList.push({
                            name: systemParam.branchType.param[systemParam.branchType.constant.MASTER],
                            projectPath: `${app.masterPath}/${this.addForm.projectName}`
                        });
                    }
                    if (app.branchPath) {
                        this.addForm.branchTypeList.push({
                            name: systemParam.branchType.param[systemParam.branchType.constant.BRANCH],
                            projectPath: `${app.branchPath}/${this.addForm.projectName}`
                        });
                    }
                    if (app.tagPath) {
                        this.addForm.branchTypeList.push({
                            name: systemParam.branchType.param[systemParam.branchType.constant.TAG],
                            projectPath: `${app.tagPath}/${this.addForm.projectName}`
                        });
                    }
                    this.setLatestTagName(`${app.tagPath}/${this.addForm.projectName}`);
                }
            },
            //设置最新的TagName
            setLatestTagName(projectTagPath) {
                const _this = this;
                axios.get('/api/tag/getLatestTagNameByTagPath', {
                    params: {
                        projectTagPath: projectTagPath
                    }
                }).then(function(res) {
                    if (res.data.success) {
                        _this.addForm.tagName = res.data.data;
                    } else {
                        _this.$message({
                            message: res.data.msg,
                            type: 'error'
                        });
                    }
                });
            },
            //格式化日期-工具函数
            formatDate: function(row, column) {
                return moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss');
            }
        }
};
</script>
<style lang="scss" scoped>
.toolbar .el-form-item {
    margin-bottom: 10px;
}

.toolbar {
    background: #fff;
    padding-top: 10px;
}

.tag-path-wrapper {
    line-height: 1;
    font-size: 0;
}

.tag-path-wrapper label {
    font-size: 14px;
    display: inline-block;
    color: #1f2d3d;
    padding: 11px 5px 11px 0;
    box-sizing: border-box;
}

.tag-path-wrapper .tag-path {
    display: inline-block;
    font-size: 14px;
    margin: 0;
    padding: 11px 0;
    color: #1D8CE0;
}

.el-input-number {
    width: 130px;
}
</style>
