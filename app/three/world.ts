/**
 * Thế giới chùa trên núi (Three.js primitives, không cần model ngoài).
 * Phong cách: Bái Đính / Tam Chúc — cổng tam quan hoành tráng, đại điện mái 3 tầng đồ sộ,
 * ban Tam Thế 3 tượng lớn hào quang lá đề, sân trong rất rộng (100 chỗ quỳ).
 */
import * as THREE from 'three'

export interface Interactive {
  object: THREE.Object3D
  action: string
  label: string
  focus: THREE.Vector3
}

export interface World {
  root: THREE.Group
  updaters: Array<(t: number, dt: number) => void>
  interactives: Interactive[]
  climbPath: THREE.Vector3[]
  bell?: { pivot: THREE.Object3D; swing: (strength: number) => void }
  floorY: number
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  sandalSpot: THREE.Vector3
  mats: THREE.Vector3[]
  coiDepZ: number // vạch cam: qua vạch này (vào lễ) phải cởi dép, ra phải mang dép
}

// ---- Bảng màu ------------------------------------------------------------
const M = {
  red: () => new THREE.MeshStandardMaterial({ color: 0x8e2f28, roughness: 0.6 }),
  redDark: () => new THREE.MeshStandardMaterial({ color: 0x6f241f, roughness: 0.7 }),
  gold: () => new THREE.MeshStandardMaterial({ color: 0xd4af5a, metalness: 0.95, roughness: 0.22 }),
  goldGlow: () =>
    new THREE.MeshStandardMaterial({ color: 0xd8b45e, metalness: 0.9, roughness: 0.25, emissive: 0x6a4e12, emissiveIntensity: 0.35 }),
  bronze: () => new THREE.MeshStandardMaterial({ color: 0x8a6a34, metalness: 0.9, roughness: 0.35 }),
  bronzeDark: () => new THREE.MeshStandardMaterial({ color: 0x6a5230, metalness: 0.85, roughness: 0.45 }),
  wood: () => new THREE.MeshStandardMaterial({ color: 0x5b3d28, roughness: 0.9 }),
  woodDark: () => new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 }),
  woodCol: () => new THREE.MeshStandardMaterial({ color: 0x4a2c1c, roughness: 0.85 }), // cột gỗ sẫm
  floor: () => new THREE.MeshStandardMaterial({ color: 0x8a7154, roughness: 0.8 }),
  stone: () => new THREE.MeshStandardMaterial({ color: 0x8f8a80, roughness: 1 }),
  stoneLight: () => new THREE.MeshStandardMaterial({ color: 0xa5a097, roughness: 1 }),
  stoneDark: () => new THREE.MeshStandardMaterial({ color: 0x6a655d, roughness: 1 }),
  wall: () => new THREE.MeshStandardMaterial({ color: 0xcdbd92, roughness: 0.95 }),
  brick: () => new THREE.MeshStandardMaterial({ color: 0x9c5038, roughness: 0.95 }), // nền gạch đỏ
  tile: () => new THREE.MeshStandardMaterial({ color: 0x6e4535, roughness: 0.6, metalness: 0.1 }),   // ngói nâu (cổng)
  tileHall: () => new THREE.MeshStandardMaterial({ color: 0x3f4a56, roughness: 0.55, metalness: 0.2 }), // ngói xám (đại điện)
  rock: () => new THREE.MeshStandardMaterial({ color: 0x5c5a52, roughness: 1 }),
  grass: () => new THREE.MeshStandardMaterial({ color: 0x4a6b3c, roughness: 1 }),
  pine: () => new THREE.MeshStandardMaterial({ color: 0x27402a, roughness: 1 }),
  cushion: () => new THREE.MeshStandardMaterial({ color: 0xb23a2a, roughness: 1 }),
  cushionGold: () => new THREE.MeshStandardMaterial({ color: 0xc9a356, roughness: 0.8 }),
  lamp: () => new THREE.MeshStandardMaterial({ color: 0xd23b2e, emissive: 0xff5a3c, emissiveIntensity: 0.9, roughness: 0.6 })
}

// Texture tròn mềm cho khói & sương
let _softTex: THREE.Texture | null = null
function softTexture() {
  if (_softTex) return _softTex
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  _softTex = new THREE.CanvasTexture(c); _softTex.colorSpace = THREE.SRGBColorSpace
  return _softTex
}

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true
  return m
}

/** Mái chùa cong nhiều chi tiết: chóp 4 mặt + bờ nóc vàng + đầu đao cong + bầu nóc. */
function pagodaRoof(width: number, depth: number, height: number, tileMat: THREE.Material) {
  const g = new THREE.Group()
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.72, height, 4), tileMat)
  roof.rotation.y = Math.PI / 4
  roof.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth))
  roof.castShadow = true
  g.add(roof)
  // bờ nóc vàng
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, width * 0.92, 8), M.gold())
  ridge.rotation.z = Math.PI / 2; ridge.position.y = height * 0.42; g.add(ridge)
  // bầu nóc (chóp trên đỉnh)
  const finialBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 0.9, 10), M.gold()); finialBase.position.y = height * 0.5; g.add(finialBase)
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), M.gold()); finial.position.y = height * 0.5 + 0.7; g.add(finial)
  // đầu đao cong 4 góc + con giống
  const halfW = width * 0.47, halfD = depth * 0.47, eaveY = -height * 0.28
  for (const [cx, cz] of [[halfW, halfD], [-halfW, halfD], [halfW, -halfD], [-halfW, -halfD]] as const) {
    const eave = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.17, 2.6, 6), M.gold())
    eave.position.set(cx, eaveY + 0.9, cz)
    eave.rotation.z = Math.sign(cx) * -1.1; eave.rotation.x = Math.sign(cz) * 0.6
    g.add(eave)
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.09, 8, 12, Math.PI * 1.3), M.gold())
    curl.position.set(cx + Math.sign(cx) * 0.9, eaveY + 1.9, cz + Math.sign(cz) * 0.6)
    curl.rotation.y = Math.sign(cx) * Math.PI / 2
    g.add(curl)
  }
  return g
}

function pillar(height: number, radius = 0.35, x = 0, y = 0, z = 0, mat = M.red()) {
  const g = new THREE.Group()
  const col = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.05, height, 16), mat)
  col.position.y = height / 2; col.castShadow = true
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.5, radius * 1.7, 0.5, 16), M.stone())
  base.position.y = 0.25
  g.add(base, col); g.position.set(x, y, z)
  return g
}

/** Trụ đá vuông có bảng câu đối + chóp (cho cổng tam quan). */
function stonePillarTall(h: number, x: number, y: number, z: number) {
  const g = new THREE.Group()
  g.add(box(1.5, 1.0, 1.5, M.stoneDark(), 0, 0.5, 0))       // đế
  g.add(box(1.1, h, 1.1, M.stoneLight(), 0, h / 2 + 0.9, 0)) // thân
  // bảng câu đối (đỏ chữ vàng) 2 mặt
  for (const s of [1, -1]) {
    g.add(box(0.75, h * 0.72, 0.08, M.redDark(), 0, h * 0.42, s * 0.57))
    g.add(box(0.5, h * 0.64, 0.04, M.gold(), 0, h * 0.42, s * 0.6))
  }
  // chóp sen + búp
  g.add(box(1.4, 0.4, 1.4, M.stone(), 0, h + 1.0, 0))
  const lotus = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.75, 0.8, 10), M.stoneLight()); lotus.position.y = h + 1.6; g.add(lotus)
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), M.stoneLight()); bud.position.y = h + 2.25; g.add(bud)
  g.position.set(x, y, z)
  return g
}

// ---- Cổng tam quan HOÀNH TRÁNG (tường + vòm đá + mái nhiều tầng) -----------
function buildArchGate(y: number, z: number) {
  const g = new THREE.Group(); g.position.set(0, y, z)
  const W = 34, wallH = 9, depth = 2.6
  // đế đá
  g.add(box(W + 4, 1.4, depth + 2, M.stone(), 0, 0.7, 0))
  // 4 trụ đá lớn + câu đối + chóp (ngăn 3 lối)
  const openMain = 6, openSide = 3.4, pierW = 3
  const centers = [0, -(openMain / 2 + pierW + openSide / 2), openMain / 2 + pierW + openSide / 2]
  const opens = [openMain, openSide, openSide]
  g.add(stonePillarTall(wallH + 1, -(W / 2 - 1), 1.4, 0))
  g.add(stonePillarTall(wallH + 1, (W / 2 - 1), 1.4, 0))
  for (const c of [centers[1] - openSide / 2 - 1.5, centers[2] + openSide / 2 + 1.5]) g.add(stonePillarTall(wallH + 1, c, 1.4, 0))
  // tường ochre lấp giữa các lối
  const sorted = centers.map((c, i) => [c - opens[i] / 2, c + opens[i] / 2] as const).sort((a, b) => a[0] - b[0])
  let cur = -W / 2; const segs: Array<[number, number]> = []
  for (const [a, b] of sorted) { if (a > cur) segs.push([cur, a]); cur = Math.max(cur, b) }
  if (cur < W / 2) segs.push([cur, W / 2])
  for (const [a, b] of segs) g.add(box(b - a, wallH, depth, M.wall(), (a + b) / 2, 1.4 + wallH / 2, 0))
  // vòm đá + tường trên mỗi lối
  centers.forEach((c, i) => {
    const o = opens[i], archR = o / 2
    const arch = new THREE.Mesh(new THREE.TorusGeometry(archR, 0.55, 8, 24, Math.PI), M.stoneLight())
    arch.position.set(c, 1.4 + o * 0.95, 0); g.add(arch)
    g.add(box(o + 0.6, wallH - o * 0.95 - 1.0, depth, M.wall(), c, 1.4 + o * 0.95 + (wallH - o * 0.95 - 1.0) / 2 + 0.5, 0))
    for (const s of [-1, 1]) g.add(box(0.5, o * 0.95, depth + 0.2, M.stoneLight(), c + s * (archR + 0.25), 1.4 + o * 0.47, 0))
    // cửa gỗ trong lối chính & phụ
    g.add(box(o * 0.78, o * 0.9, 0.2, M.wood(), c, 1.4 + o * 0.45, depth / 2 - 0.05))
  })
  // MÁI: lối giữa 2 tầng cao, 2 lối bên 1 tầng — dáng tam quan đồ sộ
  const mTop = pagodaRoof(W * 0.42, depth + 4.5, 3.2, M.tile()); mTop.position.set(0, 1.4 + wallH + 5.4, 0); g.add(mTop)
  const mMid = pagodaRoof(W * 0.52, depth + 5.5, 3.4, M.tile()); mMid.position.set(0, 1.4 + wallH + 2.2, 0); g.add(mMid)
  for (const s of [-1, 1]) {
    const side = pagodaRoof(11, depth + 3.5, 2.6, M.tile()); side.position.set(s * (W / 2 - 5.5), 1.4 + wallH - 0.4, 0); g.add(side)
  }
  // biển hiệu đỏ chữ vàng lối giữa
  g.add(box(6.5, 1.8, 0.3, M.redDark(), 0, 1.4 + wallH + 0.6, depth / 2 + 0.25))
  g.add(box(5.6, 1.1, 0.1, M.gold(), 0, 1.4 + wallH + 0.6, depth / 2 + 0.42))
  // bậc thềm trước cổng
  g.add(box(W, 0.4, 2.4, M.stone(), 0, 0.2, depth / 2 + 1.6))
  return g
}

// ---- Cầu thang đá -------------------------------------------------------
function buildStairs(from: THREE.Vector3, to: THREE.Vector3, steps: number, width: number) {
  const g = new THREE.Group(); const path: THREE.Vector3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = THREE.MathUtils.lerp(from.x, to.x, t), yy = THREE.MathUtils.lerp(from.y, to.y, t), z = THREE.MathUtils.lerp(from.z, to.z, t)
    if (i < steps) { const run = (from.z - to.z) / steps; g.add(box(width, 0.42, run * 1.05, i % 2 ? M.stone() : M.stoneLight(), x, yy + 0.2, z - run / 2)) }
    path.push(new THREE.Vector3(x, yy + 1.6, z))
  }
  for (let i = 0; i <= steps; i += 2) {
    const t = i / steps, yy = THREE.MathUtils.lerp(from.y, to.y, t) + 0.6, z = THREE.MathUtils.lerp(from.z, to.z, t)
    for (const s of [1, -1]) g.add(box(0.5, 1.4, 0.5, M.stone(), s * (width / 2 + 0.4), yy, z))
  }
  const railLen = from.distanceTo(to)
  for (const side of [1, -1]) {
    const rail = box(0.4, 0.4, railLen, M.stoneLight())
    rail.position.set(side * (width / 2 + 0.4), (from.y + to.y) / 2 + 1.5, (from.z + to.z) / 2)
    rail.rotation.x = Math.atan2(to.y - from.y, from.z - to.z); g.add(rail)
  }
  return { group: g, path }
}

// ---- Cột kinh (sân ngoài) ------------------------------------------------
function kinhPillar(x: number, y: number, z: number) {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 12), M.stone()))
  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.4, 12), M.stoneLight()); base2.position.y = 0.4; g.add(base2)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 4.6, 8), M.stoneLight()); shaft.position.y = 2.9; shaft.castShadow = true; g.add(shaft)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 3.0, 8), new THREE.MeshStandardMaterial({ color: 0xcf7a33, roughness: 0.8 })); band.position.y = 2.9; g.add(band)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.6, 0.7, 12), M.stone()); cap.position.y = 5.5; g.add(cap)
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), M.stoneLight()); bud.position.y = 6.0; g.add(bud)
  g.position.set(x, y, z); return g
}
function pineTree(x: number, y: number, z: number, scale = 1) {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.6, 6), M.wood()); trunk.position.y = 0.8; g.add(trunk)
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.4 - i * 0.32, 1.8, 7), M.pine()); c.position.y = 1.6 + i * 1.1; c.castShadow = true; g.add(c) }
  g.position.set(x, y, z); g.scale.setScalar(scale); return g
}
function rock(x: number, y: number, z: number, s: number) {
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), M.rock()); r.position.set(x, y, z)
  r.rotation.set(Math.random(), Math.random(), Math.random()); r.castShadow = true; r.receiveShadow = true; return r
}
function shrub(x: number, y: number, z: number, s = 1) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.9 * s, 10, 8), M.grass()); b.position.set(x, y + 0.6 * s, z); b.scale.y = 0.8; b.castShadow = true; return b
}

// ---- Lồng đèn đỏ ---------------------------------------------------------
function lantern(x: number, y: number, z: number, updaters: World['updaters'], scale = 1) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), M.lamp()); body.scale.y = 1.15; g.add(body)
  g.add(box(0.5, 0.08, 0.5, M.gold(), 0, 0.46, 0)); g.add(box(0.5, 0.08, 0.5, M.gold(), 0, -0.46, 0))
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), M.gold()); tassel.position.y = -0.75; g.add(tassel)
  // bỏ PointLight để nhẹ máy — đèn vẫn phát sáng nhờ vật liệu emissive
  g.position.set(x, y, z); g.scale.setScalar(scale)
  const phase = Math.random() * 6
  updaters.push((t) => { g.rotation.z = Math.sin(t * 1.3 + phase) * 0.07 })
  return g
}

// ---- Khói nhang mềm (shader points) --------------------------------------
function smokeColumn(x: number, y: number, z: number, updaters: World['updaters'],
  opts: { count?: number; height?: number; size?: number; color?: number; speed?: number; spread?: number } = {}) {
  const COUNT = opts.count ?? 90, H = opts.height ?? 5, SPREAD = opts.spread ?? 0.35
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(COUNT * 3), life = new Float32Array(COUNT), seed = new Float32Array(COUNT), baseX = new Float32Array(COUNT), baseZ = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) {
    baseX[i] = (Math.random() - 0.5) * SPREAD; baseZ[i] = (Math.random() - 0.5) * SPREAD
    pos[i * 3] = baseX[i]; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = baseZ[i]; life[i] = Math.random(); seed[i] = Math.random()
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aLife', new THREE.BufferAttribute(life, 1)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTex: { value: softTexture() }, uColor: { value: new THREE.Color(opts.color ?? 0xbcae96) }, uSize: { value: opts.size ?? 130 }, uOpacity: { value: opts.color !== undefined ? 0.5 : 0.78 } },
    vertexShader: `attribute float aLife; attribute float aSeed; uniform float uSize; varying float vAlpha;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); float grow = 0.35 + aLife*1.8; gl_PointSize = uSize * grow * (1.0/max(-mv.z,0.1)); vAlpha = sin(aLife*3.14159); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uTex; uniform vec3 uColor; uniform float uOpacity; varying float vAlpha;
      void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(uColor, a*vAlpha*uOpacity); }`
  })
  const pts = new THREE.Points(geo, mat); pts.position.set(x, y, z); pts.frustumCulled = false
  const SPEED = opts.speed ?? 0.22
  updaters.push((t, dt) => {
    const p = geo.attributes.position as THREE.BufferAttribute, l = geo.attributes.aLife as THREE.BufferAttribute
    for (let i = 0; i < COUNT; i++) {
      let li = l.getX(i) + dt * SPEED * (0.7 + seed[i] * 0.6)
      if (li > 1) { li -= 1; baseX[i] = (Math.random() - 0.5) * SPREAD; baseZ[i] = (Math.random() - 0.5) * SPREAD }
      l.setX(i, li); p.setX(i, baseX[i] + Math.sin(t * 0.7 + seed[i] * 6.28) * li * 0.6); p.setY(i, li * H); p.setZ(i, baseZ[i] + Math.cos(t * 0.5 + seed[i] * 6.28) * li * 0.3)
    }
    p.needsUpdate = true; l.needsUpdate = true
  })
  return pts
}

// ---- Lư hương lớn --------------------------------------------------------
function buildCenser(x: number, y: number, z: number, updaters: World['updaters']) {
  const g = new THREE.Group()
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 0.9, 1.3, 24), M.bronze()); bowl.position.y = 1.6
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 1.2, 20), M.bronze()); foot.position.y = 0.6
  for (let i = -1; i <= 1; i++) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6), M.redDark()); stick.position.set(i * 0.28, 3.2, 0)
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), M.lamp()); tip.position.set(i * 0.28, 4.2, 0); g.add(stick, tip)
  }
  g.add(foot, bowl); g.add(smokeColumn(0, 2.4, 0, updaters, { height: 6 })); g.position.set(x, y, z); g.castShadow = true
  return g
}

// ---- Chuông đồng ---------------------------------------------------------
function buildBell(x: number, y: number, z: number) {
  const frame = new THREE.Group()
  frame.add(box(0.3, 4.6, 0.3, M.wood(), -1.5, 2.3, 0)); frame.add(box(0.3, 4.6, 0.3, M.wood(), 1.5, 2.3, 0)); frame.add(box(3.6, 0.35, 0.35, M.wood(), 0, 4.75, 0))
  const bell = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 2.6, 24, 1, true), M.bronze()); body.position.y = -1.5
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.bronze()); top.position.y = -0.2
  bell.add(top, body); bell.position.y = -0.1
  const swingGroup = new THREE.Group(); swingGroup.add(bell)
  const g = new THREE.Group(); g.position.set(x, y, z); g.add(frame)
  const pivot = new THREE.Object3D(); pivot.position.y = 4.55; pivot.add(swingGroup); g.add(pivot)
  let vel = 0, ang = 0
  const swing = (s: number) => { vel += s }
  const update = (_t: number, dt: number) => { const acc = -14 * ang - 1.6 * vel; vel += acc * dt; ang += vel * dt; swingGroup.rotation.x = ang }
  return { group: g, pivot: swingGroup, swing, update }
}

// ---- Tượng Phật LỚN + hào quang lá đề (như ảnh thật) ---------------------
function buildBuddha(x: number, y: number, z: number, scale = 1) {
  const g = new THREE.Group()
  // hào quang lá đề (mandorla) sau lưng — hình lá nhọn vàng rực
  const haloMat = new THREE.MeshStandardMaterial({ color: 0xe8c45a, metalness: 0.7, roughness: 0.3, emissive: 0xffb347, emissiveIntensity: 0.55, side: THREE.DoubleSide })
  const flame = new THREE.Mesh(new THREE.ConeGeometry(2.1, 6.2, 20), haloMat)
  flame.scale.set(1, 1, 0.14); flame.position.set(0, 4.4, -0.55); g.add(flame)
  const flameInner = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4.6, 18), new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffc24a, emissiveIntensity: 0.75, side: THREE.DoubleSide }))
  flameInner.scale.set(1, 1, 0.12); flameInner.position.set(0, 4.3, -0.45); g.add(flameInner)
  // bệ sen 2 tầng
  const lotus = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.2, 0.9, 24), M.goldGlow()); lotus.position.y = 0.45; g.add(lotus)
  for (const [ring, ry, rr, sc] of [[16, 0.8, 1.9, 0.55], [14, 1.15, 1.55, 0.48]] as const) {
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2 + (ry > 1 ? 0.2 : 0)
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), M.gold())
      petal.scale.set(sc, sc * 0.8, sc * 1.7); petal.position.set(Math.cos(a) * rr, ry, Math.sin(a) * rr)
      petal.lookAt(Math.cos(a) * rr * 2, ry + 0.5, Math.sin(a) * rr * 2); g.add(petal)
    }
  }
  // thân ngồi thiền
  const lap = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.8, 20), M.goldGlow()); lap.position.y = 1.65; g.add(lap)
  const robe = new THREE.Mesh(new THREE.ConeGeometry(1.45, 2.1, 20), M.goldGlow()); robe.position.y = 2.8; g.add(robe)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.0, 1.3, 16), M.goldGlow()); torso.position.y = 3.6; g.add(torso)
  // tay đặt trên đùi (thiền định)
  const hands = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), M.goldGlow()); hands.scale.set(1.3, 0.5, 0.8); hands.position.set(0, 2.35, 0.75); g.add(hands)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), M.goldGlow()); head.position.y = 4.55; head.scale.y = 1.1; g.add(head)
  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), M.goldGlow()); ushnisha.position.y = 5.2; g.add(ushnisha)
  const urna = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x886622, emissiveIntensity: 0.5 })); urna.position.set(0, 4.65, 0.58); g.add(urna)
  g.position.set(x, y, z); g.scale.setScalar(scale)
  return g
}

// ---- Mâm ngũ quả & bình hoa ----------------------------------------------
function fruitTray(x: number, y: number, z: number) {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.25, 16), M.gold()))
  const colors = [0xe0b43a, 0xcf5b3a, 0x8bbf4a, 0xd98a3a, 0xc94040, 0xe0c24a]
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, r = i === 8 ? 0 : 0.35
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.6 }))
    f.position.set(Math.cos(a) * r, 0.22 + (i === 8 ? 0.15 : 0), Math.sin(a) * r); g.add(f)
  }
  g.position.set(x, y, z); return g
}
function flowerVase(x: number, y: number, z: number) {
  const g = new THREE.Group()
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 1.0, 14), new THREE.MeshStandardMaterial({ color: 0xcf4a3a, roughness: 0.4, metalness: 0.2 })); vase.position.y = 0.5; g.add(vase)
  const petalMats = [0xff6f8a, 0xffd24a, 0xff9a4a, 0xffffff]
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.35, h = 1.0 + Math.random() * 0.9
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h, 5), M.pine()); stem.position.set(Math.cos(a) * r, 0.9 + h / 2, Math.sin(a) * r); g.add(stem)
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({ color: petalMats[i % petalMats.length], roughness: 0.6 })); fl.scale.set(1, 0.7, 1); fl.position.set(Math.cos(a) * r, 0.9 + h, Math.sin(a) * r); g.add(fl)
  }
  g.position.set(x, y, z); return g
}

// ---- Câu đối treo cột ----------------------------------------------------
function couplet(x: number, y: number, z: number) {
  const g = new THREE.Group()
  g.add(box(0.7, 4.5, 0.12, M.redDark(), 0, 0, 0)); g.add(box(0.45, 4.0, 0.06, M.gold(), 0, 0, 0.1)); g.position.set(x, y, z); return g
}

// ---- Nhãn chức năng nổi + vòng sáng --------------------------------------
function makeLabelSprite(text: string) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 140
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(40,26,16,0.85)'
  const r = 36, w = 512, h = 140
  ctx.beginPath(); ctx.moveTo(r, 6); ctx.arcTo(w - 6, 6, w - 6, h - 6, r); ctx.arcTo(w - 6, h - 6, 6, h - 6, r); ctx.arcTo(6, h - 6, 6, 6, r); ctx.arcTo(6, 6, w - 6, 6, r); ctx.closePath(); ctx.fill()
  ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(201,163,86,0.9)'; ctx.stroke()
  ctx.font = 'bold 60px "Segoe UI", sans-serif'; ctx.fillStyle = '#f3e6c4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2 + 4)
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); sp.scale.set(5, 1.4, 1); return sp
}
function stationMarker(x: number, floorY: number, z: number, text: string, labelY: number, updaters: World['updaters']) {
  const g = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 10, 40), new THREE.MeshStandardMaterial({ color: 0xc9a356, emissive: 0xffb347, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 }))
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, floorY + 0.08, z); g.add(ring)
  const label = makeLabelSprite(text); label.position.set(x, labelY, z); g.add(label)
  updaters.push((t) => { const s = 1 + Math.sin(t * 2.2) * 0.08; ring.scale.set(s, s, 1); (ring.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7 + Math.sin(t * 2.2) * 0.4; label.position.y = labelY + Math.sin(t * 1.5) * 0.12 })
  return g
}

// ---- Dép -----------------------------------------------------------------
export function makeSandalPair() {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 1 }), strap = new THREE.MeshStandardMaterial({ color: 0x5b3d28, roughness: 1 })
  for (const sx of [-0.28, 0.28]) {
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.09, 0.95), mat); sole.position.set(sx, 0.05, 0)
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 12), strap); band.rotation.x = Math.PI / 2.2; band.position.set(sx, 0.13, 0.12); g.add(sole, band)
  }
  return g
}

// =========================================================================
export function buildWorld(scene: THREE.Scene): World {
  const root = new THREE.Group(); scene.add(root)
  const updaters: World['updaters'] = []
  const interactives: Interactive[] = []
  const floorY = 18

  // --- NÚI: đỉnh thật đỡ khu chùa ---
  const MCZ = -20
  const peakTop = new THREE.Mesh(new THREE.CylinderGeometry(82, 136, 44, 56), M.grass())
  peakTop.position.set(0, floorY - 22.4, MCZ); peakTop.receiveShadow = true; root.add(peakTop)
  const peakBody = new THREE.Mesh(new THREE.CylinderGeometry(136, 224, 150, 48), M.rock())
  peakBody.position.set(0, floorY - 119.4, MCZ); peakBody.receiveShadow = true; root.add(peakBody)
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + 0.4
    const ledge = new THREE.Mesh(new THREE.ConeGeometry(20 + Math.random() * 18, 28 + Math.random() * 16, 6), M.rock())
    ledge.position.set(Math.cos(a) * 118, floorY - 36 - Math.random() * 34, MCZ + Math.sin(a) * 112); ledge.rotation.y = Math.random() * 3; ledge.receiveShadow = true; root.add(ledge)
  }
  // đỉnh xa tạo chiều sâu
  for (let i = 0; i < 9; i++) {
    const far = new THREE.Mesh(new THREE.ConeGeometry(34 + Math.random() * 28, 34 + Math.random() * 34, 6), new THREE.MeshStandardMaterial({ color: 0x5f7360, roughness: 1 }))
    const a = -0.9 + i * 0.55; far.position.set(Math.sin(a) * 180, -10 + Math.random() * 10, -170 - Math.random() * 70); root.add(far)
  }

  // --- Sương mây trôi ---
  const mistMat = new THREE.SpriteMaterial({ map: softTexture(), color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false })
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Sprite(mistMat.clone())
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 78
    const mx = Math.cos(a) * r, mz = MCZ + Math.sin(a) * r * 0.8, my = 2 + Math.random() * 16, sc = 24 + Math.random() * 32
    m.scale.set(sc, sc * 0.55, 1); m.position.set(mx, my, mz); root.add(m)
    const sp = 0.4 + Math.random() * 0.6, phase = Math.random() * 100
    updaters.push((t) => { m.position.x = mx + Math.sin(t * 0.05 * sp + phase) * 12 })
  }

  // --- NỀN SÂN đá xám (phủ từ cổng tới sau đại điện) ---
  root.add(box(74, 1.2, 112, M.stone(), 0, floorY - 0.6, -8))
  root.add(box(76, 0.5, 114, M.stoneDark(), 0, floorY - 1.3, -8))
  root.add(box(10, 0.08, 110, M.stoneLight(), 0, floorY + 0.02, -8)) // thần đạo

  // --- Cầu thang bám sườn trước núi (mép đỉnh z=62) ---
  const { group: stairs, path: climbPath } = buildStairs(new THREE.Vector3(0, -10, 96), new THREE.Vector3(0, floorY, 62), 48, 10)
  root.add(stairs)
  for (let i = 0; i < 12; i++) {
    const t = i / 12, yy = THREE.MathUtils.lerp(-10, floorY, t) - 0.3, z = THREE.MathUtils.lerp(96, 62, t), s = i % 2 ? 1 : -1
    root.add(pineTree((8 + Math.random() * 4) * s, yy, z + (Math.random() - 0.5) * 4, 0.9 + Math.random() * 0.6))
    if (Math.random() > 0.4) root.add(rock((7 + Math.random() * 3) * -s, yy, z, 0.7 + Math.random()))
  }

  // --- CỔNG TAM QUAN hoành tráng ---
  root.add(buildArchGate(floorY, 46))
  root.add(lantern(-12, floorY + 9, 46, updaters, 1.3)); root.add(lantern(12, floorY + 9, 46, updaters, 1.3))

  // --- SÂN NGOÀI: 2 hàng cột kinh + cây cảnh ---
  for (let r = 0; r < 7; r++) { const z = 38 - r * 4.4; for (const x of [-9, -16, 9, 16]) root.add(kinhPillar(x, floorY, z)) }
  for (let r = 0; r < 6; r++) { const z = 38 - r * 5.4; root.add(shrub(-24, floorY, z, 1.3)); root.add(shrub(24, floorY, z, 1.3)); if (r % 2 === 0) { root.add(pineTree(-29, floorY, z, 1.2)); root.add(pineTree(29, floorY, z, 1.2)) } }

  // --- Lư hương lớn giữa sân ---
  root.add(buildCenser(0, floorY, 8, updaters))
  const censerHit = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 4.6, 8), new THREE.MeshBasicMaterial({ visible: false })); censerHit.position.set(0, floorY + 2.2, 8); root.add(censerHit)
  interactives.push({ object: censerHit, action: 'incense', label: '🪔 Thắp nhang', focus: new THREE.Vector3(0, floorY + 1.6, 8) })

  // --- Lầu chuông & trống ---
  const bell = buildBell(-24, floorY, 14); root.add(bell.group); updaters.push(bell.update)
  const bellHit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 2.6), new THREE.MeshBasicMaterial({ visible: false })); bellHit.position.set(-24, floorY + 3.3, 14); root.add(bellHit)
  interactives.push({ object: bellHit, action: 'bell', label: '🔔 Rung chuông', focus: new THREE.Vector3(-22, floorY + 1.6, 14) })
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 24), M.redDark()); drum.rotation.z = Math.PI / 2; drum.position.set(24, floorY + 2.6, 14); root.add(drum)
  root.add(box(0.3, 3.2, 0.3, M.wood(), 24, floorY + 1.3, 15.6)); root.add(box(0.3, 3.2, 0.3, M.wood(), 24, floorY + 1.3, 12.4))

  // --- Thùng công đức gần cổng ---
  const meritBox = box(1.6, 2.1, 1.4, M.redDark(), 14, floorY + 1.05, 34)
  meritBox.add(box(1.7, 0.24, 1.5, M.gold(), 0, 1.1, 0)); meritBox.add(box(0.7, 0.06, 0.18, M.stoneDark(), 0, 1.1, 0)); root.add(meritBox)
  interactives.push({ object: meritBox, action: 'merit', label: '💛 Cúng dường', focus: new THREE.Vector3(14, floorY + 1.6, 34) })

  // =========================================================================
  // ĐẠI ĐIỆN đồ sộ — mái 3 tầng, nền gạch, nội thất gỗ, 100 chỗ quỳ
  // =========================================================================
  const hallZ = -32, HW = 56, HD = 44, HH = 13
  const fZ = HD / 2 - 2
  const hall = new THREE.Group()
  // nền gạch cao + bậc đá trước
  hall.add(box(HW + 8, 2.0, HD + 8, M.brick(), 0, -0.9, 0))
  hall.add(box(HW, 0.14, HD, M.floor(), 0, 0.08, 0)) // sàn (mặt ~floorY+0.15)
  for (let s = 0; s < 4; s++) hall.add(box(HW + 10 - s * 2, 0.4, 1.6, s % 2 ? M.stone() : M.stoneLight(), 0, -0.1 - s * 0.45, HD / 2 + 2.2 + s * 1.5))
  // tường (sau + 2 bên), chừa mặt trước mở
  hall.add(box(HW, HH, 0.7, M.wall(), 0, HH / 2, -HD / 2))
  hall.add(box(0.7, HH, HD, M.wall(), -HW / 2, HH / 2, 0)); hall.add(box(0.7, HH, HD, M.wall(), HW / 2, HH / 2, 0))
  // cửa sổ tròn trên tường bên
  for (const sx of [-HW / 2, HW / 2]) for (const wz of [-12, -4, 4, 12]) {
    const win = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.2, 8, 20), M.woodDark()); win.rotation.y = Math.PI / 2; win.position.set(sx + Math.sign(sx) * 0.1, 5, wz); hall.add(win)
  }
  // HÀNG CỘT GỖ sẫm (mặt tiền + 2 hàng trong)
  for (const px of [-22, -11, 11, 22]) hall.add(pillar(HH, 0.6, px, 0, fZ, M.woodCol()))
  for (const px of [-22, -11, 11, 22]) hall.add(pillar(HH, 0.55, px, 0, -2, M.woodCol()))
  for (const px of [-22, 22]) hall.add(pillar(HH, 0.55, px, 0, -14, M.woodCol()))
  for (const px of [-22, 22]) hall.add(couplet(px, 6.5, fZ))
  // xà + MÁI 3 TẦNG (ngói xám đồ sộ)
  hall.add(box(HW + 3, 1.2, HD + 3, M.woodDark(), 0, HH + 0.6, 0))
  const r1 = pagodaRoof(HW + 12, HD + 12, 7, M.tileHall()); r1.position.set(0, HH + 4.5, 0); hall.add(r1)
  const r2 = pagodaRoof(HW - 4, HD - 2, 6, M.tileHall()); r2.position.set(0, HH + 9.5, 0); hall.add(r2)
  const r3 = pagodaRoof(HW - 22, HD - 18, 5, M.tileHall()); r3.position.set(0, HH + 14.5, 0); hall.add(r3)
  // biển hoành phi vàng mặt tiền
  hall.add(box(10, 1.8, 0.3, M.redDark(), 0, HH + 1, fZ + 0.5)); hall.add(box(8.5, 1.1, 0.1, M.gold(), 0, HH + 1, fZ + 0.66))
  hall.position.set(0, floorY, hallZ); root.add(hall)

  // --- VẠCH CAM ở cửa điện (ranh giới cởi dép) ---
  const coiDepZ = -14
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xe07a3a, roughness: 0.85 })
  root.add(box(HW - 4, 0.05, 0.55, lineMat, 0, floorY + 0.19, coiDepZ + 0.55))
  root.add(box(HW - 4, 0.05, 0.55, lineMat, 0, floorY + 0.19, coiDepZ - 0.55))

  const backZ = hallZ - HD / 2

  // --- BAN TAM THẾ: 3 tượng lớn + hào quang lá đề + bệ ---
  root.add(box(HW - 6, HH, 0.5, new THREE.MeshStandardMaterial({ color: 0x7a5a2e, metalness: 0.4, roughness: 0.5, emissive: 0x2a1e08, emissiveIntensity: 0.25 }), 0, floorY + HH / 2, backZ + 0.55)) // phông gỗ chạm vàng
  for (let i = 0; i < 3; i++) { const w = HW - 12 - i * 6, d = 6 - i * 1.3, cy = floorY + 0.6 + i * 1.2, cz = backZ + 4 + i * 0.5; root.add(box(w, 1.2, d, M.redDark(), 0, cy, cz)); root.add(box(w + 0.3, 0.2, d + 0.3, M.gold(), 0, cy + 0.6, cz)) }
  for (const bx of [-13, 0, 13]) root.add(buildBuddha(bx, floorY + 2.8, backZ + 4.2, bx === 0 ? 1.5 : 1.3))
  const halo = new THREE.PointLight(0xffdca0, 26, 34, 1.4); halo.position.set(0, floorY + 8, backZ + 6); root.add(halo)
  root.add(lantern(-20, floorY + 8, backZ + 4, updaters, 1.6)); root.add(lantern(20, floorY + 8, backZ + 4, updaters, 1.6))

  // --- HƯƠNG ÁN: khăn đỏ, mâm quả, bình hoa, nến, lư hương ---
  const tableZ = backZ + 13
  root.add(box(18, 1.6, 2.8, M.woodDark(), 0, floorY + 0.8, tableZ))
  root.add(box(18.5, 1.3, 0.3, M.red(), 0, floorY + 0.75, tableZ + 1.35)) // khăn phủ đỏ
  root.add(box(18.4, 0.24, 3.0, M.gold(), 0, floorY + 1.6, tableZ))
  const topY = floorY + 1.7
  root.add(fruitTray(-3, topY, tableZ)); root.add(fruitTray(3, topY, tableZ)); root.add(fruitTray(0, topY, tableZ - 0.5))
  root.add(flowerVase(-7, topY, tableZ)); root.add(flowerVase(7, topY, tableZ))
  for (const cx of [-5, 5]) { root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.4, 10), M.gold()).translateX(cx).translateY(topY + 0.7).translateZ(tableZ)); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), M.lamp()); fl.scale.y = 1.7; fl.position.set(cx, topY + 1.5, tableZ); root.add(fl) }
  const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.8, 18), M.bronze()); urn.position.set(0, topY + 0.4, tableZ + 0.6); root.add(urn)
  root.add(smokeColumn(0, topY + 0.8, tableZ + 0.6, updaters, { height: 5, count: 80, spread: 0.35 }))
  const prayerHit = new THREE.Mesh(new THREE.BoxGeometry(19, 2.6, 4), new THREE.MeshBasicMaterial({ visible: false })); prayerHit.position.set(0, floorY + 1.6, tableZ); root.add(prayerHit)
  interactives.push({ object: prayerHit, action: 'prayer', label: '🙏 Cầu an', focus: new THREE.Vector3(0, floorY + 1.7, tableZ + 3.5) })

  // --- 100 THẢM QUỲ (10 x 10) ---
  const mats: THREE.Vector3[] = []
  const matMat = new THREE.MeshStandardMaterial({ color: 0xb02a22, roughness: 0.95 })
  // InstancedMesh: 100 thảm + 100 bồ đoàn -> chỉ 2 draw call (nhẹ máy)
  const matInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.55, 0.08, 1.95), matMat, 100)
  const boInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.44, 0.49, 0.24, 14), M.cushion(), 100)
  matInst.receiveShadow = true
  const matDummy = new THREE.Object3D()
  let matK = 0
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const mx = (c - 4.5) * 2.9, mz = hallZ + 10 - r * 3.2
    matDummy.position.set(mx, floorY + 0.28, mz); matDummy.updateMatrix(); matInst.setMatrixAt(matK, matDummy.matrix)
    matDummy.position.set(mx, floorY + 0.44, mz + 0.45); matDummy.updateMatrix(); boInst.setMatrixAt(matK, matDummy.matrix)
    mats.push(new THREE.Vector3(mx, floorY, mz + 0.1))
    matK++
  }
  matInst.instanceMatrix.needsUpdate = true; boInst.instanceMatrix.needsUpdate = true
  root.add(matInst, boInst)

  // --- Đèn lồng treo trong điện (2 hàng) ---
  for (let r = 0; r < 5; r++) for (const lx of [-16, 16]) root.add(lantern(lx, floorY + HH - 1.5, hallZ - 10 + r * 5, updaters, 1.2))

  // --- Pháp tòa + mõ (tụng kinh) ---
  root.add(box(5, 1.3, 4, M.woodDark(), 20, floorY + 0.65, hallZ + 6)); root.add(box(5.4, 0.2, 4.4, M.gold(), 20, floorY + 1.35, hallZ + 6))
  root.add(box(2.2, 1.4, 2.0, M.cushion(), 20, floorY + 2.0, hallZ + 6))
  root.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), M.woodDark()).translateX(15).translateY(floorY + 1.3).translateZ(hallZ + 8))
  const sutraHit = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), new THREE.MeshBasicMaterial({ visible: false })); sutraHit.position.set(18, floorY + 1.6, hallZ + 7); root.add(sutraHit)
  interactives.push({ object: sutraHit, action: 'sutra', label: '📿 Tụng kinh / Nghe kinh', focus: new THREE.Vector3(15, floorY + 1.7, hallZ + 10) })

  // --- Ống xăm (xin xăm) ---
  root.add(box(1.3, 1.5, 1.3, M.wood(), -18, floorY + 0.75, hallZ + 8))
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.47, 1.5, 16), M.bronze()).translateX(-18).translateY(floorY + 2.2).translateZ(hallZ + 8))
  const fortuneHit = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), new THREE.MeshBasicMaterial({ visible: false })); fortuneHit.position.set(-18, floorY + 1.6, hallZ + 8); root.add(fortuneHit)
  interactives.push({ object: fortuneHit, action: 'fortune', label: '🎋 Xin xăm', focus: new THREE.Vector3(-15, floorY + 1.7, hallZ + 11) })

  const sandalSpot = new THREE.Vector3(16, floorY, hallZ + HD / 2 + 4)

  // Nhãn + vòng sáng cho mọi điểm tương tác
  for (const it of interactives) { const p = it.object.position; root.add(stationMarker(p.x, floorY, p.z, it.label, floorY + 4.6, updaters)) }

  return {
    root, updaters, interactives, climbPath,
    bell: { pivot: bell.pivot, swing: bell.swing },
    floorY,
    bounds: { minX: -25, maxX: 25, minZ: -42, maxZ: 58 },
    sandalSpot, mats, coiDepZ
  }
}
