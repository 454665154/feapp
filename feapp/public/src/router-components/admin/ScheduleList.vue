<template>
    <section>
        <el-col :span="24" class="toolbar">
            <el-form :inline="true" class="demo-form-inline">
                <el-form-item>
                    <el-button type="primary" icon="plus" @click="">新增</el-button>
                </el-form-item>
            </el-form>
        </el-col>
        <el-table highlight-current-row v-loading="listLoading" :data="tableData" style="width: 100%;">
            <el-table-column prop="name" label="调度名称">
            </el-table-column>
            <el-table-column prop="type" label="调度类型">
            </el-table-column>
            <el-table-column prop="cronExpression" label="Cron表达式">
            </el-table-column>
            <el-table-column prop="remark" label="备注">
            </el-table-column>
            <el-table-column prop="createdBy" label="创建人">
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间">
            </el-table-column>
            <el-table-column label="操作" width="100">
                <template scope="scope">
                    <el-button type="text" size="small" @click="">删除</el-button>
                    <el-button type="text" size="small" @click="">编辑</el-button>
                    <el-button type="text" size="small" @click="">查看日志</el-button>
                </template>
            </el-table-column>
        </el-table>
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
                listLoading: false,
                tableDataLength: 0,
                tableData: [],
                tableMeta: {}
            };
        },
        created() {

        },
        methods: {

        }
};
</script>
<style lang="scss" scoped>
.toolbar {
    background: #fff;
    padding-top: 10px;
}
</style>
