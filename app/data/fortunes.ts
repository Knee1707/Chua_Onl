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
  { so: 20, loai: 'Thượng thượng', tho: ['Trời quang mây tạnh bốn phương', 'Cát tường như ý, con đường thênh thang', 'Tâm thành lễ Phật dâng hương', 'Sở cầu như nguyện, an khang đời đời.'], giai: 'Đại cát vạn sự. Tâm nguyện thành tựu viên mãn.' },
  { so: 21, loai: 'Trung cát', tho: ['Non xanh nước biếc hữu tình', 'Đường đi tuy khó, giữ mình thì hơn', 'Chớ nghe lời nói thiệt hơn', 'Bền tâm ắt vượt, oán ơn phân minh.'], giai: 'Việc dần hanh, chớ nghe xúi giục. Giữ chính kiến sẽ qua.' },
  { so: 22, loai: 'Thượng cát', tho: ['Gió xuân đưa cánh én về', 'Tin vui sắp đến, bốn bề hân hoan', 'Cửa nhà rộng mở thênh thang', 'Đón mừng lộc phước, giàu sang thuận hòa.'], giai: 'Có tin mừng, đón lộc. Cầu con cầu duyên đều tốt.' },
  { so: 23, loai: 'Hạ cát', tho: ['Thuyền neo bến vắng chờ mưa', 'Việc nay chưa tiện, hãy chờ ngày sau', 'Đừng vì nôn nóng mà đau', 'Dưỡng thần tích trí, mai sau vững vàng.'], giai: 'Chưa thuận, nên chờ. Tránh quyết định vội vàng lúc này.' },
  { so: 24, loai: 'Trung bình', tho: ['Trăng khuya soi bóng bên thềm', 'Một mình ngẫm việc, êm đềm mà lo', 'Tùy cơ liệu lý mà lo', 'Giữ lòng chân thật, trời cho an lành.'], giai: 'Nên tự lực, cẩn thận. Chân thật thì được người tin.' },
  { so: 25, loai: 'Thượng cát', tho: ['Ngọc lành ẩn dưới lớp rêu', 'Có ngày tỏ rạng, mọi điều hanh thông', 'Tài năng chớ ngại chờ mong', 'Gặp thời gặp chủ, thỏa lòng ước mơ.'], giai: 'Người có tài sẽ được trọng dụng. Kiên nhẫn chờ thời.' },
  { so: 26, loai: 'Trung cát', tho: ['Mưa lành tưới mát ruộng nương', 'Công lao chăm chỉ, mọi đường tốt tươi', 'Chớ tham của phi nghĩa đời', 'An bần lạc đạo, thảnh thơi tháng ngày.'], giai: 'Chăm chỉ thì đủ đầy. Không nên tham lam, giữ đạo nghĩa.' },
  { so: 27, loai: 'Hạ cát', tho: ['Sông sâu sóng cả chớ đùa', 'Việc to nên hoãn, tránh mưa gió nhiều', 'Giữ mình khiêm tốn sớm chiều', 'Qua cơn bĩ cực, mọi điều lại yên.'], giai: 'Gặp trắc trở, nên khiêm nhường, hoãn việc lớn.' },
  { so: 28, loai: 'Thượng thượng', tho: ['Phượng hoàng đậu chốn ngô đồng', 'Vinh hoa phú quý, thong dong một đời', 'Đức nhân trời đất đãi người', 'Cháu con hiển đạt, rạng ngời tổ tông.'], giai: 'Đại cát. Công danh phú quý, con cháu vinh hiển.' },
  { so: 29, loai: 'Trung bình', tho: ['Đèn chong soi tỏ trang thư', 'Học hành chăm chỉ, thi cư có ngày', 'Chớ ham vui thú đó đây', 'Chuyên cần rồi cũng có ngày đề danh.'], giai: 'Thi cử cần chuyên cần, tránh ham chơi thì mới thành.' },
  { so: 30, loai: 'Thượng cát', tho: ['Cầu vồng bắc nhịp sau mưa', 'Duyên lành gặp gỡ, đón đưa ân tình', 'Vợ chồng hòa thuận đồng tâm', 'Trăm năm gắn bó, keo sơn mặn nồng.'], giai: 'Tốt cho hôn nhân, tình duyên. Đồng lòng thì bền lâu.' },
  { so: 31, loai: 'Hạ cát', tho: ['Cây cao đón gió bốn bề', 'Danh cao lắm kẻ dèm chê tị hiềm', 'Giữ mình khiêm hạ cho êm', 'Bớt phần kiêu ngạo, thêm niềm an vui.'], giai: 'Đề phòng thị phi, kẻ ghen ghét. Sống khiêm nhường là hơn.' },
  { so: 32, loai: 'Trung cát', tho: ['Hạt mầm gieo xuống đất lành', 'Chuyên cần vun xới, ắt thành cây cao', 'Việc chi cũng bởi công lao', 'Bền tâm tích lũy, dồi dào về sau.'], giai: 'Tích tiểu thành đại. Kiên trì vun đắp sẽ có thành quả.' },
  { so: 33, loai: 'Thượng cát', tho: ['Sen thơm ngát tỏa đầm xanh', 'Tâm an trí sáng, phước lành đầy vơi', 'Bệnh xưa rồi cũng qua thôi', 'Thân tâm an lạc, thảnh thơi cõi lòng.'], giai: 'Tốt cho sức khỏe, bệnh thuyên giảm. Giữ tâm an là thuốc quý.' },
  { so: 34, loai: 'Thượng thượng', tho: ['Vàng mười thử lửa càng trong', 'Gian nan tôi luyện, một lòng sắt son', 'Qua rồi sóng gió chẳng còn', 'Công thành danh toại, nước non reo mừng.'], giai: 'Đại cát sau gian khó. Vượt thử thách ắt thành công lớn.' }
]

export function randomFortune(): Fortune {
  return FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
}
