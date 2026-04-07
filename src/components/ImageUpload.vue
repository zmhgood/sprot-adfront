<template>
  <div class="image-upload">
    <el-upload
      class="uploader"
      :action="uploadUrl"
      :headers="getHeaders()"
      :show-file-list="false"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
      accept="image/*"
    >
      <img v-if="modelValue" :src="modelValue" class="preview-image" />
      <el-icon v-else class="upload-icon"><Plus /></el-icon>
    </el-upload>
    <div class="upload-tip">支持 jpg/png/gif/webp，最大 5MB</div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const uploadUrl = '/api/upload/image'

const getHeaders = () => {
  const token = localStorage.getItem('admin_token') || ''
  return {
    Authorization: `Bearer ${token}`
  }
}

const beforeUpload = (file) => {
  const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleSuccess = (response) => {
  if (response.code === 0) {
    emit('update:modelValue', response.data.url)
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleError = () => {
  ElMessage.error('上传失败，请重试')
}
</script>

<style lang="scss" scoped>
.image-upload {
  .uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s;
      
      &:hover {
        border-color: #409eff;
      }
    }
    
    .preview-image {
      width: 148px;
      height: 148px;
      display: block;
      object-fit: cover;
    }
    
    .upload-icon {
      font-size: 28px;
      color: #8c939d;
      width: 148px;
      height: 148px;
      line-height: 148px;
      text-align: center;
    }
  }
  
  .upload-tip {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
  }
}
</style>
