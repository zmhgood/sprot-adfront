<template>
  <div class="gif-upload">
    <el-upload
      class="uploader"
      :action="uploadUrl"
      :headers="getHeaders()"
      :show-file-list="false"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
      accept="image/gif"
    >
      <div v-if="modelValue" class="preview-gif">
        <img 
          :src="getProxyUrl(modelValue)" 
          class="gif-thumb" 
          crossorigin="anonymous" 
          referrerpolicy="no-referrer"
          @error="handleImageError" 
        />
      </div>
      <div v-else class="upload-placeholder">
        <el-icon class="upload-icon"><Picture /></el-icon>
        <span>上传GIF动图</span>
      </div>
    </el-upload>
    <div class="upload-tip">支持 GIF 格式，最大 10MB</div>
    <el-input
      v-if="modelValue"
      :model-value="modelValue"
      placeholder="GIF动图链接"
      readonly
      class="gif-url"
    >
      <template #append>
        <el-button @click="handleClear">清除</el-button>
      </template>
    </el-input>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const uploadUrl = '/api/upload/image'

// 处理跨域图片URL，开发环境使用代理
const getProxyUrl = (url) => {
  if (!url) return ''
  // 如果是开发环境且是COS域名，使用代理
  if (import.meta.env.DEV && url.includes('myqcloud.com')) {
    // 提取路径部分
    const pathMatch = url.match(/myqcloud\.com\/(.*)/)
    if (pathMatch) {
      return `/cos-proxy/${pathMatch[1]}`
    }
  }
  return url
}

const getHeaders = () => {
  const token = localStorage.getItem('admin_token') || ''
  return {
    Authorization: `Bearer ${token}`
  }
}

const beforeUpload = (file) => {
  const isGif = file.type === 'image/gif'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isGif) {
    ElMessage.error('只能上传 GIF 动图文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('GIF 大小不能超过 10MB!')
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

const handleClear = () => {
  emit('update:modelValue', '')
}

const handleImageError = (e) => {
  console.error('图片加载失败:', props.modelValue, e)
  ElMessage.error('图片加载失败，可能是跨域问题')
}
</script>

<style lang="scss" scoped>
.gif-upload {
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
    
    .preview-gif {
      width: 200px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      
      .gif-thumb {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }
    
    .upload-placeholder {
      width: 200px;
      height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      
      .upload-icon {
        font-size: 32px;
        color: #8c939d;
      }
      
      span {
        margin-top: 8px;
        font-size: 14px;
        color: #8c939d;
      }
    }
  }
  
  .upload-tip {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
  }
  
  .gif-url {
    margin-top: 8px;
    width: 300px;
  }
}
</style>
