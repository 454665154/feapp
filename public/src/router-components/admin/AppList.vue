<template>
  <section>
    <!--工具条-->
    <el-col :span="24" class="toolbar">
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="应用名称">
          <el-input v-model="searchKey" placeholder="请输入应用名称"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="search">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="plus" @click="handleAdd">新增应用</el-button>
        </el-form-item>
      </el-form>
    </el-col>

    <!--表格-->
    <template>
      <!--data按照指定数组格式传进来就会自动渲染表格数据-->
      <!--v-loading为真时，显示loading动画-->
      <el-table :data="tableData" highlight-current-row v-loading="listLoading" style="width: 100%;">
        <el-table-column type="index" width="60">
        </el-table-column>
        <el-table-column prop="name" label="应用名称" sortable>
        </el-table-column>
        <el-table-column prop="vcsType" label="版本管理" :formatter="formatVcsType" sortable>
        </el-table-column>
        <el-table-column prop="masterPath" label="Master地址" sortable>
        </el-table-column>
        <el-table-column prop="branchPath" label="Branch地址" sortable>
        </el-table-column>
        <el-table-column prop="tagPath" label="Tag地址" sortable>
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
        <el-form-item label="应用名称" prop="name">
          <el-input v-model="editForm.name" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="版本管理" prop="vcsType">
          <el-select v-model="editForm.vcsTypeText" placeholder="请选择版本管理">
            <el-option v-for="(label, value) in editForm.vcsType" :label="label" :value="value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Master地址" prop="masterPath">
          <el-input v-model="editForm.masterPath" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="Branch地址" prop="branchPath">
          <el-input v-model="editForm.branchPath" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="Tag地址" prop="tagPath">
          <el-input v-model="editForm.tagPath" auto-complete="off"></el-input>
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
    import util from '../../../../utils/util';
    const systemParam = util.getSystemParam();
    export default {
        data() {
            let exist = (rule, value, callback) => {
                let _this = this;
                if (value === '') {
                    callback(new Error('请输入应用名称'));
                } else {
                    axios.get('/api/app/isExistAppName',{params:{appName:value}}).then(function(res){
                        if(!res.data.success && _this.editFormTtile!=value){
                            callback(new Error('应用名称已经存在!'));
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
                    vcsType: '',
                    vcsTypeText:'',
                    remark:'',
                    masterPath: '',
                    branchPath:'',
                    tagPath:''
                },
                editLoading:false,
                btnEditText:'提 交',
                editFormRules:{
                    name:[
                        {  required: true, validator: exist }
                    ],
                    masterPath:[
                        { required: true, message: '请输入master地址' }
                    ],
                    vcsType:[
                        { required: true, message: '请选择版本管理' }
                    ],
                    tagPath:[
                        { required: true, message: '请输入tag地址' }
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
            this.getAppList();
        },
        methods: {
            //查询
            search:function(){
                this.getAppList(this.searchKey);
            },
            //格式化权限
            formatVcsType: function(row, column) {
                return systemParam.vcsType.param[row.vcsType];
            },
            //删除记录
            handleDel:function(row){
                let _this=this;
                this.$confirm('确认删除该记录吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    _this.listLoading=true;
                    NProgress.start();
                    axios.delete(`/api/app/deleteApp/${row._id}`).then(function(res){
                        _this.listLoading=false;
                        if(res.data.success){
                            _this.$message({
                                message:res.data.msg,
                                type: 'success'
                            });
                            NProgress.done();
                            _this.getAppList();
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
                this.editForm.vcsType = systemParam.vcsType.param;
                this.editForm.vcsTypeText = row.vcsType;
                this.editForm.remark = row.remark;
                this.editForm.masterPath = row.masterPath;
                this.editForm.branchPath = row.branchPath;
                this.editForm.tagPath = row.tagPath;
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
                                vcsType: _this.editForm.vcsTypeText,
                                remark: _this.editForm.remark,
                                masterPath: _this.editForm.masterPath,
                                branchPath: _this.editForm.branchPath,
                                tagPath: _this.editForm.tagPath
                            };
                            let url = _this.editForm.id?'/api/app/updateApp/'+_this.editForm.id :'/api/app/createApp';
                            axios.post(url,ftpData).then(function(res){
                                if(res.data.success){
                                    _this.$message({
                                        message:res.data.msg,
                                        type: 'success'
                                    });
                                    _this.editFormVisible = false;
                                    _this.getAppList();
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
                this.editFormTtile = '新增';
                this.editForm.name = '';
                this.editForm.id = '';
                this.editForm.vcsType = systemParam.vcsType.param;
                this.editForm.remark = '';
                this.editForm.masterPath = '';
                this.editForm.branchPath = '';
                this.editForm.tagPath = '';
            },
            //获取用户列表
            getAppList : function(searchKey){
                let _this = this;
                let params = {
                    limit : _this.currentPageSize,
                    page : _this.currentPage
                };
                _this.listLoading = true;
                if(searchKey && searchKey!=''){
                    params.searchKey = searchKey;
                }
                axios.get('/api/app/getAppListByCriteria',{params:params}).then(function(res){
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
                this.$data.currentPageSize = val;
                this.getAppList();
            },
            handleCurrentChange(val) {
                this.$data.currentPage = val;
                this.getAppList();
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
