<template>
    <section>
      <el-form :inline="true" :model="searchForm" ref="searchForm">
          <el-form-item prop="appId" label="应用名称">
              <el-select v-model="searchForm.appId" placeholder="请选择应用" @change="getTaskList">
                  <el-option v-for="app in searchForm.appList" :label="app.name" :value="app._id"></el-option>
              </el-select>
          </el-form-item>
          <el-form-item prop="taskId" label="任务名称">
              <el-select v-model="searchForm.taskId" placeholder="请选择任务">
                  <el-option v-for="task in searchForm.taskList" :label="task.name" :value="task._id"></el-option>
              </el-select>
          </el-form-item>
          <el-form-item prop="operateType" label="构建结果">
            <el-select v-model="searchForm.buildStatusText" placeholder="请选择构建结果">
                <el-option v-for="(label, value) in searchForm.buildStatus" :label="label" :value="value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item prop="createdBy" label="构建人">
              <el-input v-model="searchForm.createdBy"></el-input>
          </el-form-item>
          <el-form-item prop="createdAtRegion" label="创建时间">
              <el-date-picker v-model="searchForm.createdAtRegion" type="datetimerange" placeholder="选择创建时间范围">
              </el-date-picker>
          </el-form-item>
          <el-form-item>
              <el-button type="primary" icon="search" @click="getTaskBuildLog">查询</el-button>
              <el-button @click="resetSearchForm">重置</el-button>
          </el-form-item>
      </el-form>
      <!--表格-->
      <el-table highlight-current-row v-loading="listLoading" :data="tableData" style="width: 100%;">
        <el-table-column prop="task.name" label="任务名称" sortable>
        </el-table-column>
        <el-table-column prop="app.name" label="应用名称" sortable>
        </el-table-column>
        <el-table-column prop="buildStatus" label="构建结果" :formatter="formatBuildStatus" sortable>
        </el-table-column>
        <el-table-column prop="createdBy" label="构建人" sortable>
        </el-table-column>
        <el-table-column prop="createdAt" label="构建时间" :formatter="formatDate" sortable>
        </el-table-column>
      </el-table>        
      <!--分页-->
      <el-col :span="24" class="toolbar" style="padding-bottom:10px;">
        <el-pagination
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="currentPage"
              :page-sizes="[10, 20, 30, 40]"
              :page-size="currentPageSize"
              layout="total, sizes, prev, pager, next, jumper"
        :total="tableDataLength"
              style="float:right">
        </el-pagination>
      </el-col>
    </section>
</template>

<script>
import NProgress from 'nprogress';
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
          taskId: '',
          taskList: [],
          appList: [],
          buildStatusText:'',
          buildStatus:systemParam.buildStatus.param,
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
  created:function(){
    this.getTaskBuildLogList();
    this.getAppList();
  },
  methods: {
    //提交查询表单
    getTaskBuildLog() {
        this.getTaskBuildLogList();
    },
    //重置查询表单
    resetSearchForm() {
        this.$refs['searchForm'].resetFields();
        this.getTaskBuildLogList();
    },
    getTaskBuildLogList : function(searchKey){
        const _this = this;
        let params = {
            limit: _this.$data.currentPageSize,
            page: _this.$data.currentPage
        };
        if (_this.searchForm.appId !== '') {
            params.appId = _this.searchForm.appId;
        }
        if (_this.searchForm.taskId !== '') {
            params.taskId = _this.searchForm.taskId;
        }
        if (_this.searchForm.createdBy !== '') {
            params.createdBy = _this.searchForm.createdBy.trim();
        }
        if (_this.searchForm.buildStatusText !== '') { //有问题
            params.buildStatus = _this.searchForm.buildStatusText;
        }
        if (_this.searchForm.createdAtRegion !== '') {
            params.createdAtStart = _this.searchForm.createdAtRegion[0];
            params.createdAtEnd = _this.searchForm.createdAtRegion[1];
        }
        _this.listLoading = true;
        axios.get('/api/taskBuildLog/getTaskBuildLogByCriteria', {
            params: params
        }).then(function(res) {
            _this.listLoading = false;
            if (res.data.success) { 
              _this.$data.tableData = res.data.data; 
              _this.$data.tableDataLength = res.data.data.length; 
            } else { 
              _this.$message({ message: res.data.msg, type: 'error' }); 
            }

        });
    },
    handleSizeChange(val) {
        this.$data.currentPageSize = val;
        this.getUserList();
    },
    handleCurrentChange(val) {
        this.$data.currentPage = val;
        this.getUserList();
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
        const params = {
            id: _this.searchForm.appId
        };
        if(params.id!=''){
          axios.get('/api/task/getTaskListByAppId', {
              params: params
          }).then(function(res) {
              if (res.data.success) {
                  _this.searchForm.taskList = res.data.data;
                  if(_this.searchForm.taskList.length > 0){
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
    //格式化日期
    formatDate: function(row, column) {
        return moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss');
    },
    //格式化构建结果
    formatBuildStatus: function(row, column) {
        return systemParam.buildStatus.param[row.buildStatus];
    }
  }
};
</script>

<style lang="scss" scoped>
	.toolbar .el-form-item {
		margin-bottom: 10px;
	}
    .toolbar .el-input input{
        width:180px;
        display: inline-block;
    }
	.toolbar {
		background: #fff;
        padding-top:10px;
	}
</style>
