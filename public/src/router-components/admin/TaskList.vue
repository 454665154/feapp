<template>
  <section>
    <!--工具条-->
    <el-col :span="24" class="toolbar">
      <el-form :inline="true" id="searchForm" class="demo-form-inline" @submit.prevent>
        <el-form-item label="任务名称">
          <el-input v-model="searchKey" placeholder="请输入任务名称"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="search">搜索</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="plus" @click="handleAdd">新增任务</el-button>
        </el-form-item>
      </el-form>
    </el-col>

    <!--表格-->
    <template>
      <!--data按照指定数组格式传进来就会自动渲染表格数据-->
      <!--v-loading为真时，显示loading动画-->
      <el-table :data="tableData" highlight-current-row v-loading="listLoading" style="width: 100%;">
        <el-table-column type="index" >
        </el-table-column>
        <el-table-column prop="name" label="任务名称" sortable>
        </el-table-column>
        <el-table-column prop="app.name" label="应用名称" sortable>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" :formatter="formatDate"  sortable>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template scope="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" @click="handleDel(scope.row)">删除</el-button>
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
      <el-form :model="editForm" label-width="120px" :rules="editFormRules" ref="editForm" style="width:85%;margin:0 auto;">
        <h4>基本信息</h4>
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="editForm.name" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="应用名称" prop="appId">
          <el-select v-model="editForm.appId" placeholder="请选择应用" @change="getAllBranchType">
            <el-option v-for="item in editForm.appList" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="应用分支" prop="branchType">
          <el-select v-model="editForm.branchType" placeholder="请选择分支">
            <el-option v-for="item in allBranchType" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="命令行" prop="command">
          <el-input v-model="editForm.command" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="用户权限" prop="currentUsers">
          <template>
              <el-select v-model="currentUsers" multiple placeholder="请选择" style="width:76%;">
                <el-option
                  v-for="item in editForm.users"
                  :label="item.name"
                  :value="item.id">
                </el-option>
              </el-select>
              <el-button @click="selectAllUser">所有用户</el-button>
            </template>
        </el-form-item>
        <h4>FTP</h4>
        <el-form-item label="配置信息" prop="ftpId">
          <el-select v-model="editForm.ftpId" placeholder="请选择ftp">
            <el-option v-for="item in editForm.ftp" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <h4>合包设置</h4>
        <el-form-item label="是否合包">
          <!--el-radio-group的v-model对应其子元素的label值-->
          <el-radio-group v-model="editForm.isCombinePackage">
            <el-radio class="radio" :label="true">是</el-radio>
            <el-radio class="radio" :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="后端包路径" prop="backEndPackagePath">
          <el-input v-model="editForm.backEndPackagePath" auto-complete="off"></el-input>
        </el-form-item>
        <h4>发版设置</h4>
        <el-form-item label="是否发版">
          <!--el-radio-group的v-model对应其子元素的label值-->
          <el-radio-group v-model="editForm.isPublish">
            <el-radio class="radio" :label="true">是</el-radio>
            <el-radio class="radio" :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- <el-form-item label="jog地址" prop="jobPath">
          <el-input v-model="editForm.jobPath" auto-complete="off"></el-input>
        </el-form-item> -->
        <el-form-item label="jenkins地址" prop="jenkinsPath">
          <el-input v-model="editForm.jenkinsPath" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="job名" prop="jenkinsName">
          <el-input v-model="editForm.jenkinsName" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="jenkins用户名" prop="jenkinsUsername">
          <el-input v-model="editForm.jenkinsUsername" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="jenkins密码" prop="jenkinsPassword">
          <el-input v-model="editForm.jenkinsPassword" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="job参数1">
          <el-input v-model="editForm.jobFirstParamKey" auto-complete="off" style="width:100px;"></el-input>
          <el-input v-model="editForm.jobFirstParamValue" auto-complete="off" style="width:200px;"></el-input>
        </el-form-item>
        <el-form-item label="job参数2">
          <el-input v-model="editForm.jobSecondParamKey" auto-complete="off" style="width:100px;"></el-input>
          <el-input v-model="editForm.jobSecondParamValue" auto-complete="off" style="width:200px;"></el-input>
        </el-form-item>
        <el-form-item label="job参数3">
          <el-input v-model="editForm.jobThirdParamKey" auto-complete="off" style="width:100px;"></el-input>
          <el-input v-model="editForm.jobThirdParamValue" auto-complete="off" style="width:200px;"></el-input>
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
    export default {
        data() {
            let exist = (rule, value, callback) => {
              let _this = this;
                if (value === '') {
                    callback(new Error('请输入任务名称'));
                } else {
                    axios.get('/api/task/isExistTaskName',{params:{taskName:value}}).then(function(res){
                        if(!res.data.success && _this.editFormTtile!=value){
                          callback(new Error('任务名称已经存在!'));
                        }else{
                          callback();
                        }
                    });
                }
            };
            return {
                searchKey:'', //查询字
                editFormVisible:false,//编辑界面显是否显示
                editFormTtile:'编辑',//编辑界面标题
                currentUsers:[],
                allBranchType:[],
                //编辑界面数据
                editForm: {
                    _id:0,
                    name: '',
                    remark:'',
                    branchType: '',
                    command:'',
                    ftp:[],
                    ftpId:'',
                    isCombinePackage:false,
                    backEndPackagePath:'',
                    isPublish:false,
                    jobPath:'',
                    jenkinsPath:'',
                    jenkinsName:'',
                    jenkinsUsername:'',
                    jenkinsPassword:'',
                    appList:[],
                    users:[],
                    jobFirstParamKey:'',
                    jobFirstParamValue:'',
                    jobSecondParamKey:'',
                    jobSecondParamValue:'',
                    jobThirdParamKey:'',
                    jobThirdParamValue:'',
                    appId:''
                },
                editLoading:false,
                btnEditText:'保 存',
                editFormRules:{
                    name:[
                        {  required: true, validator: exist }
                    ],
                    app:[
                        { required: true, message: '请选择应用' }
                    ],
                    branchType:[
                        { required: true, message: '请选择分支' }
                    ],
                    ftpId:[
                        { required: true, message: '请选择ftp配置' }
                    ],
                    jenkinsPath:[
                        { required: true, message: '请输入jenkins地址' }
                    ],
                    jenkinsName:[
                        { required: true, message: '请输入job名' }
                    ],
                    jenkinsUsername:[
                        { required: true, message: '请输入jenkins用户名' }
                    ],
                    jenkinsPassword:[
                        { required: true, message: '请输入jenkins密码' }
                    ],
                    cli:[
                        { required: true, message: '请输入命令行' }
                    ]
                },
                tableData:[],
                tableDataLength : 0,
                listLoading:false,
                currentPage:1,
                currentPageSize:20,
                isSelectAllUser:false
            };
        },
        created:function(){
            this.getTaskList();
            this.getAppList();
            this.getFtpList();
            this.getUserList();
        },
        methods: {
            //查询
            search:function(){
                this.getTaskList(this.searchKey);
                return false;
            },
            //格式化日期
            formatDate: function(row, column) {
                return moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss');
            },
            //获取所有分支类型
            getAllBranchType:function(){
              let _this = this;
              let params = {appId:_this.editForm.appId};
              axios.get(`/api/task/getAllBranchTypeByAppId`,{params:params}).then(function(res){
                  if(res.data.success){
                    console.log(res.data.data);
                    _this.allBranchType = res.data.data;
                  }else{
                    _this.$message({
                        message:res.data.msg,
                        type: 'error'
                    });
                  }
              })
            },
            //删除记录
            handleDel:function(row){
                let _this=this;
                this.$confirm('确认删除该记录吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    _this.listLoading=true;
                    NProgress.start();
                    axios.delete(`/api/task/deleteTask/${row._id}`).then(function(res){
                        if(res.data.success){
                            _this.$message({
                                message:res.data.msg,
                                type: 'success'
                            });
                            _this.listLoading=false;
                            NProgress.done();
                            _this.getTaskList();
                        }else{
                            _this.$message({
                                message:res.data.msg,
                                type: 'error'
                            });
                        }
                    });
                }).catch(() => {

                });
            },
            selectAllUser:function(){ //全选、反选所有用户
              this.isSelectAllUser = false;
              if(this.currentUsers.length == this.editForm.users.length){
                this.isSelectAllUser = true;
              }
              this.isSelectAllUser = !this.isSelectAllUser;
              let users = [];
              this.editForm.users.forEach(function(item){
                users.push(item.id);
              });
              this.currentUsers = this.isSelectAllUser ? users :[];
            },
            //显示编辑界面
            handleEdit:function(row){
              let _this = this;
              _this.editFormVisible = true;
              _this.editFormTtile = row.name;
              _this.editForm.id = row._id;
              _this.editForm.name = row.name;
              _this.editForm.remark = row.remark;
              _this.editForm.appId = row.app._id;
              _this.editForm.branchType = row.branchType;
              _this.editForm.command = row.command;
              _this.editForm.ftpId = row.ftp._id;
              _this.editForm.isCombinePackage = row.isCombinePackage;
              _this.editForm.isPublish = row.isPublish;
              _this.editForm.backEndPackagePath = row.backEndPackagePath;
              _this.editForm.jenkinsPath = row.jenkinsPath;
              _this.editForm.jenkinsName = row.jenkinsName;
              _this.editForm.jenkinsUsername = row.jenkinsUsername;
              _this.editForm.jenkinsPassword = row.jenkinsPassword;
              _this.editForm.jobFirstParamKey = row.jobFirstParamKey;
              _this.editForm.jobFirstParamValue = row.jobFirstParamValue;
              _this.editForm.jobSecondParamKey = row.jobSecondParamKey;
              _this.editForm.jobSecondParamValue = row.jobSecondParamValue;
              _this.editForm.jobThirdParamKey = row.jobThirdParamKey;
              _this.editForm.jobThirdParamValue = row.jobThirdParamValue;
              
              _this.getAllBranchType();

              let url = '/api/usertaskmap/getUserListByTaskId';
              let params = {taskId:row._id};
              axios.get(url,{params:params}).then(function(res){
                if(res.data.success){
                  _this.currentUsers = [];
                  res.data.data.forEach(function(item){
                    _this.currentUsers.push(item.user._id);
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
                _this.$refs.editForm.validate((valid)=>{
                    if(valid){
                        _this.$confirm('确认提交吗？','提示',{}).then(()=>{
                            _this.editLoading=true;
                            NProgress.start();
                            _this.btnEditText='提交中';
                            let userData = {
                                name: _this.editForm.name,
                                remark: _this.editForm.remark,
                                branchType: _this.editForm.branchType,
                                app: _this.editForm.appId,
                                ftp: _this.editForm.ftpId,
                                command: _this.editForm.command,
                                isCombinePackage: _this.editForm.isCombinePackage,
                                backEndPackagePath: _this.editForm.backEndPackagePath,
                                isPublish: _this.editForm.isPublish,
                                jenkinsPath: _this.editForm.jenkinsPath,
                                jenkinsName: _this.editForm.jenkinsName,
                                jenkinsUsername: _this.editForm.jenkinsUsername,
                                jenkinsPassword: _this.editForm.jenkinsPassword,
                                currentUsers: _this.currentUsers,
                                jobFirstParamKey: _this.editForm.jobFirstParamKey,
                                jobFirstParamValue: _this.editForm.jobFirstParamValue,
                                jobSecondParamKey: _this.editForm.jobSecondParamKey,
                                jobSecondParamValue: _this.editForm.jobSecondParamValue,
                                jobThirdParamKey: _this.editForm.jobThirdParamKey,
                                jobThirdParamValue: _this.editForm.jobThirdParamValue
                            };
                            let url = _this.editForm.id?'/api/task/updateTask/'+_this.editForm.id :'/api/task/createTask';
                            axios.post(url,userData).then(function(res){
                                if(res.data.success){
                                    _this.$message({
                                        message:res.data.msg,
                                        type: 'success'
                                    });
                                    _this.editFormVisible = false;
                                    _this.getTaskList();
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
                    }
                });

            },
            //显示新增界面
            handleAdd:function(){
                if (this.$refs.editForm) {
                    this.$refs.editForm.resetFields(); //重置表单
                }
                this.editFormVisible = true;
                this.editFormTtile = '新增任务';
                this.editForm.id = '';
                this.editForm.name = '';
                this.editForm.remark = '';
                this.editForm.appId = '';
                this.editForm.branchType = '';
                this.editForm.command = '';
                this.editForm.ftpId = '';
                this.editForm.isCombinePackage = false;
                this.editForm.backEndPackagePath = '';
                this.editForm.isPublish = false;
                this.editForm.jenkinsPath = '';
                this.editForm.jenkinsName = '';
                this.editForm.jenkinsUsername = '';
                this.editForm.jenkinsPassword = '';
                this.editForm.jobFirstParamKey = '';
                this.editForm.jobFirstParamValue = '';
                this.editForm.jobSecondParamKey = '';
                this.editForm.jobSecondParamValue = '';
                this.editForm.jobThirdParamKey = '';
                this.editForm.jobThirdParamValue = '';
            },
            //获取用户列表
            getTaskList : function(searchKey){
              let _this = this;
              let params = {
                  limit : _this.currentPageSize,
                  page : _this.currentPage
              };
              if(searchKey && searchKey!=''){
                  params.searchKey = searchKey;
              }
              
              _this.listLoading = true;
              axios.get('/api/task/getTaskListByCriteria',{params:params}).then(function(res){
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
            //从app表里获取所有应用
            getAppList:function(){
              let _this = this;
              axios.get('/api/app/getAppListByCriteria').then(function(res){ 
                if(res.data.success){
                  res.data.data.forEach(function(item,i){
                    _this.editForm.appList.push({"name":item.name,"id":item._id});
                  });
                }else{
                  _this.$message({
                      message:res.data.msg,
                      type: 'error'
                  });
                }
              });
            },
            //从ftp表里获取所有ftp
            getFtpList:function(){
              let _this = this;
              axios.get('/api/ftp/getFtpListByCriteria').then(function(res){ 
                if(res.data.success){
                  res.data.data.forEach(function(item,i){
                    _this.editForm.ftp.push({"name":item.name,"id":item._id});
                  });
                }else{
                  _this.$message({
                      message:res.data.msg,
                      type: 'error'
                  });
                }
              });
            },
            //从user表里获取所有用户
            getUserList:function(){
              let _this = this;
              axios.get('/api/user/getAllUserList').then(function(res){ 
                if(res.data.success){
                  res.data.data.forEach(function(item){
                    _this.editForm.users.push({name:item.username,id:item._id});
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
                this.getTaskList();
            },
            handleCurrentChange(val) {
                this.currentPage = val;
                this.getTaskList();
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
    width:90%;
  }
  .el-dialog .el-input{
    width:90%;
  }
</style>
