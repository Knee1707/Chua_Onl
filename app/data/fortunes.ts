export interface Fortune {
  so: number
  loai: string // Thượng thượng / Thượng / Trung / Hạ ...
  tho: string[]
  giai: string
}

export const FORTUNES: Fortune[] = [
  { so: 1, loai: 'Thượng thượng', tho: ['Mây tan trăng tỏ giữa trời', 'Việc lành sắp đến, rạng ngời tương lai', 'Bền lòng ắt gặp phước dài', 'An khang thịnh vượng, trong ngoài đều yên.'], giai: 'Đại cát. Mọi việc hanh thông, giữ tâm lành thì phúc tự đến.' },
  { so: 2, loai: 'Thượng cát', tho: ['Nước chảy về đông thuận dòng', 'Công danh sự nghiệp trong lòng chớ lo', 'Kiên tâm trời sẽ ban cho', 'Gặp người quý giúp, ấm no vẹn tròn.'], giai: 'Tốt. Có quý nhân phù trợ, việc cầu tất thành nếu chuyên cần.' },
  { so: 3, loai: 'Trung cát', tho: ['Hoa nở còn đợi nắng lên', 'Việc nay tạm chậm, chớ nên vội vàng', 'Đợi thời gió thuận buồm sang', 'Tự nhiên thuận lợi, an khang lâu bền.'], giai: 'Khá. Chưa đến thời, cần nhẫn nại chờ cơ hội chín muồi.' },
  { so: 4, loai: 'Trung bình', tho: ['Đường xa chớ ngại gập ghềnh', 'Giữ lòng ngay thẳng, ắt bình an thôi', 'Việc chi cũng bởi ở người', 'Chuyên cần tích đức, phúc trời chẳng vơi.'], giai: 'Bình thường. Phải cố gắng, không nên trông chờ may rủi.' },
  { so: 5, loai: 'Thượng cát', tho: ['Trăng rằm sáng khắp non sông', 'Gia đạo hưng vượng, ngoài trong thuận hòa', 'Người đi kẻ ở gần xa', 'Đoàn viên sum họp, cửa nhà ấm êm.'], giai: 'Tốt cho gia đạo, hôn nhân, sum họp. Nên tiến hành việc lớn.' },
  { so: 6, loai: 'Trung cát', tho: ['Thuyền con vượt sóng ra khơi', 'Ban đầu vất vả, cuối thời hanh thông', 'Bền gan chớ nản trong lòng', 'Cần lao ắt gặt, gió đông xuân về.'], giai: 'Khởi đầu khó, về sau tốt. Kiên trì sẽ thành công.' },
  { so: 7, loai: 'Hạ cát', tho: ['Sương mờ chưa tỏ lối đi', 'Việc nay nên tĩnh, chớ vì hơn thua', 'Lặng tâm niệm Phật sớm trưa', 'Tai qua nạn khỏi, nắng mưa cũng lành.'], giai: 'Còn trắc trở. Nên giữ tâm tĩnh, tránh tranh chấp, chờ thời.' },
  { so: 8, loai: 'Thượng thượng', tho: ['Rồng mây gặp hội tương phùng', 'Công thành danh toại, muôn trùng hiển vinh', 'Phúc dày bởi đức tự mình', 'Cầu chi được nấy, an bình dài lâu.'], giai: 'Đại cát. Thời vận hanh thông, cầu tài cầu danh đều toại nguyện.' },
  { so: 9, loai: 'Trung bình', tho: ['Gió lay cành liễu bên hồ', 'Việc đời lên xuống, chớ vồ vập chi', 'Tùy duyên tùy lúc mà đi', 'Giữ lòng thanh thản, sầu bi tự tan.'], giai: 'Bình hòa. Tùy duyên mà hành, giữ tâm an là hơn.' },
  { so: 10, loai: 'Thượng cát', tho: ['Sen vàng nở giữa ao trong', 'Tâm thành lễ Phật, thỏa lòng ước mong', 'Lộc tài rồi cũng hanh thông', 'Bình an sức khỏe, thong dong tháng ngày.'], giai: 'Tốt cho sức khỏe và cầu an. Tâm thành thì sở nguyện thành.' },
  { so: 11, loai: 'Hạ cát', tho: ['Đêm dài chờ ánh bình minh', 'Gian nan thử thách, giữ mình cho ngay', 'Chớ vì lợi nhỏ đổi thay', 'Kiên tâm rồi cũng có ngày hanh thông.'], giai: 'Còn khó khăn. Giữ chính trực, đừng tham lợi trước mắt.' },
  { so: 12, loai: 'Trung cát', tho: ['Cây khô gặp tiết xuân về', 'Đâm chồi nảy lộc, tràn trề sức xuân', 'Việc xưa nay được xoay vần', 'Hết cơn bĩ cực, đến tuần thái lai.'], giai: 'Chuyển vận tốt dần. Sau gian khó là hồi tươi sáng.' },
  { so: 13, loai: 'Thượng cát', tho: ['Chuông chùa vang vọng non xa', 'Duyên lành gặp gỡ, chan hòa bốn phương', 'Đi buôn thì được lộ đường', 'Học hành thi cử, văn chương rạng ngời.'], giai: 'Tốt cho học hành, thi cử, giao thương. Có duyên may.' },
  { so: 14, loai: 'Trung bình', tho: ['Nước lặng thuyền đậu bến bờ', 'Chưa nên vội vã, hãy chờ gió lên', 'Việc chi cứ giữ vững bền', 'Tự nhiên rồi cũng êm đềm bình yên.'], giai: 'Nên án binh bất động, chờ thời điểm thích hợp.' },
  { so: 15, loai: 'Thượng thượng', tho: ['Phúc lành như biển như non', 'Cháu con hiếu thảo, cửa son huy hoàng', 'Tâm từ rộng mở thênh thang', 'Đức dày trời đãi, an khang trọn đời.'], giai: 'Đại cát. Phúc đức viên mãn, gia đạo hưng thịnh dài lâu.' },
  { so: 16, loai: 'Hạ cát', tho: ['Mưa dầm chưa tạnh trên đồng', 'Việc nay nên đợi, chớ mong được liền', 'Tu tâm dưỡng tính cho hiền', 'Qua cơn mưa gió, bình yên lại về.'], giai: 'Tạm thời chưa thuận. Dưỡng tâm tích đức rồi việc sẽ hanh.' },
  { so: 17, loai: 'Trung cát', tho: ['Chim hồng tung cánh trời cao', 'Chí xa vạn dặm, biết bao dặm trường', 'Bền lòng vượt mọi gió sương', 'Có ngày rạng rỡ, quê hương đón mừng.'], giai: 'Người có chí lớn, xuất hành - đi xa đều tốt.' },
  { so: 18, loai: 'Thượng cát', tho: ['Giếng xưa mạch nước còn trong', 'Ơn trên gia hộ, thuận lòng người ngay', 'Ruộng sâu trâu khỏe cấy cày', 'Mùa vàng bội thu, tháng ngày ấm no.'], giai: 'Cầu tài cầu lộc hanh thông, làm ăn phát đạt.' },
  { so: 19, loai: 'Trung bình', tho: ['Đèn khuya một bóng canh chầy', 'Việc chi cân nhắc, chớ vay chớ liều', 'Giữ mình đạm bạc thanh cao', 'Tự khắc an ổn, dồi dào phước duyên.'], giai: 'Nên cẩn trọng tiền bạc, giữ nếp sống điều độ.' },
  { so: 20, loai: 'Thượng thượng', tho: ['Trời quang mây tạnh bốn phương', 'Cát tường như ý, con đường thênh thang', 'Tâm thành lễ Phật dâng hương', 'Sở cầu như nguyện, an khang đời đời.'], giai: 'Đại cát vạn sự. Tâm nguyện thành tựu viên mãn.' }
]

export function randomFortune(): Fortune {
  return FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
}
