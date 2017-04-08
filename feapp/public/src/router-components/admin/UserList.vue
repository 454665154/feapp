<template>
  <section>
    <!--工具条-->
    <el-col :span="24" class="toolbar">
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="用户名">
          <el-input v-model="searchKey" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="search">查询</el-button>
        </el-form-item>
      </el-form>
    </el-col>

    <!--表格-->
    <template>
      <!--data按照指定数组格式传进来就会自动渲染表格数据-->
      <!--v-loading为真时，显示loading动画-->
      <el-table :data="tableData" highlight-current-row v-loading="listLoading" style="width: 100%;">
        <el-table-column prop="username" label="用户名" sortable>
        </el-table-column>
        <el-table-column prop="role" label="角色" :formatter="formatRole" sortable>
        </el-table-column>
        <el-table-column width="200px" label="操作">
            <template scope="scope">
                <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            </template>
        </el-table-column>
      </el-table>
    </template>

    <!--分页-->
    <el-col :span="24" class="toolbar" style="padding-bottom:10px;">
      <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[20, 40, 100]"
            :page-size="currentPageSize"
            layout="total, sizes, prev, pager, next, jumper"
      :total="tableDataLength"
            style="float:right">
      </el-pagination>
    </el-col>

    <!--编辑模态框-->
    <!--el-dialog的v-model绑定一个boolean值，表示显示或者隐藏-->
    <el-dialog :title="editFormTtile" v-model="editFormVisible" :close-on-click-modal="true">
      <el-form :model="editForm" label-width="120px" :rules="editFormRules" ref="editForm">
        <el-form-item label="用户名" prop="username">
          {{editForm.username}}
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editForm.roleText" placeholder="请选择角色">
            <el-option v-for="(label, value) in editForm.role" :label="label" :value="value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="任务分配" prop="currentTasks">
            <template>
              <el-select v-model="currentTasks" multiple placeholder="请选择">
                <el-option
                  v-for="item in editForm.allTasks"
                  :label="item.name"
                  :value="item.id">
                </el-option>
              </el-select>
            </template>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="editSubmit" :loading="editLoading">{{btnEditText}}</el-button>
      </div>
    </el-dialog>
  </section>
</template>

<script>
    import NProgress from 'nprogress';
    import axios from 'axios';
    import moment from 'moment';
    import util from '../../../../utils/util';
    const systemParam = util.getSystemParam();

    export default {
        data() {
            return {
                searchKey:'', //查询字段
                currentTasks: [], //当前用户绑定的任务
                editFormVisible:false,//编辑界面显是否显示
                editFormTtile:'编辑',//编辑界面标题
                //编辑界面数据
                editForm: {
                    _id:0,
                    username: '',
                    department:'',
                    position:'',
                    token:'',
                    role:systemParam.userRole.param,
                    roleText:'',
                    allTasks:[]
                },
                editLoading:false,
                btnEditText:'提 交',
                editFormRules:{
                    
                },
                tableData:[],
                tableDataLength : 0,
                listLoading:false,
                currentPage:1,
                currentPageSize:20
            };
        },
        created:function(){
            this.getUserList();
            this.getTaskList();
        },
        methods: {
            //查询
            search:function(){
                this.getUserList(this.searchKey.trim());
            },
            //格式化权限
            formatRole: function(row, column) {
                return systemParam.userRole.param[row.role];
            },
            //显示编辑界面
            handleEdit:function(row){
                let _this = this;
                _this.editFormVisible = true;
                _this.editFormTtile = '编辑';
                _this.editFormTtile = row.username;
                _this.editForm.id = row._id;
                _this.editForm.roleText = row.role;
                _this.editForm.username = row.username;

                let url = '/api/usertaskmap/getTaskListByUserId';
                let params = {userId:row._id};
                axios.get(url,{params:params}).then(function(res){
                  if(res.data.success){
                    _this.currentTasks = [];
                    res.data.data.forEach(function(item){
                      _this.currentTasks.push(item.task._id);
                    });
                  }else{
                    _this.$message({
                        message:res.data.msg,
                        type: 'error'
                    });
                  }
                });
            },
            //编辑 or 新增
            editSubmit:function(){
                let _this=this;
                
                _this.$confirm('确认提交吗？','提示',{}).then(()=>{
                    _this.editLoading=true;
                    NProgress.start();
                    _this.btnEditText='提交中';
                    let userData = {
                        username: _this.editForm.username,
                        role: _this.editForm.roleText,
                        currentTasks: _this.currentTasks
                    };
                    let url = _this.editForm.id?'/api/user/updateUser/'+_this.editForm.id:'/api/user/createUser';
                    axios.post(url,userData).then(function(res){
                        if(res.data.success){
                            _this.$message({
                                message:res.data.msg,
                                type: 'success'
                            });
                            _this.editFormVisible = false;
                            _this.getUserList();
                        }else{
                            _this.$message({
                                message:res.data.msg,
                                type: 'error'
                            });
                        }
                        _this.btnEditText='提 交';
                        _this.editLoading=false;
                        NProgress.done();
                    });
                });
            },
            //获取用户列表
            getUserList : function(searchKey){
                let _this = this;
                let params = {
                    limit : _this.currentPageSize,
                    page : _this.currentPage
                };
                if(searchKey && searchKey!=''){
                    params.searchKey = searchKey;
                }
                _this.listLoading = true;
                axios.get('/api/user/getUserListByCriteria',{params:params}).then(function(res){
                  _this.listLoading = false;
                  if(res.data.success){
                    _this.tableData = res.data.data;
                    _this.tableDataLength = res.data.meta.count; 
                  }else{
                    _this.$message({
                        message:res.data.msg,
                        type: 'error'
                    });
                  }
                });
            },
            //从task表里获取所有任务
            getTaskList:function(){
              let _this = this;
              axios.get('/api/task/getAllTaskList').then(function(res){ 
                if(res.data.success){
                  res.data.data.forEach(function(item,i){
                    _this.editForm.allTasks.push({name:item.name,id:item._id});
                  });
                }else{
                  _this.$message({
                      message:res.data.msg,
                      type: 'error'
                  });
                }
              });
            },
            handleSizeChange(val) {
                this.currentPageSize = val;
                this.getUserList();
            },
            handleCurrentChange(val) {
                this.currentPage = val;
                this.getUserList();
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
        padding-top:10px;
  }
  .el-select{
    width:70%;
  }
  .my-autocomplete {
      li {
        line-height: normal;
        padding: 7px;

        .name {
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .addr {
          font-size: 12px;
          color: #b4b4b4;
        }

        .highlighted .addr {
          color: #ddd;
        }
      }
  }
  .el-dialog .el-input{
    width:90%;
  }
</style>
