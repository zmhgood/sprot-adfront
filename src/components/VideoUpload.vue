<template>
  <div class="video-upload">
    <el-upload
      class="uploader"
      :action="uploadUrl"
      :headers="getHeaders()"
      :show-file-list="false"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
      accept="video/*"
    >
      <div v-if="modelValue" class="preview-video">
        <video :src="modelValue" class="video-thumb"></video>
        <div class="play-icon">
          <el-icon><VideoPlay /></el-icon>
        </div>
      </div>
      <div v-else class="upload-placeholder">
        <el-icon class="upload-icon"><VideoCamera /></el-icon>
        <span>上传视频</span>
      </div>
    </el-upload>
    <div class="upload-tip">支持 mp4/mov/avi/mkv，最大 100MB</div>
    <el-input
      v-if="modelValue"
      :model-value="modelValue"
      placeholder="视频链接"
      readonly
      class="video-url"
    >
      <template #append>
        <el-button @click="handleClear">清除</el-button>
      </template>
    </el-input>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoCamera } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const uploadUrl = '/api/upload/video'

const getHeaders = () => {
  const token = localStorage.getItem('admin_token') || ''
  return {
    Authorization: `Bearer ${token}`
  }
}

const beforeUpload = (file) => {
  const isVideo = file.type.startsWith('video/')
  const isLt100M = file.size / 1024 / 1024 < 100

  if (!isVideo) {
    ElMessage.error('只能上传视频文件!')
    return false
  }
  if (!isLt100M) {
    ElMessage.error('视频大小不能超过 100MB!')
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
</script>

<style lang="scss" scoped>
.video-upload {
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
    
    .preview-video {
      width: 200px;
      height: 120px;
      position: relative;
      
      .video-thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .play-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 32px;
        color: #fff;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
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
  
  .video-url {
    margin-top: 8px;
    width: 300px;
  }
}
</style>
