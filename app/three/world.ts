/**
 * Thế giới chùa trên núi (Three.js primitives, không cần model ngoài).
 * Phong cách tham chiếu: Thiền viện Trúc Lâm / chùa Tam Chúc:
 *  - Bậc & lan can ĐÁ XÁM, cổng tam quan tường vàng đất + vòm đá, ngói nâu đỏ, chỉ vàng.
 *  - Sân rộng có hàng cột kinh để tham quan.
 *  - Đại điện rất rộng, nội thất đầy đủ: ban Tam Thế, đèn lồng, hàng chiếu quỳ.
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
}

// ---- Bảng màu (theo ảnh thật) -------------------------------------------
const M = {
  red: () => new THREE.MeshStandardMaterial({ color: 0x8e2f28, roughness: 0.6 }),
  redDark: () => new THREE.MeshStandardMaterial({ color: 0x6f241f, roughness: 0.7 }),
  gold: () => new THREE.MeshStandardMaterial({ color: 0xd4af5a, metalness: 0.95, roughness: 0.22 }),
  goldGlow: () =>
    new THREE.MeshStandardMaterial({
      color: 0xd8b45e, metalness: 0.9, roughness: 0.25, emissive: 0x6a4e12, emissiveIntensity: 0.35
    }),
  wood: () => new THREE.MeshStandardMaterial({ color: 0x5b3d28, roughness: 0.9 }),
  woodDark: () => new THREE.MeshStandardMaterial({ color: 0x46301f, roughness: 0.9 }),
  floor: () => new THREE.MeshStandardMaterial({ color: 0x8a7154, roughness: 0.75 }),
  // đá xám (bậc thang, lan can, sân, đế)
  stone: () => new THREE.MeshStandardMaterial({ color: 0x8f8a80, roughness: 1 }),
  stoneLight: () => new THREE.MeshStandardMaterial({ color: 0xa5a097, roughness: 1 }),
  stoneDark: () => new THREE.MeshStandardMaterial({ color: 0x6a655d, roughness: 1 }),
  // tường vàng đất / kem
  wall: () => new THREE.MeshStandardMaterial({ color: 0xcdbd92, roughness: 0.95 }),
  wallWarm: () => new THREE.MeshStandardMaterial({ color: 0xc2a86f, roughness: 0.95 }),
  // ngói nâu đỏ
  tile: () => new THREE.MeshStandardMaterial({ color: 0x6e4535, roughness: 0.6, metalness: 0.1 }),
  tileDark: () => new THREE.MeshStandardMaterial({ color: 0x53342a, roughness: 0.6 }),
  rock: () => new THREE.MeshStandardMaterial({ color: 0x5c5a52, roughness: 1 }),
  grass: () => new THREE.MeshStandardMaterial({ color: 0x4a6b3c, roughness: 1 }),
  pine: () => new THREE.MeshStandardMaterial({ color: 0x27402a, roughness: 1 }),
  bronze: () => new THREE.MeshStandardMaterial({ color: 0x8a6a34, metalness: 0.95, roughness: 0.3 }),
  cushion: () => new THREE.MeshStandardMaterial({ color: 0xb23a2a, roughness: 1 }),
  cushionGold: () => new THREE.MeshStandardMaterial({ color: 0xc9a356, roughness: 0.8 }),
  lamp: () =>
    new THREE.MeshStandardMaterial({ color: 0xd23b2e, emissive: 0xff5a3c, emissiveIntensity: 0.9, roughness: 0.6 })
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
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  _softTex = new THREE.CanvasTexture(c)
  _softTex.colorSpace = THREE.SRGBColorSpace
  return _softTex
}

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Mái chùa cong: chóp 4 mặt + bờ nóc vàng + đầu đao cong 4 góc. */
function pagodaRoof(width: number, depth: number, height: number, tileMat: THREE.Material) {
  const g = new THREE.Group()
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.72, height, 4), tileMat)
  roof.rotation.y = Math.PI / 4
  roof.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth))
  roof.castShadow = true
  g.add(roof)
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, width * 0.9, 8), M.gold())
  ridge.rotation.z = Math.PI / 2
  ridge.position.y = height * 0.42
  g.add(ridge)
  const halfW = width * 0.46
  const halfD = depth * 0.46
  const eaveY = -height * 0.26
  for (const [cx, cz] of [[halfW, halfD], [-halfW, halfD], [halfW, -halfD], [-halfW, -halfD]] as const) {
    const eave = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 1.8, 6), M.gold())
    eave.position.set(cx, eaveY + 0.6, cz)
    eave.rotation.z = Math.sign(cx) * -0.9
    eave.rotation.x = Math.sign(cz) * 0.5
    g.add(eave)
  }
  return g
}

function pillar(height: number, radius = 0.35, x = 0, y = 0, z = 0, mat = M.red()) {
  const g = new THREE.Group()
  const col = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.05, height, 16), mat)
  col.position.y = height / 2
  col.castShadow = true
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.5, radius * 1.7, 0.4, 16), M.stone())
  base.position.y = 0.2
  g.add(base, col)
  g.position.set(x, y, z)
  return g
}

// ---- Cổng tam quan: tường vàng đất + 3 vòm đá + mái ngói --------------------
function buildArchGate(y: number, z: number) {
  const g = new THREE.Group()
  g.position.set(0, y, z)
  const W = 26
  const wallH = 7.5
  const depth = 2.2
  // đế đá xám
  g.add(box(W + 2, 1.2, depth + 1.2, M.stone(), 0, 0.6, 0))
  // 3 lối: giữa rộng, 2 bên nhỏ -> trụ tường ngăn
  const openMain = 5.2
  const openSide = 3.0
  const pierW = 2.4
  // vị trí tâm 3 lối
  const centers = [0, -(openMain / 2 + pierW + openSide / 2), openMain / 2 + pierW + openSide / 2]
  const opens = [openMain, openSide, openSide]
  // các mảng tường (ochre) giữa/ngoài các lối
  const edges: number[] = []
  centers.forEach((c, i) => { edges.push(c - opens[i] / 2, c + opens[i] / 2) }) // -2.6,2.6, -? ...
  // tường: lấp từ -W/2..W/2 trừ 3 lối
  const sorted = [...centers.map((c, i) => [c - opens[i] / 2, c + opens[i] / 2] as const)].sort((a, b) => a[0] - b[0])
  let cursor = -W / 2
  const segs: Array<[number, number]> = []
  for (const [a, b] of sorted) { if (a > cursor) segs.push([cursor, a]); cursor = Math.max(cursor, b) }
  if (cursor < W / 2) segs.push([cursor, W / 2])
  for (const [a, b] of segs) {
    const w = b - a
    g.add(box(w, wallH, depth, M.wall(), (a + b) / 2, 1.2 + wallH / 2, 0))
  }
  // dầm ngang trên các lối (ochre) + vòm đá
  centers.forEach((c, i) => {
    const o = opens[i]
    const archTop = 1.2 + o * 0.9 + 1.0
    // tường phía trên lối
    g.add(box(o + 0.4, wallH - o * 0.9 - 0.8, depth, M.wall(), c, archTop + (wallH - (archTop - 1.2)) / 2 - 0.2, 0))
    // vòm đá (nửa vành khuyên)
    const arch = new THREE.Mesh(new THREE.TorusGeometry(o / 2, 0.45, 8, 24, Math.PI), M.stoneLight())
    arch.position.set(c, 1.2 + o * 0.9, 0)
    g.add(arch)
    // 2 trụ đá 2 bên lối
    for (const s of [-1, 1]) g.add(box(0.5, o * 0.9, depth + 0.1, M.stoneLight(), c + s * (o / 2 + 0.2), 1.2 + o * 0.45, 0))
  })
  // mái ngói: 3 mái (giữa cao)
  const main = pagodaRoof(W * 0.52, depth + 3.5, 3.2, M.tile())
  main.position.set(0, 1.2 + wallH + 2.2, 0)
  g.add(main)
  for (const s of [-1, 1]) {
    const side = pagodaRoof(9, depth + 2.6, 2.3, M.tile())
    side.position.set(s * (W / 2 - 4.5), 1.2 + wallH - 0.6, 0)
    g.add(side)
  }
  // biển hiệu đỏ chữ vàng
  g.add(box(6, 1.6, 0.3, M.redDark(), 0, 1.2 + wallH + 0.4, depth / 2 + 0.2))
  g.add(box(5.2, 1.0, 0.1, M.gold(), 0, 1.2 + wallH + 0.4, depth / 2 + 0.37))
  return g
}

// ---- Cầu thang đá xám -----------------------------------------------------
function buildStairs(from: THREE.Vector3, to: THREE.Vector3, steps: number, width: number) {
  const g = new THREE.Group()
  const path: THREE.Vector3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = THREE.MathUtils.lerp(from.x, to.x, t)
    const y = THREE.MathUtils.lerp(from.y, to.y, t)
    const z = THREE.MathUtils.lerp(from.z, to.z, t)
    if (i < steps) {
      const run = (from.z - to.z) / steps
      g.add(box(width, 0.42, run * 1.05, i % 2 ? M.stone() : M.stoneLight(), x, y + 0.2, z - run / 2))
    }
    path.push(new THREE.Vector3(x, y + 1.6, z))
  }
  // lan can đá + con tiện
  for (let i = 0; i <= steps; i += 2) {
    const t = i / steps
    const y = THREE.MathUtils.lerp(from.y, to.y, t) + 0.6
    const z = THREE.MathUtils.lerp(from.z, to.z, t)
    for (const s of [1, -1]) g.add(box(0.5, 1.4, 0.5, M.stone(), s * (width / 2 + 0.4), y, z))
  }
  const railLen = from.distanceTo(to)
  for (const side of [1, -1]) {
    const rail = box(0.4, 0.4, railLen, M.stoneLight())
    rail.position.set(side * (width / 2 + 0.4), (from.y + to.y) / 2 + 1.5, (from.z + to.z) / 2)
    rail.rotation.x = Math.atan2(to.y - from.y, from.z - to.z)
    g.add(rail)
  }
  return { group: g, path }
}

// ---- Cột kinh (sân ngoài, như ảnh 3) -------------------------------------
function kinhPillar(x: number, y: number, z: number) {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 12), M.stone())) // đế
  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.4, 12), M.stoneLight())
  base2.position.y = 0.4; g.add(base2)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 4.6, 8), M.stoneLight())
  shaft.position.y = 2.9; shaft.castShadow = true; g.add(shaft)
  // băng chữ kinh (cam)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 3.0, 8), new THREE.MeshStandardMaterial({ color: 0xcf7a33, roughness: 0.8 }))
  band.position.y = 2.9; g.add(band)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.6, 0.7, 12), M.stone())
  cap.position.y = 5.5; g.add(cap)
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), M.stoneLight())
  bud.position.y = 6.0; g.add(bud)
  g.position.set(x, y, z)
  return g
}

function pineTree(x: number, y: number, z: number, scale = 1) {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.6, 6), M.wood())
  trunk.position.y = 0.8; g.add(trunk)
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.4 - i * 0.32, 1.8, 7), M.pine())
    c.position.y = 1.6 + i * 1.1; c.castShadow = true; g.add(c)
  }
  g.position.set(x, y, z); g.scale.setScalar(scale)
  return g
}
function rock(x: number, y: number, z: number, s: number) {
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), M.rock())
  r.position.set(x, y, z); r.rotation.set(Math.random(), Math.random(), Math.random())
  r.castShadow = true; r.receiveShadow = true
  return r
}
function shrub(x: number, y: number, z: number, s = 1) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.9 * s, 10, 8), M.grass())
  b.position.set(x, y + 0.6 * s, z); b.scale.y = 0.8; b.castShadow = true
  return b
}

// ---- Lồng đèn đỏ treo ----------------------------------------------------
function lantern(x: number, y: number, z: number, updaters: World['updaters'], scale = 1) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), M.lamp())
  body.scale.y = 1.15; g.add(body)
  g.add(box(0.5, 0.08, 0.5, M.gold(), 0, 0.46, 0))
  g.add(box(0.5, 0.08, 0.5, M.gold(), 0, -0.46, 0))
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), M.gold())
  tassel.position.y = -0.75; g.add(tassel)
  const light = new THREE.PointLight(0xff7a45, 5, 8, 2); g.add(light)
  g.position.set(x, y, z); g.scale.setScalar(scale)
  const phase = Math.random() * 6
  updaters.push((t) => { g.rotation.z = Math.sin(t * 1.3 + phase) * 0.07; light.intensity = 4 + Math.sin(t * 4 + phase) * 1 })
  return g
}

// ---- Khói nhang mềm (shader points) --------------------------------------
function smokeColumn(
  x: number, y: number, z: number, updaters: World['updaters'],
  opts: { count?: number; height?: number; size?: number; color?: number; speed?: number; spread?: number } = {}
) {
  const COUNT = opts.count ?? 90
  const H = opts.height ?? 5
  const SPREAD = opts.spread ?? 0.35
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(COUNT * 3)
  const life = new Float32Array(COUNT)
  const seed = new Float32Array(COUNT)
  const baseX = new Float32Array(COUNT)
  const baseZ = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) {
    baseX[i] = (Math.random() - 0.5) * SPREAD
    baseZ[i] = (Math.random() - 0.5) * SPREAD
    pos[i * 3] = baseX[i]; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = baseZ[i]
    life[i] = Math.random(); seed[i] = Math.random()
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aLife', new THREE.BufferAttribute(life, 1))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uTex: { value: softTexture() },
      uColor: { value: new THREE.Color(opts.color ?? 0xbcae96) },
      uSize: { value: opts.size ?? 130 },
      uOpacity: { value: opts.color !== undefined ? 0.5 : 0.78 }
    },
    vertexShader: `
      attribute float aLife; attribute float aSeed; uniform float uSize; varying float vAlpha;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        float grow = 0.35 + aLife*1.8;
        gl_PointSize = uSize * grow * (1.0 / max(-mv.z,0.1));
        vAlpha = sin(aLife*3.14159);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform vec3 uColor; uniform float uOpacity; varying float vAlpha;
      void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(uColor, a*vAlpha*uOpacity); }`
  })
  const pts = new THREE.Points(geo, mat)
  pts.position.set(x, y, z); pts.frustumCulled = false
  const SPEED = opts.speed ?? 0.22
  updaters.push((t, dt) => {
    const p = geo.attributes.position as THREE.BufferAttribute
    const l = geo.attributes.aLife as THREE.BufferAttribute
    for (let i = 0; i < COUNT; i++) {
      let li = l.getX(i) + dt * SPEED * (0.7 + seed[i] * 0.6)
      if (li > 1) { li -= 1; baseX[i] = (Math.random() - 0.5) * SPREAD; baseZ[i] = (Math.random() - 0.5) * SPREAD }
      l.setX(i, li)
      p.setX(i, baseX[i] + Math.sin(t * 0.7 + seed[i] * 6.28) * li * 0.6)
      p.setY(i, li * H)
      p.setZ(i, baseZ[i] + Math.cos(t * 0.5 + seed[i] * 6.28) * li * 0.3)
    }
    p.needsUpdate = true; l.needsUpdate = true
  })
  return pts
}

// ---- Lư hương lớn --------------------------------------------------------
function buildCenser(x: number, y: number, z: number, updaters: World['updaters']) {
  const g = new THREE.Group()
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.85, 1.2, 24), M.bronze())
  bowl.position.y = 1.5
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 1.1, 20), M.bronze())
  foot.position.y = 0.55
  for (let i = -1; i <= 1; i++) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.8, 6), M.redDark())
    stick.position.set(i * 0.25, 3.0, 0)
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), M.lamp())
    tip.position.set(i * 0.25, 3.9, 0)
    g.add(stick, tip)
  }
  g.add(foot, bowl)
  g.add(smokeColumn(0, 2.2, 0, updaters, { height: 6 }))
  g.position.set(x, y, z); g.castShadow = true
  return g
}

// ---- Chuông đồng ---------------------------------------------------------
function buildBell(x: number, y: number, z: number) {
  const frame = new THREE.Group()
  frame.add(box(0.3, 4.6, 0.3, M.wood(), -1.5, 2.3, 0))
  frame.add(box(0.3, 4.6, 0.3, M.wood(), 1.5, 2.3, 0))
  frame.add(box(3.6, 0.35, 0.35, M.wood(), 0, 4.75, 0))
  const bell = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 2.6, 24, 1, true), M.bronze())
  body.position.y = -1.5
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.bronze())
  top.position.y = -0.2
  bell.add(top, body); bell.position.y = -0.1
  const swingGroup = new THREE.Group(); swingGroup.add(bell)
  const g = new THREE.Group(); g.position.set(x, y, z); g.add(frame)
  const pivot = new THREE.Object3D(); pivot.position.y = 4.55; pivot.add(swingGroup); g.add(pivot)
  let vel = 0, ang = 0
  const swing = (s: number) => { vel += s }
  const update = (_t: number, dt: number) => { const acc = -14 * ang - 1.6 * vel; vel += acc * dt; ang += vel * dt; swingGroup.rotation.x = ang }
  return { group: g, pivot: swingGroup, swing, update }
}

// ---- Tượng Phật vàng (chi tiết: sen nhiều cánh, chắp tay, hào quang) ------
function buildBuddha(x: number, y: number, z: number, scale = 1) {
  const g = new THREE.Group()
  // bệ sen 2 tầng cánh
  const lotus = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.0, 0.8, 24), M.goldGlow())
  lotus.position.y = 0.4; g.add(lotus)
  for (const [ring, ry, rr, sc] of [[14, 0.75, 1.75, 0.55], [12, 1.05, 1.45, 0.48]] as const) {
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2 + (ry > 1 ? 0.2 : 0)
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), M.gold())
      petal.scale.set(sc, sc * 0.8, sc * 1.7)
      petal.position.set(Math.cos(a) * rr, ry, Math.sin(a) * rr)
      petal.lookAt(Math.cos(a) * rr * 2, ry + 0.5, Math.sin(a) * rr * 2)
      g.add(petal)
    }
  }
  // thân ngồi thiền + đùi
  const lap = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.7, 20), M.goldGlow()); lap.position.y = 1.55; g.add(lap)
  const robe = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.9, 20), M.goldGlow()); robe.position.y = 2.55; g.add(robe)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 1.2, 16), M.goldGlow()); torso.position.y = 3.3; g.add(torso)
  // tay chắp trước ngực
  const hands = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), M.goldGlow())
  hands.scale.set(0.7, 1.1, 0.5); hands.position.set(0, 3.3, 0.85); g.add(hands)
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 1.1, 10), M.goldGlow())
    arm.position.set(s * 0.55, 3.35, 0.4); arm.rotation.z = s * 0.5; arm.rotation.x = -0.5; g.add(arm)
  }
  // đầu + nhục kế + búi tóc chấm
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.58, 20, 16), M.goldGlow()); head.position.y = 4.35; head.scale.y = 1.1; g.add(head)
  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), M.goldGlow()); ushnisha.position.y = 4.95; g.add(ushnisha)
  const urna = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x886622, emissiveIntensity: 0.5 }))
  urna.position.set(0, 4.45, 0.55); g.add(urna)
  // hào quang vành + đĩa sau đầu
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.09, 12, 36), M.gold()); halo.position.set(0, 4.4, -0.2); g.add(halo)
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 24), new THREE.MeshStandardMaterial({ color: 0xffdf8f, emissive: 0xffb34a, emissiveIntensity: 0.6, side: THREE.DoubleSide }))
  disc.position.set(0, 4.4, -0.35); g.add(disc)
  g.position.set(x, y, z); g.scale.setScalar(scale)
  return g
}

// ---- Mâm ngũ quả & bình hoa ----------------------------------------------
function fruitTray(x: number, y: number, z: number) {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.25, 16), M.gold())) // đĩa
  const colors = [0xe0b43a, 0xcf5b3a, 0x8bbf4a, 0xd98a3a, 0xc94040, 0xe0c24a]
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const r = i === 8 ? 0 : 0.35
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.6 }))
    f.position.set(Math.cos(a) * r, 0.22 + (i === 8 ? 0.15 : 0), Math.sin(a) * r); g.add(f)
  }
  g.position.set(x, y, z)
  return g
}
function flowerVase(x: number, y: number, z: number) {
  const g = new THREE.Group()
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 1.0, 14), new THREE.MeshStandardMaterial({ color: 0xcf4a3a, roughness: 0.4, metalness: 0.2 }))
  vase.position.y = 0.5; g.add(vase)
  const petalMats = [0xff6f8a, 0xffd24a, 0xff9a4a, 0xffffff]
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.35, h = 1.0 + Math.random() * 0.9
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h, 5), M.pine())
    stem.position.set(Math.cos(a) * r, 0.9 + h / 2, Math.sin(a) * r); g.add(stem)
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({ color: petalMats[i % petalMats.length], roughness: 0.6 }))
    fl.scale.set(1, 0.7, 1); fl.position.set(Math.cos(a) * r, 0.9 + h, Math.sin(a) * r); g.add(fl)
  }
  g.position.set(x, y, z)
  return g
}

// ---- Câu đối (bảng dọc đỏ chữ vàng treo cột) -----------------------------
function couplet(x: number, y: number, z: number) {
  const g = new THREE.Group()
  g.add(box(0.7, 4.5, 0.12, M.redDark(), 0, 0, 0))
  g.add(box(0.45, 4.0, 0.06, M.gold(), 0, 0, 0.1))
  g.position.set(x, y, z)
  return g
}

// ---- Nhãn chức năng nổi + vòng sáng dưới chân -----------------------------
function makeLabelSprite(text: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 140
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(40,26,16,0.85)'
  const r = 36, w = 512, h = 140
  ctx.beginPath()
  ctx.moveTo(r, 6); ctx.arcTo(w - 6, 6, w - 6, h - 6, r); ctx.arcTo(w - 6, h - 6, 6, h - 6, r)
  ctx.arcTo(6, h - 6, 6, 6, r); ctx.arcTo(6, 6, w - 6, 6, r); ctx.closePath(); ctx.fill()
  ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(201,163,86,0.9)'; ctx.stroke()
  ctx.font = 'bold 60px "Segoe UI", sans-serif'
  ctx.fillStyle = '#f3e6c4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2 + 4)
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }))
  sp.scale.set(5, 1.4, 1)
  return sp
}
function stationMarker(x: number, floorY: number, z: number, text: string, labelY: number, updaters: World['updaters']) {
  const g = new THREE.Group()
  // vòng sáng dưới chân
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.12, 10, 40),
    new THREE.MeshStandardMaterial({ color: 0xc9a356, emissive: 0xffb347, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.set(x, floorY + 0.08, z)
  g.add(ring)
  // nhãn nổi
  const label = makeLabelSprite(text)
  label.position.set(x, labelY, z)
  g.add(label)
  updaters.push((t) => {
    const s = 1 + Math.sin(t * 2.2) * 0.08
    ring.scale.set(s, s, 1)
    const m = ring.material as THREE.MeshStandardMaterial
    m.emissiveIntensity = 0.7 + Math.sin(t * 2.2) * 0.4
    label.position.y = labelY + Math.sin(t * 1.5) * 0.12
  })
  return g
}

// ---- Dép -----------------------------------------------------------------
export function makeSandalPair() {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 1 })
  const strap = new THREE.MeshStandardMaterial({ color: 0x5b3d28, roughness: 1 })
  for (const sx of [-0.28, 0.28]) {
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.09, 0.95), mat); sole.position.set(sx, 0.05, 0)
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 12), strap)
    band.rotation.x = Math.PI / 2.2; band.position.set(sx, 0.13, 0.12)
    g.add(sole, band)
  }
  return g
}

// =========================================================================
export function buildWorld(scene: THREE.Scene): World {
  const root = new THREE.Group()
  scene.add(root)
  const updaters: World['updaters'] = []
  const interactives: Interactive[] = []
  const floorY = 18

  // --- NÚI: một đỉnh núi THẬT nhô lên đỡ cả khu chùa (không còn chơi vơi) ---
  // Đỉnh cỏ: chóp cụt, mặt trên ngang floorY, đủ rộng phủ hết sân; mép R_top=76 tại z=58.
  const peakTop = new THREE.Mesh(new THREE.CylinderGeometry(76, 124, 42, 56), M.grass())
  peakTop.position.set(0, floorY - 21.4, -18); peakTop.receiveShadow = true; root.add(peakTop) // mặt cỏ ~floorY-0.4 (dưới mặt sân)
  // Thân núi đá rộng, đổ sâu xuống (vào sương)
  const peakBody = new THREE.Mesh(new THREE.CylinderGeometry(124, 210, 140, 48), M.rock())
  peakBody.position.set(0, floorY - 112, -18); peakBody.receiveShadow = true; root.add(peakBody)
  // Vài khối đá nhô ra sườn cho núi có hình khối
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + 0.4
    const ledge = new THREE.Mesh(new THREE.ConeGeometry(18 + Math.random() * 18, 26 + Math.random() * 16, 6), M.rock())
    ledge.position.set(Math.cos(a) * 108, floorY - 34 - Math.random() * 34, -18 + Math.sin(a) * 100)
    ledge.rotation.y = Math.random() * 3; ledge.receiveShadow = true; root.add(ledge)
  }
  for (let i = 0; i < 9; i++) {
    const far = new THREE.Mesh(
      new THREE.ConeGeometry(34 + Math.random() * 28, 34 + Math.random() * 34, 6),
      new THREE.MeshStandardMaterial({ color: 0x5f7360, roughness: 1 })
    )
    const a = -0.9 + i * 0.55
    far.position.set(Math.sin(a) * 160, -8 + Math.random() * 10, -150 - Math.random() * 70)
    root.add(far)
  }

  // --- Sương mây trôi ---
  const mistMat = new THREE.SpriteMaterial({ map: softTexture(), color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false })
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Sprite(mistMat.clone())
    const a = Math.random() * Math.PI * 2, r = 36 + Math.random() * 70
    const mx = Math.cos(a) * r, mz = -16 + Math.sin(a) * r * 0.8, my = 2 + Math.random() * 16
    const sc = 20 + Math.random() * 30
    m.scale.set(sc, sc * 0.55, 1); m.position.set(mx, my, mz); root.add(m)
    const sp = 0.4 + Math.random() * 0.6, phase = Math.random() * 100
    updaters.push((t) => { m.position.x = mx + Math.sin(t * 0.05 * sp + phase) * 12 })
  }

  // --- NỀN LỚN: sân đá xám trải dài (phủ từ cổng tới sau đại điện) ---
  const plaza = box(66, 1.2, 98, M.stone(), 0, floorY - 0.6, -4)
  plaza.receiveShadow = true; root.add(plaza)
  // viền đá quanh sân cho khớp mép
  root.add(box(68, 0.5, 100, M.stoneDark(), 0, floorY - 1.3, -4))
  // đường thần đạo lát sáng giữa sân
  root.add(box(9, 0.08, 96, M.stoneLight(), 0, floorY + 0.02, -4))

  // --- Cầu thang bám đúng sườn trước của núi (từ mép đỉnh z=58 xuống sương) ---
  const { group: stairs, path: climbPath } = buildStairs(
    new THREE.Vector3(0, -10, 90), new THREE.Vector3(0, floorY, 58), 46, 9
  )
  root.add(stairs)
  for (let i = 0; i < 12; i++) {
    const t = i / 12, y = THREE.MathUtils.lerp(-10, floorY, t) - 0.3, z = THREE.MathUtils.lerp(90, 58, t)
    const s = i % 2 ? 1 : -1
    root.add(pineTree((7 + Math.random() * 4) * s, y, z + (Math.random() - 0.5) * 4, 0.8 + Math.random() * 0.6))
    if (Math.random() > 0.4) root.add(rock((6 + Math.random() * 3) * -s, y, z, 0.6 + Math.random()))
  }

  // --- Cổng tam quan ---
  root.add(buildArchGate(floorY, 36))
  root.add(lantern(-10, floorY + 8, 36, updaters))
  root.add(lantern(10, floorY + 8, 36, updaters))

  // --- SÂN NGOÀI RỘNG: 2 hàng cột kinh (như ảnh 3) + cây cảnh ---
  for (let r = 0; r < 6; r++) {
    const z = 30 - r * 4.2
    for (const x of [-7, -13, 7, 13]) root.add(kinhPillar(x, floorY, z))
  }
  for (let r = 0; r < 5; r++) {
    const z = 30 - r * 5
    root.add(shrub(-19, floorY, z, 1.2)); root.add(shrub(19, floorY, z, 1.2))
    if (r % 2 === 0) { root.add(pineTree(-23, floorY, z, 1.1)); root.add(pineTree(23, floorY, z, 1.1)) }
  }

  // --- Lư hương lớn giữa sân (trước đại điện) ---
  root.add(buildCenser(0, floorY, 4, updaters))
  const censerHit = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 4.2, 8), new THREE.MeshBasicMaterial({ visible: false }))
  censerHit.position.set(0, floorY + 2, 4); root.add(censerHit)
  interactives.push({ object: censerHit, action: 'incense', label: '🪔 Thắp nhang', focus: new THREE.Vector3(0, floorY + 1.6, 4) })

  // --- Lầu chuông & lầu trống 2 bên ---
  const bell = buildBell(-20, floorY, 10)
  root.add(bell.group); updaters.push(bell.update)
  const bellHit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 2.6), new THREE.MeshBasicMaterial({ visible: false }))
  bellHit.position.set(-20, floorY + 3.3, 10); root.add(bellHit)
  interactives.push({ object: bellHit, action: 'bell', label: '🔔 Rung chuông', focus: new THREE.Vector3(-18, floorY + 1.6, 10) })
  // trống lớn (trang trí) bên phải
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.2, 24), M.redDark())
  drum.rotation.z = Math.PI / 2; drum.position.set(20, floorY + 2.4, 10)
  root.add(drum); root.add(box(0.3, 3, 0.3, M.wood(), 20, floorY + 1.2, 11.5)); root.add(box(0.3, 3, 0.3, M.wood(), 20, floorY + 1.2, 8.5))

  // --- Thùng công đức gần cổng ---
  const meritBox = box(1.5, 2.0, 1.3, M.redDark(), 12, floorY + 1.0, 28)
  meritBox.add(box(1.6, 0.22, 1.4, M.gold(), 0, 1.05, 0))
  meritBox.add(box(0.6, 0.06, 0.16, M.stoneDark(), 0, 1.05, 0))
  root.add(meritBox)
  interactives.push({ object: meritBox, action: 'merit', label: '💛 Cúng dường', focus: new THREE.Vector3(12, floorY + 1.6, 28) })

  // =========================================================================
  // ĐẠI ĐIỆN — không gian siêu rộng, nội thất đầy đủ
  // =========================================================================
  const hallZ = -32        // tâm điện
  const HW = 40, HD = 30, HH = 10 // rộng, sâu, cao cột
  const fZ = HD / 2 - 1.5  // hàng cột mặt tiền
  const hall = new THREE.Group()
  // sàn gỗ PHẲNG ngang mặt sân (mặt trên = floorY, đặt vật lên không chìm)
  hall.add(box(HW + 4, 0.5, HD + 4, M.stone(), 0, -0.3, 0))
  hall.add(box(HW, 0.12, HD, M.floor(), 0, -0.04, 0)) // mặt sàn ~ floorY+0.02 (cao hơn sân, tránh trùng mặt)
  // bậc thị giác phía trước (không cản đi lại)
  hall.add(box(HW + 6, 0.3, 1.4, M.stoneLight(), 0, -0.25, HD / 2 + 1.2))
  hall.add(box(HW + 8, 0.3, 1.4, M.stone(), 0, -0.55, HD / 2 + 2.6))
  // tường ochre: sau + 2 bên (chừa mặt trước mở)
  hall.add(box(HW, HH, 0.6, M.wall(), 0, HH / 2, -HD / 2))
  hall.add(box(0.6, HH, HD, M.wall(), -HW / 2, HH / 2, 0))
  hall.add(box(0.6, HH, HD, M.wall(), HW / 2, HH / 2, 0))
  // ô cửa sổ lưới trên tường bên
  for (const sx of [-HW / 2, HW / 2]) for (const wz of [-8, 0, 8])
    hall.add(box(0.3, 3, 3, M.woodDark(), sx + Math.sign(sx) * 0.2, 4.6, wz))
  // ÍT CỘT ĐỎ cho gian thoáng: 4 cột mặt tiền (chừa giữa) + 2 cột trong sát tường
  for (const px of [-17, -7, 7, 17]) hall.add(pillar(HH, 0.5, px, 0, fZ, M.red()))
  for (const px of [-17, 17]) hall.add(pillar(HH, 0.5, px, 0, -7, M.red()))
  for (const px of [-17, 17]) hall.add(couplet(px, 6, fZ))
  // xà + mái 3 tầng
  hall.add(box(HW + 2, 1.0, HD + 2, M.red(), 0, HH + 0.5, 0))
  const r1 = pagodaRoof(HW + 8, HD + 8, 6, M.tile()); r1.position.set(0, HH + 4, 0); hall.add(r1)
  const r2 = pagodaRoof(HW - 4, HD - 2, 5, M.tile()); r2.position.set(0, HH + 8.5, 0); hall.add(r2)
  const r3 = pagodaRoof(HW - 18, HD - 14, 4, M.tile()); r3.position.set(0, HH + 12.5, 0); hall.add(r3)
  hall.position.set(0, floorY, hallZ)
  root.add(hall)

  const backZ = hallZ - HD / 2 // z tường sau (tuyệt đối)

  // === BAN TAM THẾ chi tiết ===
  // phông vàng (vách gấm) + lưới ô "nghìn Phật"
  root.add(box(HW - 1, HH, 0.4, new THREE.MeshStandardMaterial({ color: 0xbf9440, metalness: 0.55, roughness: 0.4, emissive: 0x3a2a08, emissiveIntensity: 0.32 }), 0, floorY + HH / 2, backZ + 0.5))
  for (let gx = -9; gx <= 9; gx++) for (let gy = 0; gy < 6; gy++)
    root.add(box(0.5, 0.5, 0.1, M.gold(), gx * 1.75, floorY + 1.4 + gy * 1.4, backZ + 0.75))
  // bệ thờ 3 cấp (đỏ + viền vàng)
  for (let i = 0; i < 3; i++) {
    const w = HW - 9 - i * 5, d = 5.5 - i * 1.2, cy = floorY + 0.55 + i * 1.1, cz = backZ + 3.5 + i * 0.4
    root.add(box(w, 1.1, d, M.redDark(), 0, cy, cz))
    root.add(box(w + 0.3, 0.18, d + 0.3, M.gold(), 0, cy + 0.55, cz))
  }
  // bệ thấp cho hàng 5 tượng nhỏ
  root.add(box(HW - 8, 1.0, 3.2, M.redDark(), 0, floorY + 0.5, backZ + 7.6))
  root.add(box(HW - 7.6, 0.16, 3.4, M.gold(), 0, floorY + 1.0, backZ + 7.6))
  // Tượng Phật LỚN giữa + 5 tượng nhỏ hàng trước (như ảnh 4)
  root.add(buildBuddha(0, floorY + 2.6, backZ + 3.6, 1.45))
  for (let i = -2; i <= 2; i++) root.add(buildBuddha(i * 6.5, floorY + 1.0, backZ + 8.0, 0.6))
  const haloLight = new THREE.PointLight(0xffdca0, 20, 26, 1.4); haloLight.position.set(0, floorY + 7, backZ + 5); root.add(haloLight)
  // 2 lồng đèn đỏ lớn 2 bên ban
  root.add(lantern(-16, floorY + 7.5, backZ + 4, updaters, 1.5))
  root.add(lantern(16, floorY + 7.5, backZ + 4, updaters, 1.5))

  // === HƯƠNG ÁN: mâm ngũ quả, bình hoa, nến, lư hương ===
  const tableZ = backZ + 12
  root.add(box(16, 1.5, 2.4, M.woodDark(), 0, floorY + 0.75, tableZ))
  root.add(box(16.4, 0.22, 2.6, M.gold(), 0, floorY + 1.5, tableZ))
  const topY = floorY + 1.6
  root.add(fruitTray(-2.6, topY, tableZ)); root.add(fruitTray(2.6, topY, tableZ)); root.add(fruitTray(0, topY, tableZ - 0.5))
  root.add(flowerVase(-6.2, topY, tableZ)); root.add(flowerVase(6.2, topY, tableZ))
  for (const cx of [-4.3, 4.3]) {
    root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.3, 10), M.gold()).translateX(cx).translateY(topY + 0.65).translateZ(tableZ))
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), M.lamp()); fl.scale.y = 1.7; fl.position.set(cx, topY + 1.45, tableZ); root.add(fl)
  }
  const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.7, 18), M.bronze()); urn.position.set(0, topY + 0.35, tableZ + 0.5); root.add(urn)
  root.add(smokeColumn(0, topY + 0.7, tableZ + 0.5, updaters, { height: 4.5, count: 70, spread: 0.3 }))

  const prayerHit = new THREE.Mesh(new THREE.BoxGeometry(17, 2.5, 3.5), new THREE.MeshBasicMaterial({ visible: false }))
  prayerHit.position.set(0, floorY + 1.5, tableZ); root.add(prayerHit)
  interactives.push({ object: prayerHit, action: 'prayer', label: '🙏 Cầu an', focus: new THREE.Vector3(0, floorY + 1.7, tableZ + 3) })

  // --- Hàng THẢM QUỲ ĐỎ (một khối liền, không z-fighting) + bồ đoàn ---
  const matMat = new THREE.MeshStandardMaterial({ color: 0xb02a22, roughness: 0.95 })
  const mats: THREE.Vector3[] = []
  for (let r = 0; r < 4; r++) for (let c = -3; c <= 3; c++) {
    const mx = c * 2.6, mz = hallZ + 2 + r * 3.6
    const mat = box(1.55, 0.08, 1.95, matMat, mx, floorY + 0.09, mz) // đáy ~floorY+0.05 (trên sàn), mặt đỏ liền
    mat.castShadow = false; root.add(mat)
    const bo = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.49, 0.24, 18), M.cushion())
    bo.position.set(mx, floorY + 0.25, mz + 0.45); bo.castShadow = true; root.add(bo) // bồ đoàn đỏ
    mats.push(new THREE.Vector3(mx, floorY, mz + 0.1)) // tâm chỗ quỳ
  }

  // --- Đèn lồng treo 2 hàng trong điện ---
  for (let r = 0; r < 4; r++) for (const lx of [-12, 12]) root.add(lantern(lx, floorY + HH - 1.5, hallZ - 8 + r * 5, updaters, 1.1))

  // --- Gian NGHE ĐỌC KINH: pháp tòa + mõ ---
  root.add(box(5, 1.2, 4, M.woodDark(), 15, floorY + 0.6, hallZ + 2))
  root.add(box(5.4, 0.2, 4.4, M.gold(), 15, floorY + 1.3, hallZ + 2))
  root.add(box(2.2, 1.4, 2.0, M.cushion(), 15, floorY + 1.9, hallZ + 2))
  root.add(box(1.6, 1.0, 1.0, M.wood(), 11, floorY + 0.5, hallZ + 4))
  root.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), M.woodDark()).translateX(11).translateY(floorY + 1.2).translateZ(hallZ + 4))
  const sutraHit = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), new THREE.MeshBasicMaterial({ visible: false }))
  sutraHit.position.set(14, floorY + 1.5, hallZ + 3); root.add(sutraHit)
  interactives.push({ object: sutraHit, action: 'sutra', label: '📿 Tụng kinh / Nghe kinh', focus: new THREE.Vector3(12, floorY + 1.7, hallZ + 6) })

  // --- Ống xăm (xin xăm) bên kia ---
  root.add(box(1.2, 1.4, 1.2, M.wood(), -14, floorY + 0.7, hallZ + 4))
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.4, 16), M.bronze()).translateX(-14).translateY(floorY + 2.1).translateZ(hallZ + 4))
  const fortuneHit = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), new THREE.MeshBasicMaterial({ visible: false }))
  fortuneHit.position.set(-14, floorY + 1.5, hallZ + 4); root.add(fortuneHit)
  interactives.push({ object: fortuneHit, action: 'fortune', label: '🎋 Xin xăm', focus: new THREE.Vector3(-12, floorY + 1.7, hallZ + 6) })

  const sandalSpot = new THREE.Vector3(10, floorY, hallZ + HD / 2 + 3)

  // Nhãn chức năng + vòng sáng cho MỌI điểm tương tác (hiện rõ chức năng)
  for (const it of interactives) {
    const p = it.object.position
    root.add(stationMarker(p.x, floorY, p.z, it.label, floorY + 4.4, updaters))
  }

  return {
    root, updaters, interactives, climbPath,
    bell: { pivot: bell.pivot, swing: bell.swing },
    floorY,
    bounds: { minX: -18, maxX: 18, minZ: -33, maxZ: 38 },
    sandalSpot,
    mats
  }
}
