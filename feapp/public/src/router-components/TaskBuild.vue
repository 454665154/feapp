<template>
    <section>
    <el-tabs v-model="activeName2" type="card" @tab-click="handleClick">
      <el-tab-pane label="构建任务" name="first">
        <el-form ref="form" :model="form" label-width="140px">
          <el-form-item label="项目目录">
            <el-select v-model="form.region" prop="region" placeholder="请选择目录">
              <el-option v-for="item in form.project" :label="item" :value="item"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="版本号" v-show="currentTask.appOfBranch=='tag'">
            <el-input v-model="form.name"></el-input>
          </el-form-item>

          <el-form-item label="后端版本号" v-show="currentTask.combine">
            <el-input v-model="form.name"></el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="onSubmit" style="padding:10px 40px;">构建</el-button>
          </el-form-item>
          <el-form-item v-show="isLoad==true">
            <img src="../assets/load.gif" alt="" style="">
          </el-form-item>
        </el-form>

      </el-tab-pane>
      <el-tab-pane label="日志" name="second">
        <el-table :data="tableData" highlight-current-row v-loading="listLoading">
          <el-table-column type="index">
          </el-table-column>
          <el-table-column prop="name" label="任务名称" sortable>
          </el-table-column>
          <el-table-column prop="sex" label="应用名称" sortable>
          </el-table-column>
                  <el-table-column prop="notes" label="备注" sortable>
                  </el-table-column>
          <el-table-column prop="age" label="最后构建人" sortable>
          </el-table-column>
          <el-table-column prop="" label="最后构建时间" sortable>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template scope="scope">
              <el-button type="text" size="small" @click="detail(scope.row)">查看详情</el-button>
            </template>
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

      </el-tab-pane>
    </el-tabs>
    </section>
</template>

<script>
  import axios from 'axios'
  export default {
    data() {
      return {
        isLoad:false,
        activeName: 'first',
        form: {
          project:[],
          name: '',
          region: '',
          date1: '',
          date2: '',
          delivery: false,
          type: [],
          resource: '',
          desc: ''
        },
        activeName2:'',
        tableData:[],
        tableDataLength : 0,
        listLoading:false,
        currentPage:1,
        currentPageSize:10,
        currentTaskId:'',
        currentTask:{}
      }
    },
    created:function(){
      this.initPage(); //获取当前任务信息
    },
    methods: {
      initPage:function(){
        var vm = this;
        var taskId = window.location.href.split('task/taskBuild/')[1].split('/')[0];
        vm.currentTaskId = taskId;
        var params = {id:taskId};

        axios.get('/api/taskDetail',{params:params}).then(function(res){
          vm.currentTask= res.data.data;
          vm.$emit('getProject',res.data.data);
        })

        vm.$on('getProject',function(task){ //获取项目名
          // var page = vm.currentTask.appOfBranch=="master" ? "trunk" : vm.currentTask.appOfBranch; //分支
          var page = 'trunk';
          var path = vm.currentTask.appName; //应用名
          axios.get('/api/getProject',{params:{page:page,path:path}}).then(function(res){
            vm.form.project = res.data.data.split('/');
            vm.form.project.pop();
            vm.form.project.push('all project');
          });
        })
      },
      handleClick(tab, event) {
        console.log(tab, event);
      },
      handleSizeChange(val) {
          this.$data.currentPageSize = val;
          this.getUserList();
      },
      handleCurrentChange(val) {
          this.$data.currentPage = val;
          this.getUserList();
      },
      onSubmit() {
        var vm = this;
        vm.isLoad = true;
        axios.get('/api/connection',{params:{taskDir:vm.currentTask.name}}).then(function(res){
          console.log('cccccccccccccccccccccconnection---')
        })
      }
    }
  }
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
    .el-input{
        width:217px;
    }
</style>
