<script setup lang="ts">
// Trải nghiệm 3D: leo núi, qua cổng tam quan, cởi dép, vào chùa thờ cúng.
import { useAuth } from '~/composables/useAuth'
import { useProgress } from '~/composables/useProgress'

const { current, cloudEnabled, init, enterAsGuest, signUp, signIn, signOut } = useAuth()
const { level, toasts, quests, questsDone, award, track } = useProgress()

const activePanel = ref<string>('') // incense | bell | merit | prayer | fortune | sutra | wish | bow | meditate
const showGate = ref(true) // cửa "tự cấp tài khoản" trước khi vào
const showQuests = ref(false)
const showMenu = ref(true) // bảng Hoạt động bên trái
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

// ----- Hoạt động (menu như chuaonline.org) -----
const activities = [
  { action: 'incense', icon: '🪔', label: 'Thắp nhang' },
  { action: 'bow', icon: '🙇', label: 'Lạy Phật' },
  { action: 'wish', icon: '🏮', label: 'Thả đèn nguyện' },
  { action: 'bell', icon: '🔔', label: 'Thỉnh chuông' },
  { action: 'sutra', icon: '📿', label: 'Tụng kinh' },
  { action: 'meditate', icon: '🧘', label: 'Ngồi thiền' },
  { action: 'prayer', icon: '🙏', label: 'Cầu an' },
  { action: 'merit', icon: '💛', label: 'Cúng dường' },
  { action: 'fortune', icon: '🎋', label: 'Xin xăm' }
]

// các panel tự trao thưởng bên trong -> không cộng khi mở
const selfReward = new Set(['wish', 'bow', 'meditate'])
const rewardedOpen = new Set<string>() // chống farm trong 1 phiên

function onInteract(action: string) {
  activePanel.value = action
  if (selfReward.has(action)) return
  if (!rewardedOpen.has(action)) {
    rewardedOpen.add(action)
    award(8)
    if (action === 'incense') track('incense')
    if (action === 'bell') track('bell')
  }
}
function closePanel() { activePanel.value = '' }

const panelTitle = computed(() => ({
  incense: '🪔 Thắp nhang', bell: '🔔 Thỉnh chuông', merit: '💛 Cúng dường',
  prayer: '🙏 Cầu an', fortune: '🎋 Xin xăm', sutra: '📿 Tụng kinh',
  wish: '🏮 Thả đèn nguyện', bow: '🙇 Lạy Phật', meditate: '🧘 Ngồi thiền'
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

    <!-- HUD công đức + cấp độ (góc phải trên) -->
    <div v-if="!showGate && current" class="merit-hud">
      <div class="lvl-badge">{{ level.lvl }}</div>
      <div class="lvl-info">
        <div class="lvl-top">
          <span class="lvl-title">{{ level.title }}</span>
          <span class="lvl-cd">✨ {{ level.inLevel }}/{{ level.need }}</span>
        </div>
        <div class="lvl-bar"><i :style="{ width: level.pct + '%' }" /></div>
      </div>
      <button class="quest-btn" @click="showQuests = true" title="Nhiệm vụ hằng ngày">
        🎯<span v-if="questsDone < quests.length" class="quest-dot" />
      </button>
    </div>

    <!-- Bảng Hoạt động (menu bên trái, như chuaonline.org) -->
    <div v-if="!showGate && current" class="dock" :class="{ collapsed: !showMenu }">
      <button class="dock-toggle" @click="showMenu = !showMenu">
        {{ showMenu ? '‹ Hoạt động' : '☰' }}
      </button>
      <transition name="fade">
        <div v-if="showMenu" class="dock-list">
          <button v-for="a in activities" :key="a.action" class="dock-item" @click="onInteract(a.action)">
            <span class="di-icon">{{ a.icon }}</span>
            <span class="di-label">{{ a.label }}</span>
          </button>
        </div>
      </transition>
    </div>

    <!-- Toasts công đức -->
    <div class="toast-wrap">
      <transition-group name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="'toast-' + t.kind">
          {{ t.text }}
        </div>
      </transition-group>
    </div>

    <!-- Nhiệm vụ hằng ngày -->
    <transition name="fade">
      <div v-if="showQuests" class="panel-overlay" @click.self="showQuests = false">
        <div class="panel-card quest-card">
          <div class="panel-head">
            <h2>🎯 Nhiệm vụ hằng ngày</h2>
            <button class="close" @click="showQuests = false">✕</button>
          </div>
          <div class="panel-body">
            <p class="q-sub">Hoàn thành để nhận công đức. Nhiệm vụ làm mới mỗi ngày.</p>
            <ul class="q-list">
              <li v-for="q in quests" :key="q.key" class="q-item" :class="{ done: q.done }">
                <span class="q-ic">{{ q.icon }}</span>
                <div class="q-mid">
                  <div class="q-label">{{ q.label }}</div>
                  <div class="q-bar"><i :style="{ width: (q.progress / q.target * 100) + '%' }" /></div>
                </div>
                <span class="q-reward">{{ q.done ? '✓' : '+' + q.reward }}</span>
              </li>
            </ul>
            <p class="q-foot">Đã xong {{ questsDone }}/{{ quests.length }} hôm nay</p>
          </div>
        </div>
      </div>
    </transition>

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
            <WishLantern v-else-if="activePanel === 'wish'" />
            <BowBuddha v-else-if="activePanel === 'bow'" />
            <Meditate v-else-if="activePanel === 'meditate'" />
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

/* ---- HUD công đức / cấp độ ---- */
.merit-hud {
  position: fixed; top: 16px; right: 16px; z-index: 20; display: flex; align-items: center; gap: 10px;
  background: rgba(40,26,16,.62); border: 1px solid rgba(201,163,86,.45); backdrop-filter: blur(8px);
  padding: 8px 12px; border-radius: 16px; color: #f5efe0; box-shadow: 0 10px 30px rgba(0,0,0,.4);
}
.lvl-badge {
  width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%;
  background: linear-gradient(135deg,#d9b969,#b4863f); color: #2a1a0c; font-weight: 700; font-size: 1.05rem;
  box-shadow: 0 0 14px rgba(217,185,105,.6);
}
.lvl-info { width: 148px; }
.lvl-top { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; }
.lvl-title { font-family: 'Cormorant Garamond','Noto Serif',serif; font-size: 1rem; color: #f3e6c4; }
.lvl-cd { font-size: .72rem; opacity: .8; }
.lvl-bar { height: 6px; margin-top: 4px; border-radius: 999px; background: rgba(255,255,255,.15); overflow: hidden; }
.lvl-bar i { display: block; height: 100%; background: linear-gradient(90deg,#d9b969,#f0d79a); transition: width .6s ease; }
.quest-btn {
  position: relative; border: none; background: rgba(255,255,255,.12); color: #fff;
  width: 36px; height: 36px; border-radius: 12px; cursor: pointer; font-size: 1.1rem;
}
.quest-dot {
  position: absolute; top: 5px; right: 5px; width: 9px; height: 9px; border-radius: 50%;
  background: #ff5a4d; box-shadow: 0 0 6px #ff5a4d;
}

/* ---- Dock Hoạt động ---- */
.dock {
  position: fixed; left: 16px; top: 50%; transform: translateY(-50%); z-index: 20;
  display: flex; flex-direction: column; gap: 8px;
}
.dock-toggle {
  align-self: flex-start; border: 1px solid rgba(201,163,86,.4); background: rgba(40,26,16,.62);
  color: #f5efe0; padding: 7px 12px; border-radius: 999px; cursor: pointer; font-size: .82rem;
  backdrop-filter: blur(6px);
}
.dock-list {
  display: flex; flex-direction: column; gap: 6px; max-height: 70vh; overflow: auto;
  background: rgba(40,26,16,.55); border: 1px solid rgba(201,163,86,.35);
  border-radius: 16px; padding: 8px; backdrop-filter: blur(8px);
}
.dock-item {
  display: flex; align-items: center; gap: 10px; border: none; cursor: pointer;
  background: rgba(255,255,255,.06); color: #f5efe0; padding: 8px 12px; border-radius: 12px;
  font-size: .88rem; text-align: left; transition: background .25s, transform .25s;
}
.dock-item:hover { background: rgba(217,185,105,.25); transform: translateX(3px); }
.di-icon { font-size: 1.15rem; width: 1.4rem; text-align: center; }
.di-label { white-space: nowrap; }

/* ---- Toasts ---- */
.toast-wrap {
  position: fixed; top: 70px; left: 50%; transform: translateX(-50%); z-index: 40;
  display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;
}
.toast {
  background: rgba(40,26,16,.9); color: #f5efe0; padding: 9px 18px; border-radius: 999px;
  border: 1px solid rgba(201,163,86,.5); font-size: .9rem; box-shadow: 0 10px 30px rgba(0,0,0,.45);
  white-space: nowrap;
}
.toast-level { background: linear-gradient(135deg,#8b2e2e,#b4863f); border-color: #f0d79a; font-weight: 600; }
.toast-quest { border-color: #7fd18a; }
.toast-enter-active, .toast-leave-active { transition: all .4s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-14px); }
.toast-leave-to { opacity: 0; transform: translateY(-10px) scale(.95); }

/* ---- Nhiệm vụ ---- */
.quest-card { width: min(460px, 94vw); }
.q-sub { font-size: .85rem; color: #6b5640; margin-bottom: 14px; }
.q-list { display: flex; flex-direction: column; gap: 10px; }
.q-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px;
  background: #efe6d2; border: 1px solid rgba(201,163,86,.3);
}
.q-item.done { background: #e7f0e1; border-color: #9ccb8f; opacity: .85; }
.q-ic { font-size: 1.4rem; }
.q-mid { flex: 1; }
.q-label { font-size: .92rem; color: #4a3728; }
.q-bar { height: 6px; margin-top: 6px; border-radius: 999px; background: rgba(74,55,40,.15); overflow: hidden; }
.q-bar i { display: block; height: 100%; background: linear-gradient(90deg,#b4863f,#d9b969); transition: width .5s; }
.q-reward { font-weight: 700; color: #8b2e2e; min-width: 34px; text-align: right; }
.q-item.done .q-reward { color: #4f8f3f; }
.q-foot { text-align: center; margin-top: 16px; font-size: .85rem; color: #8b7355; }

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

@media (max-width: 640px) {
  .merit-hud { top: 10px; right: 10px; padding: 6px 10px; gap: 7px; }
  .lvl-info { width: 110px; }
  .dock { top: auto; bottom: 14px; left: 10px; transform: none; }
  .dock-list { flex-direction: row; flex-wrap: wrap; max-width: 78vw; max-height: 34vh; }
  .di-label { display: none; }
  .dock-item { padding: 9px; }
}
</style>
