<template>
  <div class="settings-page">
    <el-card shadow="hover">
      <template #header>
        <span>系统设置</span>
      </template>

      <el-form :model="form" label-width="100px" v-loading="loading">
        <el-form-item label="网站名称">
          <el-input v-model="form.site_name" placeholder="请输入网站名称" />
        </el-form-item>

        <el-form-item label="网站标语">
          <el-input v-model="form.site_slogan" placeholder="请输入网站标语" />
        </el-form-item>

        <el-form-item label="网站Logo">
          <div class="logo-upload">
            <el-upload
              class="logo-uploader"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleLogoSuccess"
              :before-upload="beforeLogoUpload"
              accept="image/*"
            >
              <img v-if="form.logo_url" :src="form.logo_url" class="logo-preview" />
              <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="logo-tips">
              <p>建议尺寸: 128x128 像素</p>
              <p>支持格式: PNG, JPG, SVG</p>
              <el-button v-if="form.logo_url" type="danger" link @click="removeLogo">移除Logo</el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="preview-card">
      <template #header>
        <span>效果预览</span>
      </template>
      <div class="preview-container">
        <div class="preview-sidebar">
          <div class="preview-logo">
            <img v-if="form.logo_url" :src="form.logo_url" alt="logo" />
            <el-icon v-else><Picture /></el-icon>
          </div>
          <span class="preview-name">{{ form.site_name || '网站名称' }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getConfigs, updateConfigs } from '@/api'

const loading = ref(false)
const saving = ref(false)

const form = reactive({
  logo_url: '',
  site_name: '银龄健身',
  site_slogan: ''
})

const uploadUrl = '/api/upload/image'
const uploadHeaders = {
  Authorization: 'Bearer ' + localStorage.getItem('admin_token')
}

const loadConfigs = async () => {
  loading.value = true
  try {
    const res = await getConfigs()
    if (res.data) {
      Object.keys(res.data).forEach(key => {
        if (form.hasOwnProperty(key)) {
          form[key] = res.data[key]
        }
      })
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  } finally {
    loading.value = false
  }
}

const handleLogoSuccess = (response) => {
  if (response.code === 0 && response.data) {
    form.logo_url = response.data.url
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const beforeLogoUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const removeLogo = () => {
  form.logo_url = ''
}

const handleSave = async () => {
  saving.value = true
  try {
    await updateConfigs({ configs: { ...form } })
    ElMessage.success('保存成功')
    // 更新全局状态或通知其他组件
    window.dispatchEvent(new CustomEvent('config-updated', { detail: form }))
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfigs()
})
</script>

<style lang="scss" scoped>
.settings-page {
  .logo-upload {
    display: flex;
    align-items: flex-start;
    gap: 20px;

    .logo-uploader {
      :deep(.el-upload) {
        border: 1px dashed #d9d9d9;
        border-radius: 8px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        width: 128px;
        height: 128px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fafafa;

        &:hover {
          border-color: #409eff;
        }
      }

      .logo-preview {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .logo-uploader-icon {
        font-size: 32px;
        color: #8c939d;
      }
    }

    .logo-tips {
      p {
        margin: 0 0 8px;
        color: #666;
        font-size: 13px;
      }
    }
  }

  .preview-card {
    margin-top: 20px;

    .preview-container {
      background: #304156;
      width: 220px;
      padding: 15px;
      border-radius: 4px;
    }

    .preview-sidebar {
      display: flex;
      align-items: center;
      gap: 10px;

      .preview-logo {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #263445;
        border-radius: 4px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .el-icon {
          font-size: 20px;
          color: #bfcbd9;
        }
      }

      .preview-name {
        color: #fff;
        font-size: 16px;
        font-weight: bold;
      }
    }
  }
}
</style>
