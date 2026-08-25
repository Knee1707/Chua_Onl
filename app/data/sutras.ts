export interface Sutra {
  id: string
  ten: string
  mota: string
  nhip: number // mili-giây mỗi câu (nhịp mõ)
  cau: string[]
}

/**
 * Các bài kinh/chú truyền thống (phổ biến trong nghi thức tụng niệm).
 * Trình bày dạng từng câu để chạy chữ theo nhịp mõ.
 */
export const SUTRAS: Sutra[] = [
  {
    id: 'niem-phat',
    ten: 'Niệm Phật A Di Đà',
    mota: 'Nhất tâm xưng niệm hồng danh Đức Phật A Di Đà.',
    nhip: 2000,
    cau: [
      'Nam Mô A Di Đà Phật',
      'Nam Mô A Di Đà Phật',
      'Nam Mô A Di Đà Phật',
      'Nam Mô A Di Đà Phật',
      'Nam Mô A Di Đà Phật',
      'Nam Mô A Di Đà Phật'
    ]
  },
  {
    id: 'quan-am',
    ten: 'Niệm Quán Thế Âm',
    mota: 'Xưng niệm danh hiệu Bồ Tát Quán Thế Âm, cầu bình an.',
    nhip: 2200,
    cau: [
      'Nam Mô Đại Từ Đại Bi',
      'Cứu khổ cứu nạn',
      'Quán Thế Âm Bồ Tát',
      'Nam Mô Quán Thế Âm Bồ Tát',
      'Nam Mô Quán Thế Âm Bồ Tát',
      'Nam Mô Quán Thế Âm Bồ Tát'
    ]
  },
  {
    id: 'vang-sanh',
    ten: 'Chú Vãng Sanh',
    mota: 'Vãng sanh Tịnh độ thần chú (Bạt nhất thiết nghiệp chướng…).',
    nhip: 2400,
    cau: [
      'Nam mô a di đa bà dạ',
      'Đa tha già đa dạ',
      'Đa địa dạ tha',
      'A di rị đô bà tỳ',
      'A di rị đa, tất đam bà tỳ',
      'A di rị đa, tỳ ca lan đế',
      'A di rị đa, tỳ ca lan đa',
      'Già di nị, già già na',
      'Chỉ đa ca lệ, ta bà ha'
    ]
  },
  {
    id: 'tam-kinh',
    ten: 'Bát Nhã Tâm Kinh',
    mota: 'Tinh yếu trí tuệ Bát Nhã Ba La Mật Đa (trích lược).',
    nhip: 3000,
    cau: [
      'Quán Tự Tại Bồ Tát,',
      'hành thâm Bát Nhã Ba La Mật Đa thời,',
      'chiếu kiến ngũ uẩn giai không,',
      'độ nhất thiết khổ ách.',
      'Xá Lợi Tử! Sắc bất dị không,',
      'không bất dị sắc;',
      'sắc tức thị không, không tức thị sắc.',
      'Thọ, tưởng, hành, thức diệc phục như thị.',
      'Yết đế, yết đế, ba la yết đế,',
      'ba la tăng yết đế, bồ đề tát bà ha.'
    ]
  }
]
