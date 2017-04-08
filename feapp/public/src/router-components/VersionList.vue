<template>
    <section>
        <el-col :span="24" class="toolbar">
            <el-form :inline="true" :rules="searchFormRules" :model="searchForm" ref="searchForm">
                <el-form-item prop="appId" label="应用名称">
                    <el-select v-model="searchForm.appId" placeholder="请选择应用" @change="getTaskList">
                        <el-option v-for="app in searchForm.appList" :label="app.name" :value="app._id"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item prop="taskId" label="任务名称">
                    <el-select v-model="searchForm.taskId" placeholder="请选择任务" @change="submitSearchForm">
                        <el-option v-for="task in searchForm.taskList" :label="task.name" :value="task._id"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
        </el-col>
        <!-- 数据表格 -->
        <el-table highlight-current-row v-loading="listLoading" :data="tableData" :empty-text="tableEmptyText" style="width: 100%;">
            <el-table-column prop="name" label="版本名称">
                <template scope="scope">
                    <el-button type="text" size="small" @click="handleDownload(scope.row)">{{scope.row.name}}</el-button>
                </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" :formatter="formatDate">
            </el-table-column>
            <el-table-column label="操作" width="100">
                <template scope="scope">
                    <el-button type="text" size="small" @click="handleDel(scope.row)">删除</el-button>
                    <el-button type="text" size="small" @click="handleDownload(scope.row)">下载</el-button>
                </template>
            </el-table-column>
        </el-table>
    </section>
</template>
<script>
import NProgress from 'nprogress';
import axios from 'axios';
import moment from 'moment';
export default {
    data() {
            return {
                searchForm: {
                    appId: '',
                    taskId: '',
                    taskList: [],
                    appList: []
                },
                searchFormRules: {
                    appId: [{
                        required: true,
                        message: '请选择应用'
                    }],
                    taskId: [{
                        required: true,
                        message: '请选择任务'
                    }]
                },
                listLoading: false,
                tableDataLength: 0,
                tableData: [],
                tableEmptyText: '请选择查询条件后，再查询！'
            };
        },
        created() {
            this.getAppList();
        },
        methods: {
            //提交搜索版本表单
            submitSearchForm() {
                const _this = this;
                _this.$refs.searchForm.validate((valid) => {
                    if (valid) {
                        _this.getVersionList();
                    }
                });
            },
            //删除版本处理
            handleDel(row) {
                const _this = this;
                _this.$confirm('确认删除该记录吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    const versionData = {
                        app: row.appId,
                        task: row.taskId,
                        versionName: row.name
                    };
                    NProgress.start();
                    axios.post('/api/version/deleteVersion', versionData).then(function(res) {
                        if (res.data.success) {
                            _this.$message({
                                message: res.data.msg,
                                type: 'success'
                            });
                            NProgress.done();
                            _this.getVersionList();
                        } else {
                            _this.$message({
                                message: res.data.msg,
                                type: 'error'
                            });
                        }
                    });
                });
            },
            //下载版本处理
            handleDownload(row) {
                location = `/api/version/downloadVersion?taskId=${row.taskId}&versionName=${row.name}`;
            },
            //获取版本列表
            getVersionList() {
                const _this = this;
                if (_this.tableEmptyText !== '暂无数据') {
                    _this.tableEmptyText = '暂无数据';
                }
                _this.listLoading = true;

                axios.get('/api/version/getVersionListByTaskId', {
                    params: {
                        taskId: _this.searchForm.taskId
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
                    } else {
                        _this.$message({
                            message: res.data.msg,
                            type: 'error'
                        });
                    }
                });
            },
            //获取任务列表
            getTaskList() {
                const _this = this;
                if (_this.searchForm.appId !== '') {
                    const params = {
                        id: _this.searchForm.appId
                    };
                    axios.get('/api/task/getTaskListByAppId', {
                        params: params
                    }).then(function(res) {
                        if (res.data.success) {
                            _this.searchForm.taskList = res.data.data;
                            if (_this.searchForm.taskList.length > 0) {
                                _this.searchForm.taskId = _this.searchForm.taskList[0]._id;
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
            //格式化日期-工具函数
            formatDate: function(row, column) {
                return moment(parseInt(row.createdAt)).format('YYYY-MM-DD HH:mm:ss');
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
</style>
