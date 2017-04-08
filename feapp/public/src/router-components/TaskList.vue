<template>
	<section>
		<!--工具条-->
		<el-col :span="24" class="toolbar">
			<el-form :inline="true" :model="formInline" class="demo-form-inline">
				<el-form-item label="任务名称">
					<el-input v-model="searchKey" placeholder="请输入任务名称"></el-input>
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
				<el-table-column type="index">
				</el-table-column>
				<el-table-column prop="name" label="任务名称" sortable>
				</el-table-column>
				<el-table-column prop="app.name" label="应用名称" sortable>
				</el-table-column>
                <el-table-column prop="app.remark" label="备注" sortable>
                </el-table-column>
				<el-table-column label="操作" width="100">
					<template scope="scope">
                        <el-button type="text" size="small" @click="showBuild(scope.row)">构建</el-button>
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
            :page-sizes="[ 20, 40, 100]"
            :page-size="currentPageSize"
            layout="total, sizes, prev, pager, next, jumper"
			:total="tableDataLength"
            style="float:right">
			</el-pagination>
		</el-col>

        <el-dialog :title="buildTaskTitle" v-model="editFormVisible" :close-on-click-modal="false">
        <el-form :model="editForm" label-width="120px" :rules="editFormRules" ref="editForm">
            <el-form-item label="项目目录">
                <el-select v-model="editForm.projectName" prop="editForm.projectName" placeholder="请选择目录" @change="getTagVersions">
                    <el-option v-for="item in project" :label="item" :value="item"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="请选择tag" v-show="editForm.branchType=='tag'&&editForm.projectName!=='all project'">
                <el-select v-model="editForm.tagVersion" prop="editForm.tagVersion" placeholder="请选择tag版本">
                    <el-option v-for="tag in tagVersionList" :label="tag" :value="tag"></el-option>
                </el-select>
            </el-form-item>
            <!-- <el-form-item label="Tag版本号" v-show="editForm.branchType=='tag'">
                <el-input v-model="editForm.tagVersion" ></el-input>
            </el-form-item> -->
            <el-form-item label="后端版本号" v-show="editForm.isCombinePackage==true">
                <el-input v-model="editForm.backEndVersion"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleBuild" style="padding:10px 40px;">构建</el-button>
            </el-form-item>
            <el-form-item v-show="isLoading==true">
                <img src="../assets/load.gif" alt="" style="">
            </el-form-item>
            <el-form-item v-show="isLoading==false">
                {{buildResult}}
            </el-form-item>
        </el-form>
        </el-dialog>
	</section>
</template>


<script>
    // import io from 'socket.io-client/dist/socket.io.js'
    // const socket = io();
    import axios from 'axios';
    import moment from 'moment';
    export default {
        data() {
            return {
                buildResult:'',
                searchKey:'', //查询字
                formInline: {
                    user: ''
                },
                isLoading:false,
                editFormVisible:false,//构建界面显是否显示
                buildTaskTitle:'',//构建界面标题
                project:[],//项目目录
                tagVersionList:[],//当前项目的tag版本
                //编辑界面数据
                editForm: {
                    _id:0,
                    name: '',
                    appName:'',
                    projectName:'',
                    tagVersion:'',
                    backEndVersion:'',
                    isCombinePackage:false,
                    branchType:'',
                    endVersion:'',
                    appId:'',
                    taskId:'',
                    taskCommand:''
                },
                btnEditText:'提 交',
                editFormRules:{},
                tableData:[],
                tableDataLength : 0,
                listLoading:false,
                currentPage:1,
                currentPageSize:20
            };
        },
        created:function(){
            this.getTaskList();
        },
        methods: {
            //查询
            search:function(){
                this.getTaskList(this.searchKey);
            },
            //如果当前任务为tag的任务时，获取项目下所有的tag版本
            getTagVersions:function(){
                let _this = this;
                let branchType = _this.editForm.branchType;
                if(branchType==='tag' && _this.editForm.projectName!=='all project'){
                    let taskId = _this.editForm.taskId;
                    let projectName = _this.editForm.projectName;
                    axios.get('/api/task/getTagVersion',{params:{taskId:taskId,projectName:projectName}}).then(function(res){
                        if(res.data.success){
                            _this.tagVersionList = res.data.data;
                        }else{
                            _this.$message({
                                message:res.data.msg,
                                type: 'error'
                            });
                        }
                    });
                }
            },
            //初始化构建任务
            showBuild:function(row){
                const _this = this;
                //显示构建弹窗
                _this.editFormVisible = true;
                _this.buildTaskTitle = '构建任务：'+row.name;
                _this.editForm.branchType = row.branchType;
                _this.editForm.projectName = '';
                _this.editForm.name = row.name;
                _this.editForm.appName = row.app.name;
                _this.editForm.isCombinePackage = row.isCombinePackage;
                _this.editForm.appId = row.app._id;
                _this.editForm.taskId = row._id;
                _this.editForm.command = row.command;
                //获取当前任务的所有项目
                _this.project = [];
                axios.get('/api/task/getProject',{params:{taskId:row._id,path:row.app.name}}).then(function(res){
                    if(res.data.success){
                        _this.project = res.data.data;
                        _this.project.push('all project');
                    }else{
                        _this.$message({
                            message:res.data.msg,
                            type: 'error'
                        });
                    }
                });
            },
            //构建任务
            handleBuild:function(){
                const _this = this;
                _this.isLoading = true;
                //获取配置信息并创建任务目录
                //用户名密码，后期加入
                //getUserInfo();
                //创建任务目录 (/app/feapp/channel-web-uat-trunk)
                
                let params = {
                    taskId: _this.editForm.taskId,
                    tagVersion:_this.editForm.tagVersion,
                    projectName: _this.editForm.projectName,
                    backEndVersion: _this.editForm.backEndVersion,
                    createdBy: '',
                    buildStatus:''
                };
                
                axios.post('/api/task/goBuild/',params).then(function(res){
                    if(res.data.success){
                        _this.isLoading = false;
                        _this.buildResult = res.data.msg;
                    }else{
                        _this.isLoading = false;
                        _this.buildResult = res.data.msg;
                    }
                });
            },
            //获取用户列表
            getTaskList : function(searchKey){
                const _this = this;
                const params = {
                    limit : _this.currentPageSize,
                    page : _this.currentPage
                };
                if(searchKey && searchKey!=''){
                    params.searchKey = searchKey;
                }
                
                axios.get('/api/task/getTaskListByCriteria',{params:params}).then(function(res){
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
    .el-dialog .el-input,.el-dialog .el-select{
        width:40%;
    }
</style>
