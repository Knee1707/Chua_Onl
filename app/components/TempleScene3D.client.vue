<script setup lang="ts">
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildWorld, makeSandalPair, type World } from '~/three/world'
import { useMultiplayer } from '~/composables/useMultiplayer'

const emit = defineEmits<{ (e: 'interact', action: string): void }>()

const mp = useMultiplayer()
const online = mp.online
const messages = mp.messages
const chatText = ref('')
const chatOpen = ref(true)
const chatScrollEl = ref<HTMLElement | null>(null)
interface RemoteAvatar { group: THREE.Group; legL: THREE.Group; legR: THREE.Group; label: THREE.Sprite; walkPhase: number; sandals?: THREE.Group }
const remotes = new Map<string, RemoteAvatar>()

function onSendChat() { mp.sendChat(chatText.value); chatText.value = '' }
watch(() => messages.length, () => nextTick(() => { if (chatScrollEl.value) chatScrollEl.value.scrollTop = chatScrollEl.value.scrollHeight }))

const canvasEl = ref<HTMLCanvasElement | null>(null)
const phase = ref<'intro' | 'climbing' | 'threshold' | 'inside'>('intro')
const hoverLabel = ref<string>('')
const toast = ref<string>('')
const sandalsOff = ref(false)

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let world: World
let raf = 0
let clock: THREE.Clock

// --- Nhân vật phật tử + camera góc nhìn thứ 3 ---
let avatar: THREE.Group
let legL: THREE.Group, legR: THREE.Group
const avatarPos = new THREE.Vector3(0, 0, 78)
let avatarYaw = Math.PI
let walkAmt = 0
let walkPhase = 0
const cam = { yaw: Math.PI, pitch: 0.3, dist: 8 } // camera xoay quanh nhân vật

const keys: Record<string, boolean> = {}
let dragging = false
let moved = false
let lastX = 0
let lastY = 0

let fullPath: THREE.Vector3[] = []
let climbT = 0
let sandalPair: THREE.Group | null = null

function buildAvatar(robeColor = 0x5f6f82) {
  const g = new THREE.Group()
  const robe = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.85 })      // áo tràng
  const robe2 = new THREE.MeshStandardMaterial({ color: new THREE.Color(robeColor).multiplyScalar(0.82), roughness: 0.85 })
  const skin = new THREE.MeshStandardMaterial({ color: 0xe8c39e, roughness: 0.7 })
  const sashM = new THREE.MeshStandardMaterial({ color: 0xd9b24a, roughness: 0.6, metalness: 0.2 })
  const legM = new THREE.MeshStandardMaterial({ color: 0x3a3330, roughness: 1 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.62, 1.5, 16), robe); body.position.y = 1.2; body.castShadow = true
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.66, 0.7, 16), robe2); skirt.position.y = 0.75
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.44, 14, 12), robe); shoulders.scale.set(1, 0.55, 0.75); shoulders.position.y = 1.9
  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.06), sashM); sash.position.set(0, 1.45, 0.4)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 18, 16), skin); head.position.y = 2.32; head.scale.y = 1.08
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), new THREE.MeshStandardMaterial({ color: 0x241f1b, roughness: 1 })); hair.position.y = 2.4
  const hands = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), skin); hands.scale.set(0.9, 1.3, 0.7); hands.position.set(0, 1.55, 0.42)
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.8, 8), robe); arm.position.set(s * 0.28, 1.5, 0.28); arm.rotation.z = s * 0.4; arm.rotation.x = -0.9; g.add(arm)
  }
  const mkLeg = (sx: number) => { const p = new THREE.Group(); p.position.set(sx, 0.78, 0); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.78, 8), legM); l.position.y = -0.39; l.castShadow = true; p.add(l); return p }
  const _legL = mkLeg(-0.17), _legR = mkLeg(0.17)
  g.add(body, skirt, shoulders, sash, head, hair, hands, _legL, _legR)
  return { group: g, legL: _legL, legR: _legR }
}

// thẻ tên nổi trên đầu người chơi khác
function makeNameTag(text: string) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64
  const ctx = c.getContext('2d')!
  ctx.fillStyle = 'rgba(40,26,16,0.8)'
  const w = 256, h = 64, r = 18
  ctx.beginPath(); ctx.moveTo(r, 4); ctx.arcTo(w - 4, 4, w - 4, h - 4, r); ctx.arcTo(w - 4, h - 4, 4, h - 4, r)
  ctx.arcTo(4, h - 4, 4, 4, r); ctx.arcTo(4, 4, w - 4, 4, r); ctx.closePath(); ctx.fill()
  ctx.font = 'bold 34px "Segoe UI", sans-serif'; ctx.fillStyle = '#f3e6c4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText((text || 'Khách').slice(0, 14), w / 2, h / 2 + 2)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }))
  sp.scale.set(2.6, 0.65, 1); sp.position.y = 2.9
  return sp
}
function colorFromId(id: string) {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff
  const palette = [0x8a5a3a, 0x4e7a5a, 0x7a4e6d, 0x3a5f7a, 0x7a6a3a, 0x6a4e8a, 0x8a4a4a]
  return palette[h % palette.length]
}
// chỗ để dép riêng cho mỗi người (rải dọc thềm, không chồng nhau)
function sandalSpotFor(id: string) {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff
  const s = world.sandalSpot
  return new THREE.Vector3(s.x + ((h % 9) - 4) * 0.85, s.y, s.z + (Math.floor(h / 9) % 3) * 0.7)
}

function placeAvatar() { avatar.position.set(avatarPos.x, avatarPos.y, avatarPos.z); avatar.rotation.y = avatarYaw }
function animateLegs() {
  const swing = Math.sin(walkPhase) * 0.5 * walkAmt
  legL.rotation.x = swing; legR.rotation.x = -swing
  avatar.position.y = avatarPos.y + Math.abs(Math.sin(walkPhase)) * 0.06 * walkAmt
}

// Hiển thị & đồng bộ người chơi khác
function syncRemotes(dt: number) {
  const seen = new Set<string>()
  const k = Math.min(1, dt * 10)
  for (const id in mp.players) {
    const p = mp.players[id]; seen.add(id)
    let r = remotes.get(id)
    if (!r) {
      const a = buildAvatar(colorFromId(id))
      const label = makeNameTag(p.name)
      a.group.add(label)
      scene.add(a.group)
      r = { group: a.group, legL: a.legL, legR: a.legR, label, walkPhase: 0 }
      remotes.set(id, r)
    }
    p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; p.z += (p.tz - p.z) * k
    let dyaw = p.tyaw - p.yaw; while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2
    p.yaw += dyaw * k
    r.group.position.set(p.x, p.y, p.z)
    r.group.rotation.y = p.yaw
    if (p.st === 2) { // quỳ
      r.legL.rotation.x = -1.5; r.legR.rotation.x = -1.5; r.group.position.y = p.y - 0.5
    } else if (p.st === 1) { // đi
      r.walkPhase += dt * 10
      const sw = Math.sin(r.walkPhase) * 0.5
      r.legL.rotation.x = sw; r.legR.rotation.x = -sw
      r.group.position.y = p.y + Math.abs(Math.sin(r.walkPhase)) * 0.06
    } else { r.legL.rotation.x = 0; r.legR.rotation.x = 0 }
    // dép để ngoài của người khác
    if (p.bare && !r.sandals) {
      const sp = sandalSpotFor(id); const pair = makeSandalPair()
      pair.position.set(sp.x, sp.y, sp.z); pair.rotation.y = -0.4
      scene.add(pair); r.sandals = pair
    } else if (!p.bare && r.sandals) {
      scene.remove(r.sandals); r.sandals = undefined
    }
  }
  for (const [id, r] of remotes) {
    if (!seen.has(id)) { scene.remove(r.group); if (r.sandals) scene.remove(r.sandals); remotes.delete(id) }
  }
}
function updateCamera(lerpK = 1) {
  const off = new THREE.Vector3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch)).multiplyScalar(cam.dist)
  const target = avatarPos.clone().add(new THREE.Vector3(0, 1.7, 0))
  const desired = target.clone().add(off)
  if (lerpK >= 1) camera.position.copy(desired); else camera.position.lerp(desired, lerpK)
  camera.lookAt(target)
}

function startClimb() { phase.value = 'climbing'; climbT = 0 }

function removeSandalsAndEnter() {
  const pair = makeSandalPair()
  const spot = sandalSpotFor(mp.myId)
  pair.position.set(spot.x, spot.y, spot.z); pair.rotation.y = -0.4
  world.root.add(pair); sandalPair = pair
  sandalsOff.value = true
  // điểm tương tác "mang dép" khi quay ra
  const hit = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), new THREE.MeshBasicMaterial({ visible: false }))
  hit.position.set(spot.x, spot.y + 0.7, spot.z); world.root.add(hit)
  world.interactives.push({ object: hit, action: 'sandals', label: '👡 Mang dép', focus: spot.clone() })
  phase.value = 'inside'
  avatarPos.set(0, world.floorY, -4); avatarYaw = Math.PI
  cam.yaw = 0; cam.pitch = 0.28
}

function wearSandals() {
  if (sandalPair) { world.root.remove(sandalPair); sandalPair = null }
  const i = world.interactives.findIndex((x) => x.action === 'sandals')
  if (i >= 0) world.interactives.splice(i, 1)
  sandalsOff.value = false
  toast.value = '👟 Đã mang dép — bạn có thể rời chùa'
  setTimeout(() => (toast.value = ''), 2600)
}

// --- Ngồi quỳ trên thảm ---
const sitting = ref(false)
let nearMat: THREE.Vector3 | null = null

function setKneel(on: boolean) {
  if (!legL) return
  if (on) { legL.rotation.x = -1.5; legR.rotation.x = -1.5 }
  else { legL.rotation.x = 0; legR.rotation.x = 0 }
}
function sitDown() {
  if (!nearMat) return
  avatarPos.set(nearMat.x, world.floorY, nearMat.z)
  avatarYaw = Math.PI // quay mặt vào ban thờ
  walkAmt = 0; sitting.value = true
  placeAvatar(); avatar.position.y = avatarPos.y - 0.5; setKneel(true)
  cam.pitch = 0.1; cam.dist = 6.5
}
function standUp() { sitting.value = false; setKneel(false); cam.dist = 8 }

// --- interaction raycast (xét khoảng cách từ NHÂN VẬT tới vật) ---
const raycaster = new THREE.Raycaster()

function pickCenter(): { action: string; label: string } | null {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
  const hits = raycaster.intersectObjects(world.interactives.map((i) => i.object), false)
  for (const h of hits) {
    const found = world.interactives.find((i) => i.object === h.object)
    if (found && avatarPos.distanceTo(found.object.position) < 7.5) return { action: found.action, label: found.label }
  }
  // dự phòng: điểm tương tác gần nhất quanh nhân vật (không cần ngắm chính xác)
  let best: { action: string; label: string } | null = null, bd = 5
  for (const it of world.interactives) {
    const d = avatarPos.distanceTo(it.object.position)
    if (d < bd) { bd = d; best = { action: it.action, label: it.label } }
  }
  return best
}

function doInteract() {
  if (phase.value !== 'inside') return
  if (sitting.value) { standUp(); return } // đứng dậy
  if (nearMat) { sitDown(); return } // ngồi quỳ
  const hit = pickCenter()
  if (hit) {
    if (hit.action === 'sandals') wearSandals()
    else emit('interact', hit.action)
  }
}
function onClick() {
  if (phase.value !== 'inside') return
  if (moved) { moved = false; return }
  doInteract()
}

// --- Điều khiển cảm ứng (mobile): joystick ảo ---
const isTouch = ref(false)
const joyVec = reactive({ x: 0, y: 0 }) // -1..1 ; y âm = tiến
const joyBaseEl = ref<HTMLElement | null>(null)
let joyActive = false
function joyStart(e: PointerEvent) { joyActive = true; ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId); joyMove(e) }
function joyMove(e: PointerEvent) {
  if (!joyActive || !joyBaseEl.value) return
  const r = joyBaseEl.value.getBoundingClientRect()
  let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
  let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
  const len = Math.hypot(dx, dy); if (len > 1) { dx /= len; dy /= len }
  joyVec.x = dx; joyVec.y = dy
}
function joyEnd() { joyActive = false; joyVec.x = 0; joyVec.y = 0 }
const joyKnob = computed(() => ({ transform: `translate(${joyVec.x * 36}px, ${joyVec.y * 36}px)` }))

// --- loop ---
function animate() {
  raf = requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.05)
  const t = clock.elapsedTime

  world.updaters.forEach((u) => u(t, dt))

  if (phase.value === 'climbing') {
    climbT += dt * 0.06
    const n = fullPath.length - 1
    const f = Math.min(climbT, 1) * n
    const i = Math.floor(f), frac = f - i
    const a = fullPath[Math.min(i, n)], b = fullPath[Math.min(i + 1, n)]
    const p = a.clone().lerp(b, frac)
    avatarPos.set(p.x, p.y - 1.65, p.z) // chân nhân vật
    const dir = b.clone().sub(a); if (dir.lengthSq() > 1e-4) avatarYaw = Math.atan2(dir.x, dir.z)
    walkAmt = 1; walkPhase += dt * 9
    cam.yaw = avatarYaw + Math.PI; cam.pitch = 0.22
    placeAvatar(); animateLegs(); updateCamera(0.12)
    if (climbT >= 1) { phase.value = 'threshold'; avatarPos.set(fullPath[n].x, world.floorY, fullPath[n].z) }
  } else if (phase.value === 'inside') {
    const joyOn = Math.abs(joyVec.x) + Math.abs(joyVec.y) > 0.08
    const moving = joyOn || keys['w'] || keys['s'] || keys['a'] || keys['d'] || keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright']
    if (sitting.value) {
      if (moving) standUp() // đi -> đứng dậy
    }
    if (!sitting.value) {
      const speed = 6.5 * dt
      const camF = new THREE.Vector3(Math.sin(cam.yaw), 0, Math.cos(cam.yaw))
      const fwd = camF.clone().negate()
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x) // bên phải thật (sửa lỗi ngược trái/phải)
      const move = new THREE.Vector3()
      if (keys['w'] || keys['arrowup']) move.add(fwd)
      if (keys['s'] || keys['arrowdown']) move.sub(fwd)
      if (keys['d'] || keys['arrowright']) move.add(right)
      if (keys['a'] || keys['arrowleft']) move.sub(right)
      if (joyOn) { move.add(right.clone().multiplyScalar(joyVec.x)); move.add(fwd.clone().multiplyScalar(-joyVec.y)) }
      if (move.lengthSq() > 0) {
        move.normalize()
        avatarPos.x = THREE.MathUtils.clamp(avatarPos.x + move.x * speed, world.bounds.minX, world.bounds.maxX)
        avatarPos.z = THREE.MathUtils.clamp(avatarPos.z + move.z * speed, world.bounds.minZ, world.bounds.maxZ)
        avatarYaw = Math.atan2(move.x, move.z)
        walkAmt = Math.min(1, walkAmt + dt * 6); walkPhase += dt * 10
      } else {
        walkAmt = Math.max(0, walkAmt - dt * 6)
      }
      avatarPos.y = world.floorY
      placeAvatar(); animateLegs()
      // thảm quỳ gần nhất (ưu tiên hiện "Ngồi quỳ" khi đang đứng trên thảm)
      nearMat = null; let bd = 1.6
      for (const m of world.mats) { const d = avatarPos.distanceTo(m); if (d < bd) { bd = d; nearMat = m } }
      const hit = nearMat ? null : pickCenter()
      hoverLabel.value = nearMat ? '🧎 Ngồi quỳ' : (hit ? hit.label : '')
      updateCamera(0.2)
    } else {
      placeAvatar(); avatar.position.y = avatarPos.y - 0.5
      hoverLabel.value = '🧎 Đứng dậy'
      updateCamera(0.12)
    }
  } else if (phase.value === 'threshold') {
    placeAvatar(); animateLegs(); updateCamera(0.1)
  } else {
    placeAvatar() // intro: giữ camera điện ảnh
  }

  syncRemotes(dt) // người chơi khác
  renderer.render(scene, camera)
}

function onResize() {
  if (!renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function onKey(e: KeyboardEvent, down: boolean) {
  const el = document.activeElement as HTMLElement | null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
    for (const k in keys) keys[k] = false // đang gõ chat -> không điều khiển
    return
  }
  keys[e.key.toLowerCase()] = down
}

function onPointerDown(e: PointerEvent) {
  if (phase.value !== 'inside') return
  dragging = true
  moved = false
  lastX = e.clientX
  lastY = e.clientY
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  if (Math.abs(dx) + Math.abs(dy) > 4) moved = true
  cam.yaw -= dx * 0.005
  cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.004, -0.15, 1.1)
  lastX = e.clientX
  lastY = e.clientY
}
function onPointerUp() {
  dragging = false
}

function startScene() {
  const canvas = canvasEl.value
  if (!canvas) { requestAnimationFrame(startScene); return } // chờ canvas gắn vào DOM
 try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xcfe3ef)
  scene.fog = new THREE.Fog(0xd7e6ef, 150, 380)

  // bầu trời gradient (vòm)
  const skyGeo = new THREE.SphereGeometry(440, 32, 16)
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x6ea6d6) },
      mid: { value: new THREE.Color(0xcfe3ef) },
      bottom: { value: new THREE.Color(0xeee3cf) }
    },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
      void main(){
        float h = normalize(vP).y;
        vec3 c = h > 0.0 ? mix(mid, top, pow(h,0.6)) : mix(mid, bottom, pow(-h,0.5));
        gl_FragColor = vec4(c,1.0);
      }`
  })
  scene.add(new THREE.Mesh(skyGeo, skyMat))

  // ánh sáng môi trường (IBL) cho kim loại vàng/đồng lấp lánh
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.3, 1200)

  // ánh sáng (dịu, không cháy sáng)
  const hemi = new THREE.HemisphereLight(0xdce8f0, 0x6a5a48, 0.75)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.25)
  sun.position.set(40, 80, 60)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 10
  sun.shadow.camera.far = 260
  sun.shadow.bias = -0.0004
  const sc = sun.shadow.camera as THREE.OrthographicCamera
  sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90
  scene.add(sun)
  scene.add(new THREE.AmbientLight(0xffffff, 0.42))

  world = buildWorld(scene)
  const la = buildAvatar(0x5f6f82); avatar = la.group; legL = la.legL; legR = la.legR; scene.add(avatar)

  // --- Multiplayer: kết nối & phát vị trí của mình ---
  mp.connect(() => ({
    x: avatarPos.x, y: avatarPos.y, z: avatarPos.z, yaw: avatarYaw,
    st: sitting.value ? 2 : (walkAmt > 0.35 ? 1 : 0),
    bare: sandalsOff.value
  }))

  // đèn ấm dịu trong đại điện lớn (nhiều đèn phủ rộng, không cháy trần)
  for (const lz of [-26, -38, -50]) {
    const hl = new THREE.PointLight(0xffe0b0, 30, 52, 1.4)
    hl.position.set(0, world.floorY + 6, lz)
    scene.add(hl)
  }
  for (const lx of [-18, 18]) {
    const hl = new THREE.PointLight(0xffe0b0, 18, 42, 1.4)
    hl.position.set(lx, world.floorY + 6, -34)
    scene.add(hl)
  }
  const yardLight = new THREE.PointLight(0xffe8c0, 16, 44, 1.5)
  yardLight.position.set(0, world.floorY + 7, 10)
  scene.add(yardLight)

  // đường hành hương: cầu thang -> qua cổng -> sân -> thềm đại điện
  const fy = world.floorY + 1.7
  fullPath = [
    ...world.climbPath,
    new THREE.Vector3(0, fy, 54), // băng bãi cỏ tới cổng
    new THREE.Vector3(0, fy, 44), // qua cổng tam quan
    new THREE.Vector3(0, fy, 28), // sân cột kinh
    new THREE.Vector3(0, fy, 12),
    new THREE.Vector3(0, fy, 0),
    new THREE.Vector3(8, fy, -6)  // tới thềm đại điện
  ]

  // nhân vật đứng dưới chân núi; camera ngắm toàn cảnh chùa trên đỉnh núi
  avatarPos.set(0, -9, 94); avatarYaw = Math.PI; placeAvatar()
  camera.position.set(0, 28, 136)
  camera.lookAt(0, world.floorY - 2, -14)

  // lối tắt dev: .../hanh-huong#inside vào thẳng trong chùa
  if (import.meta.dev && location.hash === '#inside') {
    phase.value = 'inside'; sandalsOff.value = true
    avatarPos.set(0, world.floorY, -4); avatarYaw = Math.PI
    cam.yaw = 0; cam.pitch = 0.3
  }

  try { isTouch.value = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window } catch {}
  chatOpen.value = !isTouch.value // mobile: mặc định thu gọn chat

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', (e) => onKey(e, true))
  window.addEventListener('keyup', (e) => onKey(e, false))
  animate()
 } catch (e: any) {
  console.error('[3D] init failed:', e && e.message, '\n', e && e.stack)
 }
}
onMounted(startScene)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', onResize)
  mp.disconnect()
  renderer?.dispose()
})

defineExpose({ phase })
</script>

<template>
  <div class="scene-wrap" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointerleave="onPointerUp">
    <canvas ref="canvasEl" class="scene-canvas" @click="onClick" />

    <!-- số người online -->
    <div class="online-badge"><span class="dot" /> {{ online }} người đang ở chùa</div>

    <!-- Lớp phủ: Mở đầu -->
    <transition name="fade">
      <div v-if="phase === 'intro'" class="overlay intro">
        <div class="intro-card">
          <p class="eyebrow">Hành hương</p>
          <h1>Chùa Trên Núi</h1>
          <p class="sub">Ngôi cổ tự tọa lạc trên đỉnh non cao. Vượt từng bậc đá,
            qua cổng tam quan uy nghi để bước vào chốn thiền tịnh.</p>
          <button class="btn-gold" @click="startClimb">🪷 Bắt đầu leo núi</button>
        </div>
      </div>
    </transition>

    <!-- Lớp phủ: Cởi dép ở thềm -->
    <transition name="fade">
      <div v-if="phase === 'threshold'" class="overlay threshold">
        <div class="intro-card">
          <h2>Trước thềm chính điện</h2>
          <p class="sub">Theo lệ nhà chùa, xin cởi dép để ngoài trước khi vào lễ Phật.</p>
          <button class="btn-gold" @click="removeSandalsAndEnter">👡 Cởi dép & bước vào</button>
        </div>
      </div>
    </transition>

    <!-- HUD khi ở trong chùa -->
    <template v-if="phase === 'inside'">
      <transition name="fade">
        <div v-if="hoverLabel" class="action-hint">{{ hoverLabel }} <span>— bấm để thực hiện</span></div>
      </transition>
      <div v-if="!isTouch" class="controls-hint">
        <span><b>W A S D</b> / phím mũi tên — đi lại</span>
        <span>Giữ &amp; kéo chuột — xoay quanh</span>
        <span>Lại gần vật &amp; bấm — tương tác</span>
      </div>

      <!-- Điều khiển cảm ứng (mobile) -->
      <template v-if="isTouch">
        <div ref="joyBaseEl" class="joystick"
             @pointerdown.stop.prevent="joyStart" @pointermove.stop.prevent="joyMove"
             @pointerup.stop="joyEnd" @pointerleave.stop="joyEnd" @pointercancel.stop="joyEnd">
          <div class="joystick-knob" :style="joyKnob" />
        </div>
        <button class="touch-act" @pointerdown.stop.prevent="doInteract">🙏</button>
      </template>
    </template>

    <!-- thông báo nhỏ -->
    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <!-- nhãn trạng thái đang leo -->
    <transition name="fade">
      <div v-if="phase === 'climbing'" class="climb-note">Đang leo lên chùa… hãy giữ tâm an tịnh 🌄</div>
    </transition>

    <!-- Khung chat (góc phải) -->
    <div class="chat" @pointerdown.stop @pointerup.stop @pointermove.stop>
      <div v-show="chatOpen" class="chat-panel">
        <div class="chat-head">💬 Trò chuyện tại chùa
          <button class="chat-x" @click="chatOpen = false">✕</button>
        </div>
        <div ref="chatScrollEl" class="chat-msgs">
          <div v-if="!messages.length" class="chat-empty">Chưa có tin nhắn — chào mọi người nào! 🙏</div>
          <div v-for="(m, i) in messages" :key="i" class="chat-msg" :class="{ mine: m.mine }">
            <b>{{ m.name }}:</b> {{ m.text }}
          </div>
        </div>
        <form class="chat-form" @submit.prevent="onSendChat">
          <input v-model="chatText" maxlength="200" placeholder="Nhắn gì đó…" />
          <button type="submit">Gửi</button>
        </form>
      </div>
      <button class="chat-toggle" @click="chatOpen = !chatOpen">💬<span v-if="!chatOpen && messages.length" class="chat-badge">{{ messages.length }}</span></button>
    </div>
  </div>
</template>

<style scoped>
.scene-wrap { position: fixed; inset: 0; overflow: hidden; background: #bcd4e6; touch-action: none; }
.scene-canvas { display: block; width: 100%; height: 100%; cursor: grab; }
.scene-canvas:active { cursor: grabbing; }

.overlay {
  position: absolute; inset: 0; display: grid; place-items: center;
  background: linear-gradient(to bottom, rgba(20,12,6,0) 30%, rgba(20,12,6,.55) 100%);
  z-index: 10; padding: 24px;
}
.overlay.intro, .overlay.threshold { align-items: end; padding-bottom: 7vh; }
.intro-card {
  max-width: 440px; text-align: center; color: #f5efe0;
  background: rgba(40,26,16,.55); backdrop-filter: blur(8px);
  border: 1px solid rgba(201,163,86,.5); border-radius: 20px; padding: 32px 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,.4);
}
.eyebrow { letter-spacing: .35em; text-transform: uppercase; font-size: .7rem; color: #c9a356; margin-bottom: 8px; }
.intro-card h1 { font-family: 'Cormorant Garamond','Noto Serif',serif; font-size: 3rem; line-height: 1; margin: 0 0 14px; color: #f3e6c4; }
.intro-card h2 { font-family: 'Cormorant Garamond','Noto Serif',serif; font-size: 2rem; margin: 0 0 12px; color: #f3e6c4; }
.sub { font-size: 1rem; line-height: 1.6; opacity: .9; margin-bottom: 24px; }
.btn-gold {
  background: linear-gradient(135deg,#d9b969,#b4863f); color: #2a1a0c; font-weight: 600;
  border: none; padding: 14px 26px; border-radius: 999px; font-size: 1.05rem; cursor: pointer;
  box-shadow: 0 8px 24px rgba(201,163,86,.4); transition: transform .2s, box-shadow .2s;
}
.btn-gold:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(201,163,86,.55); }

.crosshair {
  position: absolute; left: 50%; top: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px;
  border: 2px solid rgba(255,255,255,.7); border-radius: 50%; pointer-events: none; z-index: 5;
}
.action-hint {
  position: absolute; left: 50%; top: 56%; transform: translateX(-50%);
  background: rgba(40,26,16,.8); color: #f3e6c4; padding: 8px 18px; border-radius: 999px;
  border: 1px solid rgba(201,163,86,.5); font-size: 1rem; z-index: 6; pointer-events: none; white-space: nowrap;
}
.action-hint span { opacity: .7; font-size: .85rem; }
.controls-hint {
  position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%);
  display: flex; gap: 18px; flex-wrap: wrap; justify-content: center;
  background: rgba(40,26,16,.5); color: #f5efe0; padding: 10px 18px; border-radius: 14px;
  font-size: .82rem; z-index: 6; pointer-events: none; backdrop-filter: blur(6px);
}
.controls-hint b { color: #c9a356; }
.controls-hint.hint-touch { bottom: 164px; font-size: .74rem; padding: 7px 12px; gap: 10px; max-width: 92vw; flex-direction: column; text-align: center; }
.joystick {
  position: absolute; left: 22px; bottom: 28px; width: 118px; height: 118px; z-index: 9;
  border-radius: 50%; background: rgba(40,26,16,.35); border: 2px solid rgba(201,163,86,.45);
  backdrop-filter: blur(4px); touch-action: none; display: grid; place-items: center;
}
.joystick-knob {
  width: 52px; height: 52px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #e8d08a, #b4863f);
  box-shadow: 0 3px 10px rgba(0,0,0,.4); pointer-events: none;
}
.touch-act {
  position: absolute; right: 24px; bottom: 44px; width: 76px; height: 76px; z-index: 9;
  border-radius: 50%; border: 2px solid rgba(201,163,86,.6); font-size: 2rem;
  background: rgba(40,26,16,.55); backdrop-filter: blur(4px); cursor: pointer;
  touch-action: none; display: grid; place-items: center; -webkit-tap-highlight-color: transparent;
}
.touch-act:active { background: rgba(201,163,86,.5); }

/* Khung chat góc phải */
.chat { position: absolute; right: 14px; bottom: 14px; z-index: 11; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.chat-panel {
  width: 290px; max-width: 80vw; height: 300px; max-height: 46vh; display: flex; flex-direction: column;
  background: rgba(32,22,14,.82); border: 1px solid rgba(201,163,86,.45); border-radius: 14px;
  overflow: hidden; backdrop-filter: blur(8px); box-shadow: 0 14px 40px rgba(0,0,0,.4);
}
.chat-head { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; color: #f3e6c4; font-size: .85rem; border-bottom: 1px solid rgba(201,163,86,.3); }
.chat-x { border: none; background: transparent; color: #c9a356; cursor: pointer; font-size: .9rem; }
.chat-msgs { flex: 1; overflow-y: auto; padding: 8px 12px; display: flex; flex-direction: column; gap: 5px; }
.chat-empty { color: rgba(245,239,224,.5); font-size: .8rem; text-align: center; margin: auto 0; }
.chat-msg { color: #ece3d0; font-size: .84rem; line-height: 1.35; word-break: break-word; }
.chat-msg b { color: #d9b24a; }
.chat-msg.mine b { color: #8fd6a0; }
.chat-form { display: flex; gap: 6px; padding: 8px; border-top: 1px solid rgba(201,163,86,.3); }
.chat-form input { flex: 1; min-width: 0; background: rgba(255,255,255,.1); border: 1px solid rgba(201,163,86,.35); color: #fff; padding: 8px 10px; border-radius: 10px; font-size: .85rem; outline: none; }
.chat-form input:focus { border-color: #c9a356; }
.chat-form button { background: linear-gradient(135deg,#d9b969,#b4863f); color: #2a1a0c; border: none; padding: 0 14px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: .85rem; }
.chat-toggle {
  width: 50px; height: 50px; border-radius: 50%; border: 1px solid rgba(201,163,86,.5);
  background: rgba(40,26,16,.7); backdrop-filter: blur(6px); cursor: pointer; font-size: 1.3rem;
  position: relative; display: grid; place-items: center;
}
.chat-badge { position: absolute; top: -4px; right: -4px; background: #d23b2e; color: #fff; font-size: .7rem; min-width: 18px; height: 18px; border-radius: 9px; display: grid; place-items: center; padding: 0 4px; }
.online-badge {
  position: absolute; top: 16px; right: 16px; z-index: 8;
  display: flex; align-items: center; gap: 8px;
  background: rgba(40,26,16,.6); color: #f5efe0; padding: 7px 14px; border-radius: 999px;
  border: 1px solid rgba(201,163,86,.4); backdrop-filter: blur(6px); font-size: .85rem;
}
.online-badge .dot { width: 9px; height: 9px; border-radius: 50%; background: #5bd66e; box-shadow: 0 0 8px #5bd66e; }
.toast {
  position: absolute; left: 50%; top: 14%; transform: translateX(-50%);
  background: rgba(40,26,16,.85); color: #f3e6c4; padding: 10px 22px; border-radius: 999px;
  border: 1px solid rgba(201,163,86,.6); font-size: 1rem; z-index: 7; backdrop-filter: blur(6px);
}
.climb-note {
  position: absolute; left: 50%; bottom: 40px; transform: translateX(-50%);
  color: #f5efe0; background: rgba(40,26,16,.5); padding: 10px 22px; border-radius: 999px;
  z-index: 6; backdrop-filter: blur(6px); font-size: .95rem;
}
.fade-enter-active, .fade-leave-active { transition: opacity .6s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
