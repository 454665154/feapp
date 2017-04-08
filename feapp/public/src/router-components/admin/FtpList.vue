<template>
  <section>
    <!--工具条-->
    <el-col :span="24" class="toolbar">
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="FTP名称">
          <el-input v-model="searchKey" placeholder="请输入FTP名称"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="search">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="plus" @click="handleAdd">新增FTP</el-button>
        </el-form-item>
      </el-form>
    </el-col>

    <!--表格-->
    <template>
      <!--data按照指定数组格式传进来就会自动渲染表格数据-->
      <!--v-loading为真时，显示loading动画-->
      <el-table :data="tableData" highlight-current-row v-loading="listLoading" style="width: 100%;">
        <el-table-column type="index">
        </el-table-column>
        <el-table-column prop="name" label="名称" sortable>
        </el-table-column>
        <el-table-column prop="host" label="主机" sortable>
        </el-table-column>
        <el-table-column prop="port" label="端口" sortable>
        </el-table-column>
        <el-table-column prop="path" label="路径" sortable>
        </el-table-column>
        <el-table-column prop="username" label="用户名" sortable>
        </el-table-column>
        <el-table-column prop="password" label="密码" sortable>
        </el-table-column>
        <el-table-column prop="remark" label="备注" sortable>
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
      <el-form :model="editForm" label-width="120px" :rules="editFormRules" ref="editForm">
        <el-form-item label="名称" prop="name">
          <el-input v-model="editForm.name" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="主机" prop="host">
          <el-input v-model="editForm.host" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model="editForm.port" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="editForm.path" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="editForm.password" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" auto-complete="off"></el-input>
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
                    callback(new Error('请输入FTP名称'));
                } else {
                    axios.get('/api/ftp/isExistFtpName',{params:{ftpName:value}}).then(function(res){
                        if(!res.data.success && _this.editFormTtile!=value){
                            callback(new Error('FTP名已经存在!'));
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
                //编辑界面数据
                editForm: {
                    _id:0,
                    name: '',
                    path: '',
                    remark:'',
                    host: '',
                    port:'',
                    username:'',
                    password:''
                },
                editLoading:false,
                btnEditText:'提 交',
                editFormRules:{
                    name:[
                        { required: true, validator: exist }
                    ],
                    path:[
                        { required: true, message: '请输入路径' }
                    ],
                    host:[
                        { required: true, message: '请输入服务器地址' }
                    ],
                    username:[
                        { required: true, message: '请输入用户名' }
                    ],
                    password:[
                        { required: true, message: '请输入密码' }
                    ]
                },
                tableData:[],
                tableDataLength : 0,
                listLoading:false,
                currentPage:1,
                currentPageSize:20
            };
        },
        created:function(){
            this.getFtpList();
        },
        methods: {
            //查询
            search:function(){
                this.getFtpList(this.searchKey);
            },
            //删除记录
            handleDel:function(row){
                let _this=this;
                this.$confirm('确认删除该记录吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    _this.listLoading=true;
                    NProgress.start();
                    axios.delete(`/api/ftp/deleteFtp/${row._id}`).then(function(res){
                        _this.listLoading=false;
                        if(res.data.success){
                            _this.$message({
                                message:res.data.msg,
                                type: 'success'
                            });
                            NProgress.done();
                            _this.getFtpList();
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
            //显示编辑界面
            handleEdit:function(row){
                this.editFormVisible = true;
                this.editFormTtile = row.name;
                this.editForm.id = row._id;
                this.editForm.name = row.name;
                this.editForm.path = row.path;
                this.editForm.remark = row.remark;
                this.editForm.host = row.host;
                this.editForm.port = row.port;
                this.editForm.username = row.username;
                this.editForm.password = row.password;
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
                            let ftpData = {
                                name: _this.editForm.name,
                                path: _this.editForm.path,
                                remark: _this.editForm.remark,
                                host: _this.editForm.host,
                                port: _this.editForm.port,
                                username: _this.editForm.username,
                                password: _this.editForm.password
                            };
                            let url = _this.editForm.id?'/api/ftp/updateFtp/'+_this.editForm.id :'/api/ftp/createFtp';
                            axios.post(url,ftpData).then(function(res){
                                if(res.data.success){
                                    _this.$message({
                                        message:res.data.msg,
                                        type: 'success'
                                    });
                                    _this.editFormVisible = false;
                                    _this.getFtpList();
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
                let _this=this;
                if (this.$refs.editForm) {
                    this.$refs.editForm.resetFields(); //重置表单
                }
                this.editFormVisible = true;
                this.editFormTtile = '新增';
                this.editForm.id = '';
                this.editForm.name = '';
                this.editForm.path = '';
                this.editForm.remark = '';
                this.editForm.host = '';
                this.editForm.port = '';
                this.editForm.username = '';
                this.editForm.password = '';
            },
            //获取用户列表
            getFtpList : function(searchKey){
                let _this = this;
                let params = {
                    limit : _this.currentPageSize,
                    page : _this.currentPage
                };
                if(searchKey && searchKey!=''){
                    params.searchKey = searchKey;
                }
                _this.listLoading = true;
                axios.get('/api/ftp/getFtpListByCriteria',{params:params}).then(function(res){
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
            handleSizeChange(val) {
                this.currentPageSize = val;
                this.getFtpList();
            },
            handleCurrentChange(val) {
                this.currentPage = val;
                this.getFtpList();
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
  .el-dialog .el-input{
    width:90%;
  }
</style>
