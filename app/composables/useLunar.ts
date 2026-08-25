/**
 * Chuyển đổi Dương lịch -> Âm lịch Việt Nam.
 * Thuật toán của Hồ Ngọc Đức (múi giờ GMT+7).
 */

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12)
  const y = yy + 4800 - a
  const m = mm + 12 * a - 3
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083
  }
  return jd
}

function getNewMoonDay(k: number, tz: number): number {
  const T = k / 1236.85
  const T2 = T * T
  const T3 = T2 * T
  const dr = Math.PI / 180
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M)
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr)
  C1 = C1 - 0.0004 * Math.sin(3 * dr * Mpr)
  C1 = C1 + 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr)
  C1 = C1 - 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr)
  C1 = C1 - 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr)
  C1 = C1 + 0.001 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((2 * Mpr + M) * dr)
  let deltat: number
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2
  }
  const JdNew = Jd1 + C1 - deltat
  return Math.floor(JdNew + 0.5 + tz / 24)
}

function getSunLongitude(jdn: number, tz: number): number {
  const T = (jdn - 2451545.5 - tz / 24) / 36525
  const T2 = T * T
  const dr = Math.PI / 180
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M)
  let L = L0 + DL
  L = L * dr
  L = L - 2 * Math.PI * Math.floor(L / (2 * Math.PI))
  return Math.floor((L / Math.PI) * 6)
}

function getLunarMonth11(yy: number, tz: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021
  const k = Math.floor(off / 29.530588853)
  let nm = getNewMoonDay(k, tz)
  const sunLong = getSunLongitude(nm, tz)
  if (sunLong >= 9) nm = getNewMoonDay(k - 1, tz)
  return nm
}

function getLeapMonthOffset(a11: number, tz: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5)
  let last = 0
  let i = 1
  let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz)
  do {
    last = arc
    i++
    arc = getSunLongitude(getNewMoonDay(k + i, tz), tz)
  } while (arc !== last && i < 14)
  return i - 1
}

export interface LunarDate {
  day: number
  month: number
  year: number
  leap: boolean
}

export function solarToLunar(dd: number, mm: number, yy: number, tz = 7): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy)
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853)
  let monthStart = getNewMoonDay(k + 1, tz)
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz)
  let a11 = getLunarMonth11(yy, tz)
  let b11 = a11
  let lunarYear: number
  if (a11 >= monthStart) {
    lunarYear = yy
    a11 = getLunarMonth11(yy - 1, tz)
  } else {
    lunarYear = yy + 1
    b11 = getLunarMonth11(yy + 1, tz)
  }
  const lunarDay = dayNumber - monthStart + 1
  const diff = Math.floor((monthStart - a11) / 29)
  let lunarLeap = false
  let lunarMonth = diff + 11
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, tz)
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10
      if (diff === leapMonthDiff) lunarLeap = true
    }
  }
  if (lunarMonth > 12) lunarMonth = lunarMonth - 12
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap }
}

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý']
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi']

export function canChiYear(year: number): string {
  return `${CAN[(year + 6) % 10]} ${CHI[(year + 8) % 12]}`
}

/** Đếm ngược tới ngày âm mục tiêu (1 = mùng 1, 15 = rằm) gần nhất. */
export function daysUntilLunar(target: 1 | 15, from = new Date()): number {
  for (let i = 0; i <= 40; i++) {
    const d = new Date(from)
    d.setDate(from.getDate() + i)
    const l = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear())
    if (l.day === target) return i
  }
  return -1
}
