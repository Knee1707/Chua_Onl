# 🪷 Đi Chùa Online

Trải nghiệm viếng chùa, cầu an và thắp hương trực tuyến — không gian **thiền tịnh, trang nghiêm** nhưng hiện đại, mượt mà.

**Stack:** Nuxt 4 · Vue 3 · Tailwind CSS · Supabase (tùy chọn) · Web Audio API · Canvas particle.

## ✨ Chức năng
| Component | Chức năng |
|-----------|-----------|
| `pages/index.vue` | Trang chủ: Hero chùa mờ ảo + khói nhang (particle), CTA "Bước vào chùa" |
| `MeritBox.vue` | Thùng công đức nơi cổng chùa: chọn/nhập số tiền, đồng xu rơi vào thùng, tổng công đức + bảng tấm lòng gần đây |
| `IncenseBurner.vue` | Thắp nhang: chọn 1/3/5 nén, nhang cháy dần + khói bay + âm thanh |
| `TempleBell.vue` | Rung chuông đồng: tiếng chuông ngân + sóng âm lan tỏa (ripple) |
| `SutraChanting.vue` | Tụng kinh: 4 bài (Niệm Phật, Quán Âm, Chú Vãng Sanh, Tâm Kinh), chạy chữ theo nhịp mõ + đếm số biến |
| `PrayerBook.vue` | Cầu an: form + "sổ vàng" cuộn hiển thị lời nguyện gần đây (ẩn danh) |
| `FortuneStick.vue` | Xin xăm: lắc ống → hiện quẻ dạng thẻ bài + giải nghĩa |
| `LunarCalendar.vue` | Lịch âm hôm nay + đếm ngược tới Rằm/Mùng 1 |
| `TempleThemeSwitcher.vue` | Chuyển 3 không gian chùa Bắc/Trung/Nam |
| `IncenseSmoke.vue` | Khói nhang bằng Canvas 2D (tối ưu, giới hạn particle, rAF) |

## 🎨 Thiết kế
- Màu: be/kem `#F5EFE0`, vàng đồng `#C9A356`, đỏ trầm `#8B2E2E`, nâu gỗ `#4A3728`.
- Font: **Cormorant Garamond / Noto Serif** (tiêu đề), **Be Vietnam Pro** (nội dung).
- Chuyển động chậm rãi (fade-in, ease-in-out), có `prefers-reduced-motion`.
- Họa tiết hoa sen / mây cuộn (SVG), glow vàng ấm quanh icon.

## 🚀 Chạy local
```bash
npm install
npm run dev
```
Mở http://localhost:3000

## ☁️ Bật lưu cloud (Supabase) — tùy chọn
Không có bước này app vẫn chạy đầy đủ (lời nguyện lưu ở trình duyệt).
1. Tạo project tại https://supabase.com
2. Vào **SQL Editor**, chạy nội dung file [`supabase/schema.sql`](supabase/schema.sql)
3. Copy `.env.example` → `.env`, điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` (mục Project Settings → API)
4. Chạy lại `npm run dev` — sổ cầu an giờ lưu trên cloud, chia sẻ giữa mọi người.

## ⚙️ Ghi chú kỹ thuật
- Ưu tiên CSS/Vue Transition; không dùng thư viện JS animation nặng.
- Khói nhang: 1 vòng `requestAnimationFrame`, giới hạn ~40 particle, tự dừng khi tab ẩn.
- Âm thanh tổng hợp bằng Web Audio API (không cần file nhạc, chạy offline).
- Lịch âm dùng thuật toán Hồ Ngọc Đức (GMT+7).
```
