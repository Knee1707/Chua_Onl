<script setup lang="ts">
// Trải nghiệm 3D: leo núi, qua cổng tam quan, cởi dép, vào chùa thờ cúng.
import { useAuth } from '~/composables/useAuth'

const { current, cloudEnabled, init, enterAsGuest, signUp, signIn, signOut } = useAuth()

const activePanel = ref<string>('') // incense | bell | merit | prayer | fortune
const showGate = ref(true) // cửa "tự cấp tài khoản" trước khi vào
// khách đã lưu -> vào thẳng, không nháy cửa tài khoản
if (import.meta.client) { try { if (localStorage.getItem('dco.pilgrim')) showGate.value = false } catch {} }

// form tài khoản
const mode = ref<'guest' | 'signup' | 'signin'>('guest')
const form = reactive({ name: '', email: '', password: '' })
const authError = ref('')
const busy = ref(false)

onMounted(async () => {
  await init()
  if (current.value) showGate.value = false
})

async function submitAuth() {
  authError.value = ''
  busy.value = true
  try {
    if (mode.value === 'guest') {
      if (!form.name.trim()) { authError.value = 'Xin cho biết pháp danh / tên của bạn.'; return }
      enterAsGuest(form.name)
    } else if (mode.value === 'signup') {
      const r = await signUp(form.name, form.email, form.password)
      if (!r.ok) { authError.value = r.error || 'Đăng ký không thành công.'; return }
    } else {
      const r = await signIn(form.email, form.password)
      if (!r.ok) { authError.value = r.error || 'Đăng nhập không thành công.'; return }
    }
    showGate.value = false
  } finally {
    busy.value = false
  }
}

function onInteract(action: string) {
  activePanel.value = action
}
function closePanel() { activePanel.value = '' }

const panelTitle = computed(() => ({
  incense: '🪔 Thắp nhang', bell: '🔔 Thỉnh chuông', merit: '💛 Cúng dường',
  prayer: '🙏 Cầu an', fortune: '🎋 Xin xăm', sutra: '📿 Tụng kinh'
}[activePanel.value] || ''))

async function doSignOut() { await signOut(); showGate.value = true }
</script>

<template>
  <div class="hh-root">
    <TempleScene3D v-if="!showGate" @interact="onInteract" />

    <!-- Cổng tài khoản: tự cấp tài khoản để vào chùa -->
    <transition name="fade">
      <div v-if="showGate" class="gate-overlay">
        <div class="gate-card">
          <div class="lotus">🪷</div>
          <h1>Đi Chùa Online</h1>
          <p class="tagline">Tự tạo tài khoản hành hương — leo núi, qua cổng tam quan,
            vào chùa lễ Phật như ngoài đời.</p>

          <div class="tabs">
            <button :class="{ on: mode === 'guest' }" @click="mode = 'guest'">Vào ngay</button>
            <button :class="{ on: mode === 'signup' }" @click="mode = 'signup'">Đăng ký</button>
            <button :class="{ on: mode === 'signin' }" @click="mode = 'signin'">Đăng nhập</button>
          </div>

          <form class="auth-form" @submit.prevent="submitAuth">
            <input v-if="mode !== 'signin'" v-model="form.name" placeholder="Pháp danh / Tên của bạn" />
            <input v-if="mode !== 'guest'" v-model="form.email" type="email" placeholder="Email" />
            <input v-if="mode !== 'guest'" v-model="form.password" type="password" placeholder="Mật khẩu" />
            <p v-if="authError" class="err">{{ authError }}</p>
            <button class="btn-gold" :disabled="busy" type="submit">
              {{ mode === 'guest' ? '🚪 Bước tới chân núi' : mode === 'signup' ? 'Tạo tài khoản & vào chùa' : 'Đăng nhập' }}
            </button>
          </form>

          <p class="note">
            <template v-if="cloudEnabled">Tài khoản được lưu trên cloud, dùng lại trên mọi thiết bị.</template>
            <template v-else>Chế độ khách: tài khoản lưu ngay trên trình duyệt của bạn.</template>
          </p>
        </div>
      </div>
    </transition>

    <!-- thanh người dùng góc trên -->
    <div v-if="!showGate && current" class="userbar">
      <span>🙏 {{ current.name }}</span>
      <button @click="doSignOut">Rời chùa</button>
    </div>

    <!-- Bảng thờ cúng (tái dùng component 2D hiện có) -->
    <transition name="fade">
      <div v-if="activePanel" class="panel-overlay" @click.self="closePanel">
        <div class="panel-card">
          <div class="panel-head">
            <h2>{{ panelTitle }}</h2>
            <button class="close" @click="closePanel">✕</button>
          </div>
          <div class="panel-body">
            <IncenseBurner v-if="activePanel === 'incense'" />
            <TempleBell v-else-if="activePanel === 'bell'" />
            <MeritBox v-else-if="activePanel === 'merit'" />
            <PrayerBook v-else-if="activePanel === 'prayer'" />
            <FortuneStick v-else-if="activePanel === 'fortune'" />
            <SutraChanting v-else-if="activePanel === 'sutra'" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.hh-root { position: fixed; inset: 0; background: #0d0a07; }

.gate-overlay {
  position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 24px;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(201,163,86,.25), transparent 60%),
    linear-gradient(160deg, #241305, #0d0a07);
}
.gate-card {
  width: min(440px, 92vw); text-align: center; color: #f5efe0;
  background: rgba(40,26,16,.7); border: 1px solid rgba(201,163,86,.45);
  border-radius: 22px; padding: 30px 26px; backdrop-filter: blur(10px);
  box-shadow: 0 24px 70px rgba(0,0,0,.5);
}
.lotus { font-size: 2.6rem; }
.gate-card h1 { font-family: 'Cormorant Garamond','Noto Serif',serif; font-size: 2.4rem; margin: 6px 0 8px; color: #f3e6c4; }
.tagline { font-size: .95rem; opacity: .85; line-height: 1.55; margin-bottom: 22px; }
.tabs { display: flex; gap: 6px; background: rgba(0,0,0,.25); padding: 5px; border-radius: 999px; margin-bottom: 18px; }
.tabs button { flex: 1; border: none; background: transparent; color: #e7dcc4; padding: 9px; border-radius: 999px; cursor: pointer; font-size: .9rem; }
.tabs button.on { background: linear-gradient(135deg,#d9b969,#b4863f); color: #2a1a0c; font-weight: 600; }
.auth-form { display: flex; flex-direction: column; gap: 10px; }
.auth-form input {
  background: rgba(255,255,255,.08); border: 1px solid rgba(201,163,86,.35); color: #fff;
  padding: 12px 14px; border-radius: 12px; font-size: .95rem; outline: none;
}
.auth-form input:focus { border-color: #c9a356; }
.err { color: #ffb4a3; font-size: .85rem; margin: 2px 0; }
.btn-gold {
  background: linear-gradient(135deg,#d9b969,#b4863f); color: #2a1a0c; font-weight: 600;
  border: none; padding: 13px; border-radius: 999px; font-size: 1rem; cursor: pointer; margin-top: 4px;
}
.btn-gold:disabled { opacity: .6; cursor: wait; }
.note { font-size: .78rem; opacity: .6; margin-top: 16px; }

.userbar {
  position: fixed; top: 16px; left: 16px; z-index: 20; display: flex; gap: 10px; align-items: center;
  background: rgba(40,26,16,.6); color: #f5efe0; padding: 8px 14px; border-radius: 999px;
  border: 1px solid rgba(201,163,86,.4); backdrop-filter: blur(6px); font-size: .9rem;
}
.userbar button { background: rgba(255,255,255,.12); border: none; color: #f5efe0; padding: 5px 12px; border-radius: 999px; cursor: pointer; font-size: .82rem; }

.panel-overlay { position: fixed; inset: 0; z-index: 25; display: grid; place-items: center; padding: 20px; background: rgba(10,6,3,.6); backdrop-filter: blur(4px); }
.panel-card {
  width: min(640px, 94vw); max-height: 88vh; overflow: auto;
  background: #f5efe0; border-radius: 20px; box-shadow: 0 24px 70px rgba(0,0,0,.5);
  border: 1px solid #c9a356;
}
.panel-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(201,163,86,.35); position: sticky; top: 0; background: #f5efe0; z-index: 2; }
.panel-head h2 { font-family: 'Cormorant Garamond','Noto Serif',serif; font-size: 1.5rem; color: #8b2e2e; margin: 0; }
.close { border: none; background: rgba(139,46,46,.1); color: #8b2e2e; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; font-size: 1rem; }
.panel-body { padding: 18px 20px 24px; }

.fade-enter-active, .fade-leave-active { transition: opacity .4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
