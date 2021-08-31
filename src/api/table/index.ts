import {deleteRequestById, getRequest, getRequestById, postRequest, putRequest} from '/@/utils/requestApi'

// 查询列表
export function getList(params: object) {
  return getRequest('/mock/table/list', params)
}

// 查询详细
export function getById(id: number) {
  return getRequestById(`/mock/table/info/${id}`)
}

// 新增
export function save(data: object) {
  return postRequest('/mock/table/save', data)
}

// 修改
export function update(data: object) {
  return putRequest('/mock/table/update', data)
}

// 删除
export function deleteById(id: number) {
  return deleteRequestById(`/mock/table/delete/${id}`)
}

