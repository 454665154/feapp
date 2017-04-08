<template>
    <section>
        <el-form :inline="true" :model="searchForm" ref="searchForm">
            <el-form-item prop="appId" label="应用名称">
                <el-select v-model="searchForm.appId" placeholder="请选择应用" @change="getProjectListForSearchForm">
                    <el-option v-for="app in searchForm.appList" :label="app.name" :value="app._id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item prop="projectName" label="项目名称">
                <el-select v-model="searchForm.projectName" placeholder="请选择项目">
                    <el-option v-for="project in searchForm.projectList" :label="project.name" :value="project.name"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item prop="tagName" label="Tag名称">
                <el-input v-model="searchForm.tagName"></el-input>
            </el-form-item>
            <el-form-item prop="operateType" label="操作类型">
                <el-select v-model="searchForm.operateType" placeholder="请选择操作类型">
                    <el-option v-for="(label, value) in searchForm.tagOperateTypeParam" :label="label" :value="value"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item prop="createdBy" label="创建人">
                <el-input v-model="searchForm.createdBy"></el-input>
            </el-form-item>
            <el-form-item prop="createdAtRegion" label="创建时间">
                <el-date-picker v-model="searchForm.createdAtRegion" type="datetimerange" placeholder="选择创建时间范围">
                </el-date-picker>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="search" @click="submitSearchForm">查询</el-button>
                <el-button @click="resetSearchForm">重置</el-button>
            </el-form-item>
        </el-form>
        <!--表格-->
        <template>
            <el-table highlight-current-row v-loading="listLoading" :data="tableData" style="width: 100%;">
                </el-table-column>
                <el-table-column prop="app.name" label="应用名称">
                </el-table-column>
                <el-table-column prop="projectName" label="项目名称">
                </el-table-column>
                <el-table-column prop="tagName" label="Tag名称">
                </el-table-column>
                <el-table-column prop="operateType" label="操作类型" :formatter="formatOperateType">
                </el-table-column>
                <el-table-column prop="tagPath" label="Tag地址">
                </el-table-column>
                <el-table-column prop="tagOriginPath" label="Tag来源地址">
                </el-table-column>
                <el-table-column prop="createdBy" label="创建人">
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" :formatter="formatDate">
                </el-table-column>
            </el-table>
        </template>
        <!--分页-->
        <el-col :span="24" class="toolbar" style="padding-bottom:10px;">
            <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage" :page-sizes="[20, 40, 100]" :page-size="currentPageSize" layout="total, sizes, prev, pager, next, jumper" :total="tableDataLength" style="float:right">
            </el-pagination>
        </el-col>
    </section>
</template>
<script>
import axios from 'axios';
import moment from 'moment';
import _ from 'underscore';
import util from '../../../../utils/util';
const systemParam = util.getSystemParam();
export default {
    data() {
            return {
                searchForm: {
                    appId: '',
                    projectName: '',
                    projectList: [],
                    appList: [],
                    tagName: '',
                    operateType: '',
                    tagOperateTypeParam: systemParam.tagLogOperateType.param,
                    createdAtRegion: '',
                    createdBy: ''
                },
                listLoading: false,
                tableData: [],
                tableDataLength: 0,
                currentPage: 1,
                currentPageSize: 20
            };
        },
        created: function() {
            this.getTagLogList();
            this.getAppList();
        },
        methods: {
            //提交查询表单
            submitSearchForm() {
                this.getTagLogList();
            },
            //重置查询表单
            resetSearchForm() {
                this.$refs['searchForm'].resetFields();
                this.getTagLogList();
            },
            //获取Tag日志列表
            getTagLogList: function(searchKey) {
                const _this = this;
                let params = {
                    limit: _this.currentPageSize,
                    page: _this.currentPage
                };
                if (_this.searchForm.projectName !== '') {
                    params.projectName = _this.searchForm.projectName;
                }
                if (_this.searchForm.tagName !== '') {
                    params.tagName = _this.searchForm.tagName;
                }
                if (_this.searchForm.operateType !== '') {
                    params.operateType = _this.searchForm.operateType;
                }
                _this.searchForm.createdBy = _this.searchForm.createdBy.trim();
                if (_this.searchForm.createdBy !== '') {
                    params.createdBy = _this.searchForm.createdBy;
                }
                if (_this.searchForm.createdAtRegion !== '') {
                    params.createdAtStart = _this.searchForm.createdAtRegion[0];
                    params.createdAtEnd = _this.searchForm.createdAtRegion[1];
                }
                _this.listLoading = true;
                axios.get('/api/tagLog/getTagLogListByCriteria', {
                    params: params
                }).then(function(res) {
                    _this.listLoading = false;
                    if (res.data.success) {
                        _this.tableData = res.data.data;
                        _this.tableDataLength = res.data.meta.count;
                    } else {
                        _this.$message({
                            message: res.data.msg,
                            type: 'error'
                        });
                    }
                });
            },
            //处理分页中每个条数的改变逻辑
            handleSizeChange(val) {
                this.currentPageSize = val;
                this.getTagLogList();
            },
            //处理分页中页码的改变逻辑
            handleCurrentChange(val) {
                this.currentPage = val;
                this.getTagLogList();
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
                            if(res.data.data.length > 0){
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
            //格式化日期
            formatDate: function(row, column) {
                return moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss');
            },
            //格式化操作类型
            formatOperateType: function(row, column) {
                return systemParam.tagLogOperateType.param[row.operateType];
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
