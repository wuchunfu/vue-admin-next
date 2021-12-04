<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入名称"
          clearable
          size="small"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="状态"
          clearable
          size="small"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          size="mini"
          @click="handleQuery"
        >
          <el-icon>
            <elementSearch/>
          </el-icon>
          搜索
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button
          size="mini"
          @click="resetQuery"
        >
          <el-icon>
            <elementRefresh/>
          </el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          size="mini"
          @click="handleAdd"
        >
          <el-icon>
            <elementFolderAdd/>
          </el-icon>
          新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          size="mini"
          :disabled="single"
          @click="handleUpdate"
        >
          <el-icon>
            <elementEdit/>
          </el-icon>
          修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
        >
          <el-icon>
            <elementDelete/>
          </el-icon>
          批量删除
        </el-button>
      </el-col>
    </el-row>

    <el-table
      v-loading="loading"
      :data="tableList"
      border
      fit
      highlight-current-row
      element-loading-text="Loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        type="selection"
        width="55"
        align="center"
      />
      <el-table-column
        label="名称"
        align="center"
        prop="name"
      />
      <el-table-column
        label="状态"
        align="center"
        prop="status"
        :formatter="statusFormat"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
      >
        <template v-slot="scope">
          <span>{{ scope.row.createTime }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template v-slot="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
          >
            修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :hide-on-single-page="false"
      :current-page="queryParams.page"
      :page-sizes="[10, 20, 50, 100, 200]"
      :page-size="queryParams.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      background
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
    </el-pagination>

    <!-- 添加或修改岗位对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="typeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称"/>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="form.status"
            placeholder="状态"
            clearable
            size="small"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" size="small" @click="submitForm">确定</el-button>
          <el-button size="small" @click="cancel">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { deleteById, getById, getList, save, update } from "/@/api/table";
import { ElMessageBox, ElNotification } from 'element-plus';

export default {
  name: 'tableList',
  setup() {
    const dataList: any = reactive({
      // 遮罩层
      loading: true,
      // 导出遮罩层
      exportLoading: false,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      tableList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 状态数据字典
      statusOptions: [],
      // 查询参数
      queryParams: {
        page: 1,
        pageSize: 10,
        name: undefined,
        status: undefined
      },
      // 表单参数
      form: {},
      queryFormRef: ref(null),
      typeFormRef: ref(null),
      // 表单校验
      rules: {
        name: [
          { required: true, message: "名称不能为空", trigger: "blur" }
        ]
      }
    });

    // 页面加载时
    onMounted(() => {
      console.log(111)

      getDataList();
      dataList.statusOptions = [
        {
          "label": "published",
          "value": 0,
        },
        {
          "label": "draft",
          "value": 1,
        },
        {
          "label": "deleted",
          "value": 2,
        }
      ]
    });

    // 查询列表
    const getDataList = () => {
      dataList.loading = true;
      const params = {
        page: dataList.queryParams.page,
        pageSize: dataList.queryParams.pageSize,
        name: dataList.queryParams.name,
        status: dataList.queryParams.status,
      }
      getList(params).then((res: any) => {
        console.log(res)
        if (res.code === 200) {
          dataList.tableList = res.data.list;
          dataList.total = res.data.total;
        }
        dataList.loading = false;
      }).catch(error => {
        console.log(error)
      });
    }

    const handleSizeChange = (val: any) => {
      console.log(`每页 ${ val } 条`)
      dataList.pageSize = val
    }
    const handleCurrentChange = (val: any) => {
      console.log(`当前页: ${ val }`)
      dataList.page = val
    }

    // 状态
    const statusFormat = (row: any) => {
      const data = dataList.statusOptions
      const value = row.status
      let actions: any[] = [];
      Object.keys(data).some((key) => {
        if (data[key].label == ('' + value)) {
          actions.push(data[key].label);
          return true;
        }
      })
      return actions.join('');
    }

    // 表单重置
    const reset = () => {
      dataList.form = {
        id: undefined,
        name: '',
        status: 0,
        remark: ''
      };
      dataList.typeFormRef?.resetFields()
    }

    // 取消按钮
    const cancel = () => {
      dataList.open = false;
      reset();
    }

    // 搜索按钮操作
    const handleQuery = () => {
      dataList.queryParams.page = 1;
      getDataList();
    }

    // 重置按钮操作
    const resetQuery = () => {
      dataList.queryFormRef?.resetFields()
      handleQuery();
    }

    // 多选框选中数据
    const handleSelectionChange = (selection: any) => {
      dataList.ids = selection.map((item: any) => item.id)
      dataList.single = selection.length != 1
      dataList.multiple = !selection.length
    }

    // 提交按钮操作
    const submitForm = () => {
      dataList.typeFormRef?.validate((valid: boolean) => {
        if (valid) {
          if (dataList.form.id != undefined) {
            update(dataList.form).then((res: any) => {
              // console.log(res)
              if (res.code === 200) {
                ElNotification({
                  type: 'success',
                  showClose: true,
                  duration: 3000,
                  offset: 100,
                  title: "更新",
                  message: "更新成功"
                });
                getDataList();
              } else {
                ElNotification({
                  type: 'error',
                  showClose: true,
                  duration: 3000,
                  offset: 100,
                  title: "更新",
                  message: "更新失败"
                });
              }
              dataList.open = false;
            });
          } else {
            save(dataList.form).then((res: any) => {
              if (res.code === 200) {
                ElNotification({
                  type: 'success',
                  showClose: true,
                  duration: 3000,
                  offset: 100,
                  title: "保存",
                  message: "保存成功"
                });
                getDataList();
              } else {
                ElNotification({
                  type: 'success',
                  showClose: true,
                  duration: 3000,
                  offset: 100,
                  title: "保存",
                  message: "保存失败"
                });
              }
              dataList.open = false;
            });
          }
        }
      })
    }

    // 新增按钮操作
    const handleAdd = () => {
      reset();
      dataList.open = true;
      dataList.title = "添加";
    }

    // 修改按钮操作
    const handleUpdate = (row: any) => {
      reset();
      const rowId = dataList.ids.length !== 0 ? dataList.ids : row.id;
      getById(rowId).then((res: any) => {
        // console.log(res)
        if (res.code === 200) {
          dataList.form = res.data.list;
          dataList.open = true;
          dataList.title = "修改";
        }
      });
    }

    // 删除按钮操作
    const handleDelete = (row: any) => {
      const ids = dataList.ids.length !== 0 ? dataList.ids : row.id;
      ElMessageBox.confirm('是否确认删除数据项?', "警告", {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消"
      }).then(() => {
        deleteById(ids).then((res: any) => {
          // console.log(res)
          if (res.code === 200) {
            getDataList();
            ElNotification({
              type: 'success',
              showClose: true,
              duration: 3000,
              offset: 100,
              title: "删除",
              message: "删除成功"
            });
          } else {
            ElNotification({
              type: 'error',
              showClose: true,
              duration: 3000,
              offset: 100,
              title: "删除",
              message: "删除失败"
            });
          }
        });
      })
    }

    return {
      ...toRefs(dataList),
      getDataList,
      handleSizeChange,
      handleCurrentChange,
      statusFormat,
      cancel,
      reset,
      handleQuery,
      resetQuery,
      handleSelectionChange,
      handleAdd,
      handleUpdate,
      submitForm,
      handleDelete,
    };
  },
};
</script>

<style scoped lang="scss">

</style>
