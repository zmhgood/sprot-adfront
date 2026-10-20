<template>
  <div class="banners-page">
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <div class="toolbar"><div><strong>首页轮播图</strong><p>最多10张，按列表顺序展示；仅展示图片，不跳转页面。</p></div>
          <div class="toolbar-actions"><el-button :disabled="!loaded || saving || items.length >= 10" @click="edit()">添加轮播图</el-button>
          <el-button type="primary" :loading="saving" :disabled="!loaded || !dirty || uploading" @click="save">保存并生效</el-button></div>
        </div>
      </template>
      <el-alert v-if="loadError" type="error" :closable="false" :title="loadError"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
      <el-alert v-if="saveError" type="error" :closable="false" :title="saveError" />
      <template v-if="loaded">
        <el-alert v-if="!configured" type="info" :closable="false" title="尚未配置，首页暂用默认图；保存空列表后将隐藏轮播。" />
        <el-alert v-else-if="!items.some(item => item.enabled)" type="info" :closable="false" title="当前没有启用的图片，保存后首页将隐藏轮播。" />
        <div class="table-scroll">
          <el-table :data="items" row-key="id" empty-text="暂无轮播图，可点击添加" style="min-width: 820px">
            <el-table-column label="顺序" width="70"><template #default="{ $index }">{{ $index + 1 }}</template></el-table-column>
            <el-table-column label="图片预览" width="220"><template #default="{ row }"><img class="banner-thumb" :src="row.image_url" :alt="row.title || '轮播图片'" /></template></el-table-column>
            <el-table-column label="标题 / 说明" min-width="190"><template #default="{ row }"><div>{{ row.title || '无标题' }}</div><p class="description">{{ row.description || '无说明' }}</p></template></el-table-column>
            <el-table-column label="启用" width="90"><template #default="{ row }"><el-switch v-model="row.enabled" :disabled="saving" :aria-label="'启用' + (row.title || '轮播图')" /></template></el-table-column>
            <el-table-column label="操作" width="250"><template #default="{ row, $index }">
              <el-button link type="primary" :disabled="saving" @click="edit(row)">编辑</el-button>
              <el-button link :disabled="saving || $index === 0" @click="move($index, -1)">上移</el-button>
              <el-button link :disabled="saving || $index === items.length - 1" @click="move($index, 1)">下移</el-button>
              <el-button link type="danger" :disabled="saving" @click="remove($index)">移除</el-button>
            </template></el-table-column>
          </el-table>
        </div>
        <p class="save-tip">调整内容、顺序或启停后，请点击“保存并生效”。标题最多20字，说明最多40字。</p>
      </template>
    </el-card>

    <el-dialog v-model="editing" :title="editingId ? '编辑轮播图' : '添加轮播图'" width="min(640px, 94vw)" :close-on-click-modal="false" :close-on-press-escape="!uploading" :show-close="!uploading" destroy-on-close>
      <el-form label-position="top" @submit.prevent="confirmEdit">
        <el-form-item label="轮播图片（必填）">
          <el-upload action="/api/upload/image" :headers="uploadHeaders" :show-file-list="false" :disabled="uploading" :before-upload="beforeUpload" :on-success="uploadSuccess" :on-error="uploadError" accept="image/jpeg,image/png,image/webp,image/gif">
            <el-button :loading="uploading">{{ uploading ? '图片上传中' : '上传图片到COS' }}</el-button>
          </el-upload>
          <div class="upload-tip">建议1280×480像素，主要内容放在图片中央。支持jpg/png/gif/webp，最大5MB。</div>
        </el-form-item>
        <el-form-item label="标题（选填，最多20字）"><el-input v-model="form.title" maxlength="40" @input="form.title = Array.from(form.title).slice(0, 20).join('')" placeholder="例如：带着家人一起动起来吧"><template #suffix>{{ Array.from(form.title).length }}/20</template></el-input></el-form-item>
        <el-form-item label="说明（选填，最多40字）"><el-input v-model="form.description" maxlength="80" @input="form.description = Array.from(form.description).slice(0, 40).join('')" placeholder="填写简短说明"><template #suffix>{{ Array.from(form.description).length }}/40</template></el-input></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
        <div v-if="form.image_url" class="banner-preview"><img :src="form.image_url" alt="轮播预览" /><div v-if="form.title || form.description" class="preview-caption"><strong>{{ form.title }}</strong><span>{{ form.description }}</span></div></div>
        <div class="dialog-actions"><el-button :disabled="uploading" @click="editing = false">取消</el-button><el-button type="primary" :disabled="uploading || !form.image_url" @click="confirmEdit">确认</el-button></div>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBanners, saveBanners } from '@/api'

const loading = ref(false), loaded = ref(false), saving = ref(false), uploading = ref(false)
const saveError = ref('')
const loadError = ref(''), configured = ref(false), original = ref('[]'), items = ref([])
const editing = ref(false), editingId = ref(null)
const form = reactive({ title: '', description: '', image_url: '', enabled: true })
const dirty = computed(() => !configured.value || JSON.stringify(items.value) !== original.value)
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` }))

async function load() {
  if (loading.value) return
  loading.value = true; loadError.value = ''
  try {
    const { data } = await getBanners()
    if (!data || typeof data.configured !== 'boolean' || !Array.isArray(data.items)) throw Error('响应格式无效')
    items.value = data.items; configured.value = data.configured
    original.value = JSON.stringify(data.items); loaded.value = true
  } catch (_) { loadError.value = '轮播图加载失败，请重试'; loaded.value = false }
  finally { loading.value = false }
}
function edit(row) {
  editingId.value = row?.id || null
  Object.assign(form, row || { title: '', description: '', image_url: '', enabled: true })
  editing.value = true
}
function beforeUpload(file) {
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    ElMessage.error('请选择5MB以内的jpg、png、gif或webp图片'); return false
  }
  uploading.value = true; return true
}
function uploadSuccess(response) {
  uploading.value = false
  if (response.code !== 0 || !response.data?.url) { ElMessage.error(response.message || '上传失败'); return }
  form.image_url = response.data.url
  ElMessage.success('图片已上传')
}
function uploadError() { uploading.value = false; ElMessage.error('图片上传失败，请重试') }
function confirmEdit() {
  if (uploading.value || !form.image_url) return
  const title = form.title.trim(), description = form.description.trim()
  if (Array.from(title).length > 20 || Array.from(description).length > 40 || /[\u0000-\u001f\u007f-\u009f]/.test(title + description)) {
    ElMessage.error('标题最多20字，说明最多40字，不能含换行等控制字符'); return
  }
  const item = { id: editingId.value || Math.max(Date.now(), ...items.value.map(x => x.id + 1)), title, description, image_url: form.image_url, enabled: form.enabled }
  const index = items.value.findIndex(x => x.id === editingId.value)
  if (index >= 0) items.value.splice(index, 1, item)
  else if (items.value.length < 10) items.value.push(item)
  editing.value = false
}
function move(index, direction) {
  const target = index + direction
  if (saving.value || target < 0 || target >= items.value.length) return
  const [item] = items.value.splice(index, 1); items.value.splice(target, 0, item)
}
async function remove(index) {
  try { await ElMessageBox.confirm('移除这张轮播图？点击顶部“保存并生效”后生效。', '移除轮播图', { type: 'warning' }) }
  catch (_) { return }
  items.value.splice(index, 1)
}
async function save() {
  if (saving.value || uploading.value || !loaded.value) return
  saving.value = true; saveError.value = ''
  try {
    await saveBanners({ items: items.value })
    original.value = JSON.stringify(items.value); configured.value = true
    ElMessage.success('轮播图已保存并生效')
  } catch (_) { saveError.value = '保存失败，修改已保留，请重试' }
  finally { saving.value = false }
}
onBeforeRouteLeave(async () => {
  if (saving.value || uploading.value) { ElMessage.warning('请等待当前操作完成'); return false }
  if (loaded.value && dirty.value && (configured.value || items.value.length)) {
    try { await ElMessageBox.confirm('修改尚未保存，确定离开吗？', '未保存的修改') }
    catch (_) { return false }
  }
})
onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 20px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.toolbar p, .description, .upload-tip, .save-tip { color: #64748b; font-size: 13px; line-height: 1.6; }
.toolbar p { margin: 6px 0 0; }
.toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.toolbar-actions .el-button { margin: 0; }
.table-scroll { overflow-x: auto; margin-top: 16px; }
.banner-thumb { width: 195px; height: 75px; object-fit: cover; border-radius: 8px; display: block; }
.description { overflow-wrap: anywhere; margin: 5px 0; }
.upload-tip { width: 100%; margin-top: 8px; }
.banner-preview { position: relative; aspect-ratio: 1280 / 480; overflow: hidden; border-radius: 10px; background: #eef2f6; }
.banner-preview img { width: 100%; height: 100%; object-fit: cover; }
.preview-caption { position: absolute; inset: auto 0 0; display: flex; flex-direction: column; padding: 20px; color: white; background: linear-gradient(transparent, #123333cc); }
.preview-caption strong, .preview-caption span { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
.preview-caption strong { -webkit-line-clamp: 1; }
.preview-caption span { -webkit-line-clamp: 2; }
.dialog-actions { display: flex; justify-content: flex-end; margin-top: 24px; }
@media (max-width: 600px) { .preview-caption { padding: 12px; font-size: 13px; } }
</style>
