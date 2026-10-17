"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, Headphones, Tag, CreditCard, AlertCircle, RotateCcw } from "lucide-react";

interface SubItem {
  id: number;
  title: string;
  icon: typeof ShieldCheck;
  updatedAt: string;
  content: React.ReactNode;
}

export default function DieuKhoanSuDung() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => setOpenItems([1, 2, 3, 4, 5, 6]);
  const collapseAll = () => setOpenItems([]);

  const subItems: SubItem[] = [
    {
      id: 1,
      title: "1. CHÍNH SÁCH BẢO MẬT THÔNG TIN",
      icon: ShieldCheck,
      updatedAt: "16/10/2026",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
          <p>
            <strong>Còn Số</strong> tôn trọng quyền riêng tư của khách hàng và cam kết bảo vệ thông tin trong quá trình khách hàng truy cập, tra cứu thông tin vé và gửi yêu cầu đặt vé trên website.
          </p>
          <p>
            Chính sách này giải thích cách Còn Số xử lý thông tin phát sinh trong quá trình sử dụng website.
          </p>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">1.1. Thông tin được thu thập</h4>
            <p>
              Còn Số không yêu cầu khách hàng đăng ký tài khoản hoặc cung cấp họ tên, số điện thoại, email hay các thông tin cá nhân khác để truy cập và xem thông tin vé trên website.
            </p>
            <p>
              Khi khách hàng sử dụng chức năng đặt vé, hệ thống có thể xử lý thông tin liên quan đến yêu cầu đặt vé như loại vé, ngày mở thưởng, số lượng vé, thời điểm gửi yêu cầu và trạng thái xử lý đơn.
            </p>
            <p>
              Website cũng có thể phát sinh dữ liệu kỹ thuật cần thiết cho việc vận hành, bảo mật và khắc phục sự cố, tùy theo cấu hình hệ thống và các dịch vụ kỹ thuật được sử dụng.
            </p>
            <p>
              Còn Số không chủ động yêu cầu khách hàng cung cấp thông tin cá nhân ngoài phạm vi cần thiết cho hoạt động của website.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">1.2. Mục đích sử dụng thông tin</h4>
            <p>Thông tin phát sinh trong quá trình sử dụng website được sử dụng nhằm:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Hiển thị thông tin vé để khách hàng tham khảo.</li>
              <li>Tiếp nhận và xử lý yêu cầu đặt vé.</li>
              <li>Kiểm tra tình trạng vé và thông báo kết quả xác nhận.</li>
              <li>Quản lý, thống kê số lượng vé được yêu cầu và tình trạng xử lý.</li>
              <li>Đối chiếu thông tin khi phát sinh sai lệch hoặc tranh chấp liên quan đến đơn hàng.</li>
              <li>Duy trì tính ổn định, an toàn và bảo mật của website.</li>
            </ul>
            <p>
              Còn Số không sử dụng dữ liệu cho mục đích quảng cáo trực tiếp đến khách hàng dựa trên thông tin cá nhân mà khách hàng chưa cung cấp hoặc chưa đồng ý cho sử dụng.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">1.3. Lưu trữ và bảo vệ thông tin</h4>
            <p>
              Còn Số áp dụng các biện pháp phù hợp để bảo vệ dữ liệu trong phạm vi quản lý, hạn chế nguy cơ truy cập trái phép, sửa đổi, tiết lộ hoặc sử dụng sai mục đích.
            </p>
            <p>
              Dữ liệu được lưu trữ trong thời gian cần thiết cho hoạt động quản lý website, xử lý yêu cầu đặt vé, giải quyết tranh chấp hoặc thực hiện nghĩa vụ theo quy định pháp luật.
            </p>
            <p>
              Còn Số không cam kết rằng mọi hệ thống kỹ thuật đều an toàn tuyệt đối, nhưng sẽ nỗ lực thực hiện các biện pháp bảo vệ phù hợp.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">1.4. Cung cấp thông tin cho bên thứ ba</h4>
            <p>
              Còn Số không mua bán hoặc tùy tiện cung cấp thông tin khách hàng cho bên thứ ba.
            </p>
            <p>
              Dữ liệu có thể được xử lý bởi đơn vị cung cấp dịch vụ kỹ thuật phục vụ vận hành website hoặc được cung cấp cho cơ quan có thẩm quyền khi có yêu cầu hợp pháp theo quy định pháp luật.
            </p>
            <p>
              Việc xử lý dữ liệu được giới hạn trong phạm vi cần thiết cho mục đích tương ứng.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">1.5. Quyền của khách hàng</h4>
            <p>
              Nếu thông tin cá nhân của khách hàng được thu thập hoặc xử lý trong quá trình sử dụng website, khách hàng có thể liên hệ Còn Số để yêu cầu giải thích, kiểm tra, chỉnh sửa hoặc xóa thông tin trong phạm vi pháp luật cho phép.
            </p>
            <p>
              Các yêu cầu sẽ được xem xét và xử lý theo quy định pháp luật hiện hành.
            </p>
          </div>

          <div className="space-y-1 pt-1 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
            <h4 className="font-bold text-sky-800">1.6. Liên hệ về bảo mật</h4>
            <p>Mọi câu hỏi hoặc phản ánh liên quan đến chính sách bảo mật vui lòng liên hệ:</p>
            <ul className="space-y-0.5">
              <li>• Điện thoại: <a href="tel:0899258808" className="text-sky-700 font-semibold hover:underline">0899 25 8808</a></li>
              <li>• Email: <a href="mailto:vuhoang712@gmail.com" className="text-sky-700 font-semibold hover:underline">vuhoang712@gmail.com</a></li>
              <li>• Địa chỉ: 72 Ngô Sĩ Liên, P. Phan Thiết, Lâm Đồng.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "2. PHƯƠNG THỨC TIẾP NHẬN VÀ GIẢI QUYẾT PHẢN ÁNH, YÊU CẦU, KHIẾU NẠI",
      icon: Headphones,
      updatedAt: "16/10/2026",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
          <p>
            Còn Số luôn tôn trọng ý kiến đóng góp của khách hàng và nỗ lực giải quyết các phản ánh, yêu cầu, khiếu nại một cách khách quan, minh bạch và phù hợp với quy định pháp luật.
          </p>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">2.1. Phạm vi tiếp nhận</h4>
            <p>Còn Số tiếp nhận phản ánh, yêu cầu và khiếu nại liên quan đến:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Thông tin vé hiển thị trên website.</li>
              <li>Yêu cầu đặt vé và kết quả xác nhận.</li>
              <li>Tình trạng vé đã được xác nhận để khách đến nhận.</li>
              <li>Sai lệch về loại vé, ngày mở thưởng hoặc số lượng vé.</li>
              <li>Giá vé và tổng giá trị đơn hàng.</li>
              <li>Thanh toán bằng tiền mặt hoặc chuyển khoản.</li>
              <li>Việc nhận vé trực tiếp.</li>
              <li>Các vấn đề liên quan đến hoạt động và bảo mật của website.</li>
            </ul>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">2.2. Phương thức tiếp nhận</h4>
            <p>Khách hàng có thể gửi yêu cầu thông qua các kênh sau:</p>
            <ul className="space-y-1 pl-1">
              <li>• Website: <a href="https://con-so.io.vn" target="_blank" rel="noreferrer" className="text-sky-700 font-semibold underline">https://con-so.io.vn</a></li>
              <li>• Điện thoại: <a href="tel:0899258808" className="text-sky-700 font-semibold hover:underline">0899 25 8808</a></li>
              <li>• Email: <a href="mailto:vuhoang712@gmail.com" className="text-sky-700 font-semibold hover:underline">vuhoang712@gmail.com</a></li>
              <li>• Địa chỉ: 72 Ngô Sĩ Liên, P. Phan Thiết, Lâm Đồng.</li>
            </ul>
            <p className="pt-1">
              Khách hàng nên cung cấp mã đơn hàng hoặc thông tin cần thiết để xác định yêu cầu đang được phản ánh. Đối với vấn đề liên quan đến thanh toán, khách hàng có thể cung cấp chứng từ giao dịch phù hợp để Còn Số kiểm tra và đối chiếu.
            </p>
            <p className="text-amber-700 font-medium">
              * Khách hàng không nên cung cấp mật khẩu ngân hàng, mã OTP hoặc thông tin xác thực bí mật.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">2.3. Quy trình giải quyết</h4>
            <div className="space-y-1.5 pl-1">
              <p><strong>Bước 1: Tiếp nhận</strong> — Còn Số tiếp nhận nội dung phản ánh, yêu cầu hoặc khiếu nại từ khách hàng.</p>
              <p><strong>Bước 2: Kiểm tra và xác minh</strong> — Còn Số kiểm tra thông tin liên quan đến yêu cầu đặt vé, tình trạng xác nhận, chứng từ thanh toán và các dữ liệu cần thiết khác. Trong trường hợp cần thiết, Còn Số có thể đề nghị khách hàng bổ sung thông tin để xác minh.</p>
              <p><strong>Bước 3: Đưa ra phương án xử lý</strong> — Sau khi xác minh, Còn Số sẽ xem xét phương án phù hợp, bao gồm xác nhận lại thông tin, điều chỉnh sai lệch, xử lý yêu cầu hủy hoặc hoàn trả tiền trong trường hợp đủ điều kiện.</p>
              <p><strong>Bước 4: Thông báo kết quả</strong> — Còn Số thông báo kết quả cho khách hàng qua phương thức liên hệ phù hợp.</p>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">2.4. Thời gian xử lý</h4>
            <p>
              Còn Số cố gắng phản hồi trong vòng <strong>03 ngày làm việc</strong> kể từ khi nhận đủ thông tin cần thiết.
            </p>
            <p>
              Đối với những trường hợp phức tạp cần xác minh thêm, thời gian xử lý có thể kéo dài hơn. Còn Số sẽ thông báo khi cần thêm thời gian. Thời gian trên là mục tiêu xử lý thông thường, không thay thế các thời hạn bắt buộc theo quy định pháp luật.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">2.5. Nguyên tắc giải quyết</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Tôn trọng quyền và lợi ích hợp pháp của khách hàng.</li>
              <li>Xử lý trên cơ sở thông tin và chứng cứ liên quan.</li>
              <li>Bảo mật dữ liệu trong quá trình giải quyết.</li>
              <li>Không tự ý thay đổi thông tin giao dịch nhằm gây bất lợi cho khách hàng.</li>
              <li>Ưu tiên thương lượng và giải quyết trên tinh thần thiện chí.</li>
            </ul>
            <p className="pt-1">
              Nếu không đồng ý với kết quả giải quyết, khách hàng có quyền sử dụng các phương thức khiếu nại hoặc yêu cầu cơ quan có thẩm quyền giải quyết theo quy định pháp luật.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "3. CHÍNH SÁCH GIÁ",
      icon: Tag,
      updatedAt: "16/10/2026",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
          <p>
            Còn Số công khai thông tin giá vé để khách hàng thuận tiện tra cứu, lựa chọn và kiểm tra giá trị trước khi gửi yêu cầu đặt vé.
          </p>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">3.1. Giá vé áp dụng</h4>
            <p>
              Đối với vé số truyền thống có mệnh giá <strong>10.000 đồng/vé</strong>, giá bán được áp dụng theo mệnh giá vé do đơn vị phát hành quy định và phù hợp với pháp luật hiện hành.
            </p>
            <p>
              Tổng giá trị được xác định bằng số lượng vé nhân với mệnh giá tương ứng.
            </p>
            <p>
              Đối với các loại vé có mệnh giá khác, giá vé sẽ được hiển thị theo mệnh giá thực tế của loại vé đó.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">3.2. Nguyên tắc công khai giá</h4>
            <p>
              Còn Số thực hiện công khai giá vé trên website để khách hàng tham khảo trước khi gửi yêu cầu đặt vé.
            </p>
            <p>
              Còn Số không tự ý tăng giá vé vượt quá mệnh giá được phép áp dụng.
            </p>
            <p>
              Nếu có khoản phí hợp pháp phát sinh liên quan đến phương thức cung cấp hàng hóa, khoản phí đó phải được thông báo rõ ràng trước khi khách hàng xác nhận giao dịch.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">3.3. Thay đổi giá</h4>
            <p>
              Trong trường hợp mệnh giá vé hoặc quy định liên quan đến giá bán thay đổi theo quy định của cơ quan có thẩm quyền, Còn Số sẽ cập nhật thông tin phù hợp.
            </p>
            <p>
              Đối với yêu cầu đặt vé đã được xác nhận, việc xử lý thay đổi giá sẽ được thực hiện theo thông tin đã xác nhận, thỏa thuận hợp lệ và quy định pháp luật có liên quan.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">3.4. Kiểm tra giá trước khi nhận vé</h4>
            <p>
              Khách hàng nên kiểm tra loại vé, ngày mở thưởng, số lượng và tổng giá trị đơn hàng trước khi đến nhận vé.
            </p>
            <p>
              Nếu phát hiện sai lệch về giá hoặc số lượng, khách hàng vui lòng liên hệ Còn Số để được kiểm tra và giải quyết.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: "4. CHÍNH SÁCH THANH TOÁN",
      icon: CreditCard,
      updatedAt: "16/10/2026",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
          <p>
            Còn Số hỗ trợ hai phương thức thanh toán là <strong>tiền mặt</strong> và <strong>chuyển khoản ngân hàng</strong>.
          </p>
          <p>
            Việc thanh toán được thực hiện khi khách hàng nhận vé trực tiếp tại địa điểm của Còn Số, theo thông tin và tình trạng giao dịch đã được xác nhận.
          </p>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">4.1. Thanh toán bằng tiền mặt</h4>
            <p>
              Khách hàng có thể đến địa điểm nhận vé, kiểm tra thông tin vé và thanh toán bằng tiền mặt.
            </p>
            <p className="bg-sky-50/70 p-2 rounded-lg border border-sky-100">
              <strong>Địa điểm nhận vé:</strong> 72 Ngô Sĩ Liên, P. Phan Thiết, Lâm Đồng.
            </p>
            <p>
              Khách hàng nên kiểm tra loại vé, ngày mở thưởng, số lượng và tổng số tiền trước khi thanh toán. Còn Số xác nhận thanh toán sau khi nhận đủ số tiền tương ứng với giao dịch.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <h4 className="font-bold text-sky-800">4.2. Thanh toán bằng chuyển khoản ngân hàng</h4>
            <p>Khách hàng có thể lựa chọn thanh toán bằng cách chuyển khoản vào tài khoản ngân hàng sau:</p>
            
            <div className="overflow-hidden rounded-xl border border-sky-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-sky-50 text-sky-900 border-b border-sky-200">
                  <tr>
                    <th className="py-2 px-3 font-semibold w-1/3">Thông tin</th>
                    <th className="py-2 px-3 font-semibold">Nội dung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  <tr>
                    <td className="py-2 px-3 text-slate-600 font-medium">Ngân hàng</td>
                    <td className="py-2 px-3 font-bold text-sky-900">MB Bank</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-600 font-medium">Chủ tài khoản</td>
                    <td className="py-2 px-3 font-bold text-sky-900">Hoàng Minh Vũ</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-600 font-medium">Số tài khoản</td>
                    <td className="py-2 px-3 font-bold text-purple-700 tracking-wider">0922341568</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-600 font-medium">Nội dung chuyển khoản</td>
                    <td className="py-2 px-3 text-slate-700">Mã đơn hàng hoặc nội dung được hướng dẫn.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>Khách hàng nên ghi đúng nội dung chuyển khoản để thuận tiện cho việc đối chiếu.</p>
            <p>Sau khi chuyển khoản, khách hàng cần chờ xác nhận giao dịch thành công trước khi xem đơn hàng là đã thanh toán.</p>
            <p className="text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
              * Việc gửi ảnh chụp giao dịch không tự động đồng nghĩa với việc khoản tiền đã được nhận thành công.
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <h4 className="font-bold text-sky-800">4.3. Quy trình thanh toán và nhận vé</h4>
            <p>Quy trình giao dịch tại Còn Số được thực hiện theo các bước:</p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-600">
              <li>Khách hàng xem thông tin vé trên website.</li>
              <li>Khách hàng gửi yêu cầu đặt vé.</li>
              <li>Còn Số kiểm tra khả năng đáp ứng và thông báo kết quả xác nhận.</li>
              <li>Khách hàng đến địa điểm nhận vé theo thông tin đã thống nhất.</li>
              <li>Khách hàng kiểm tra vé và thanh toán bằng tiền mặt hoặc chuyển khoản.</li>
              <li>Giao dịch được xác nhận theo tình trạng nhận vé và thanh toán thực tế.</li>
            </ol>
            <p className="italic text-slate-500 pt-0.5">
              * Việc gửi yêu cầu đặt vé không đồng nghĩa với việc khách hàng đã thanh toán hoặc giao dịch mua bán đã hoàn tất.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">4.4. Thanh toán sai hoặc thanh toán trùng</h4>
            <p>
              Nếu khách hàng chuyển khoản sai số tiền, chuyển khoản trùng hoặc phát sinh sai lệch giao dịch, vui lòng liên hệ Còn Số để được kiểm tra.
            </p>
            <p>
              Còn Số sẽ đối chiếu thông tin và xử lý khoản tiền thừa hoặc khoản thanh toán trùng khi có đủ căn cứ xác nhận.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">4.5. An toàn thanh toán</h4>
            <p>
              Khách hàng chỉ nên chuyển tiền theo thông tin tài khoản được công bố tại chính sách này hoặc được Còn Số xác nhận qua kênh liên hệ chính thức.
            </p>
            <p>
              Còn Số không yêu cầu khách hàng cung cấp mật khẩu ngân hàng, mã OTP hoặc thông tin xác thực bí mật.
            </p>
            <p>
              Nếu phát hiện dấu hiệu giả mạo thông tin thanh toán, khách hàng nên liên hệ Còn Số để xác minh trước khi giao dịch.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: "5. CÁC ĐIỀU KIỆN HOẶC HẠN CHẾ TRONG VIỆC CUNG CẤP HÀNG HÓA, DỊCH VỤ TRÊN NỀN TẢNG",
      icon: AlertCircle,
      updatedAt: "16/10/2026",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
          <p>
            <strong>Còn Số</strong> là nền tảng hỗ trợ tra cứu thông tin vé số, gửi yêu cầu đặt vé và quản lý thông tin liên quan đến hoạt động bán vé.
          </p>
          <p>
            Website giúp khách hàng thuận tiện hơn trong việc lựa chọn vé và tìm hiểu thông tin trước khi đến nhận vé trực tiếp.
          </p>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">5.1. Điều kiện sử dụng website</h4>
            <p>
              Khách hàng cần sử dụng website đúng mục đích, cung cấp thông tin đặt vé chính xác và tuân thủ quy định pháp luật có liên quan. Khách hàng có trách nhiệm kiểm tra thông tin vé trước khi gửi yêu cầu.
            </p>
            <p>
              Còn Số có thể từ chối hoặc tạm dừng xử lý các yêu cầu có dấu hiệu gian lận, giả mạo, phá hoại hệ thống hoặc vi phạm pháp luật.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">5.2. Yêu cầu đặt vé và xác nhận</h4>
            <p>
              Khách hàng có thể lựa chọn loại vé, ngày mở thưởng và số lượng vé trên website để gửi yêu cầu. Sau khi nhận yêu cầu, Còn Số kiểm tra tình trạng vé và thông báo kết quả.
            </p>
            <p>
              Việc gửi yêu cầu đặt vé không đồng nghĩa với việc vé đã được xác nhận giữ thành công. Khách hàng cần căn cứ vào thông báo xác nhận của Còn Số để biết tình trạng yêu cầu của mình.
            </p>
            <p>
              Việc mua vé và thanh toán được thực hiện trực tiếp tại địa điểm nhận vé theo quy trình áp dụng và các quy định pháp luật có liên quan.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">5.3. Tình trạng vé và thời điểm đặt</h4>
            <p>
              Tình trạng vé có thể thay đổi theo hoạt động bán vé thực tế. Còn Số không bảo đảm mọi yêu cầu đặt vé đều được đáp ứng, đặc biệt khi vé không còn khả năng cung cấp hoặc yêu cầu được gửi quá sát thời điểm ngừng bán.
            </p>
            <p>
              Đối với yêu cầu không thể đáp ứng, Còn Số sẽ thông báo cho khách hàng khi phù hợp. Khách hàng nên gửi yêu cầu đủ sớm để có thời gian kiểm tra và nhận thông tin phản hồi.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">5.4. Phạm vi cung cấp và nhận vé</h4>
            <p>
              Còn Số áp dụng phương thức nhận vé trực tiếp tại địa điểm: <strong>72 Ngô Sĩ Liên, P. Phan Thiết, Lâm Đồng</strong>.
            </p>
            <p>
              Khách hàng đến nhận vé theo thông tin đã xác nhận, kiểm tra vé và thực hiện thanh toán. Còn Số không mặc nhiên cung cấp dịch vụ giao vé tận nhà hoặc vận chuyển vé đến địa chỉ khách hàng.
            </p>
            <p>
              Nếu phương thức giao nhận khác được triển khai trong tương lai, các điều kiện liên quan sẽ được công bố và xác nhận trước khi thực hiện.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">5.5. Trách nhiệm của khách hàng</h4>
            <p>Khách hàng có trách nhiệm:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Kiểm tra chính xác loại vé, ngày mở thưởng và số lượng vé.</li>
              <li>Theo dõi thông báo xác nhận yêu cầu đặt vé.</li>
              <li>Đến nhận vé theo thông tin đã thống nhất.</li>
              <li>Kiểm tra vé trước khi hoàn tất giao dịch.</li>
              <li>Thanh toán đúng giá trị giao dịch đã được xác nhận.</li>
              <li>Không sử dụng website cho các hành vi gian lận hoặc vi phạm pháp luật.</li>
            </ul>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">5.6. Quyền tạm dừng hoặc từ chối xử lý yêu cầu</h4>
            <p>Còn Số có thể tạm dừng xác minh hoặc từ chối xử lý yêu cầu trong những trường hợp có căn cứ hợp lý, bao gồm:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Thông tin đặt vé không đầy đủ hoặc không thể xác minh.</li>
              <li>Vé không còn khả năng cung cấp.</li>
              <li>Có dấu hiệu gian lận hoặc giả mạo.</li>
              <li>Phát sinh sự cố kỹ thuật ảnh hưởng đến tính chính xác của dữ liệu.</li>
              <li>Việc tiếp tục xử lý có nguy cơ vi phạm pháp luật.</li>
            </ul>
            <p className="pt-1">
              Còn Số sẽ thông báo cho khách hàng khi phù hợp và giải quyết các khoản tiền đã nhận theo tình trạng thực tế của giao dịch và quy định pháp luật.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">5.7. Gián đoạn dịch vụ</h4>
            <p>
              Website có thể tạm thời gián đoạn do bảo trì, nâng cấp, lỗi kết nối hoặc các nguyên nhân kỹ thuật khác.
            </p>
            <p>
              Trong trường hợp không thể gửi yêu cầu hoặc tra cứu thông tin, khách hàng có thể liên hệ trực tiếp với Còn Số để được hỗ trợ. Còn Số nỗ lực duy trì website hoạt động ổn định nhưng không cam kết website luôn hoạt động liên tục trong mọi tình huống.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: "6. CHÍNH SÁCH NHẬN VÉ, ĐỔI VÉ, HỦY YÊU CẦU VÀ HOÀN TIỀN",
      icon: RotateCcw,
      updatedAt: "16/10/2026",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
          <p>
            Còn Số áp dụng phương thức nhận vé trực tiếp tại địa điểm bán. Chính sách này quy định việc nhận vé, xử lý sai lệch, hủy yêu cầu và hoàn trả tiền trong các trường hợp phát sinh.
          </p>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">6.1. Phương thức nhận vé</h4>
            <p>
              Sau khi yêu cầu đặt vé được xác nhận, khách hàng đến nhận vé tại địa chỉ: <strong>72 Ngô Sĩ Liên, P. Phan Thiết, Lâm Đồng</strong>.
            </p>
            <p>Khi nhận vé, khách hàng cần kiểm tra:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Loại vé và đơn vị phát hành.</li>
              <li>Ngày mở thưởng.</li>
              <li>Số lượng vé.</li>
              <li>Thông tin in trên vé.</li>
              <li>Tổng giá trị giao dịch.</li>
            </ul>
            <p className="pt-1">
              Khách hàng nên thông báo ngay cho Còn Số nếu phát hiện sai lệch trước khi hoàn tất giao dịch. Còn Số hiện không mặc nhiên cung cấp dịch vụ giao vé tận nơi.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">6.2. Thời gian nhận vé</h4>
            <p>
              Khách hàng nhận vé theo thời gian đã được Còn Số thông báo hoặc thống nhất.
            </p>
            <p>
              Do vé số gắn với ngày mở thưởng cụ thể, khách hàng nên đến nhận vé đủ sớm và không nên chờ đến sát thời điểm mở thưởng.
            </p>
            <p>
              Nếu không thể đến nhận theo thời gian đã hẹn, khách hàng vui lòng liên hệ Còn Số để kiểm tra khả năng tiếp tục đáp ứng yêu cầu. Việc tiếp tục giữ vé hoặc xử lý yêu cầu sẽ căn cứ vào tình trạng vé thực tế và các quy định áp dụng.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">6.3. Chính sách đổi vé</h4>
            <p>
              Còn Số xem xét xử lý các trường hợp giao sai vé, sai số lượng hoặc sai thông tin so với nội dung đã xác nhận. Tùy tình trạng thực tế, phương án xử lý có thể bao gồm điều chỉnh, đổi vé phù hợp hoặc hoàn trả khoản tiền tương ứng nếu khách hàng đã thanh toán và đủ điều kiện hoàn tiền.
            </p>
            <p>
              Đối với yêu cầu đổi vé do khách hàng thay đổi ý định, Còn Số sẽ xem xét theo từng trường hợp, căn cứ vào tình trạng giao dịch, khả năng xử lý thực tế và quy định pháp luật. Việc đổi vé không được bảo đảm trong mọi trường hợp.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">6.4. Hủy yêu cầu đặt vé</h4>
            <p>
              Khách hàng có thể liên hệ Còn Số để đề nghị hủy yêu cầu đặt vé.
            </p>
            <p>
              Đối với yêu cầu chưa được xác nhận, Còn Số sẽ kiểm tra trạng thái và thực hiện hủy nếu yêu cầu chưa được xử lý thành giao dịch.
            </p>
            <p>
              Đối với yêu cầu đã được xác nhận, khả năng hủy phụ thuộc vào tình trạng vé, thời điểm khách hàng yêu cầu và các quy định áp dụng. Còn Số sẽ thông báo kết quả xử lý cho khách hàng.
            </p>
            <p>
              Việc hủy yêu cầu không làm mất các quyền hợp pháp của khách hàng theo quy định pháp luật.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">6.5. Các trường hợp được xem xét hoàn tiền</h4>
            <p>Còn Số xem xét hoàn trả tiền trong những trường hợp sau:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Khách hàng đã thanh toán nhưng giao dịch không thể thực hiện do vé không còn khả năng cung cấp.</li>
              <li>Giao dịch bị hủy hợp lệ và khách hàng đã thanh toán tiền vé.</li>
              <li>Khách hàng thanh toán thừa hoặc thanh toán trùng.</li>
              <li>Còn Số xác nhận có sai lệch trong quá trình tiếp nhận hoặc xử lý thanh toán.</li>
              <li>Có căn cứ hoàn tiền theo thỏa thuận hợp lệ hoặc quy định pháp luật.</li>
            </ul>
            <p className="pt-1 italic text-slate-500">
              * Đối với yêu cầu chưa thanh toán, nếu được hủy hợp lệ thì không phát sinh khoản tiền mua vé cần hoàn trả.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">6.6. Phương thức hoàn tiền</h4>
            <p>
              Việc hoàn tiền được thực hiện theo phương thức phù hợp với giao dịch và thông tin khách hàng cung cấp.
            </p>
            <ul className="space-y-1 pl-1">
              <li>• <strong>Đối với giao dịch chuyển khoản:</strong> Còn Số kiểm tra giao dịch và thực hiện hoàn tiền qua tài khoản ngân hàng phù hợp.</li>
              <li>• <strong>Đối với giao dịch tiền mặt:</strong> Còn Số thực hiện hoàn trả trực tiếp hoặc theo phương thức khác được các bên thống nhất.</li>
            </ul>
            <p className="pt-1">
              Khách hàng cần cung cấp thông tin cần thiết để xác minh khoản tiền đã thanh toán.
            </p>
            <p className="text-amber-700 font-medium">
              * Còn Số không yêu cầu khách hàng cung cấp mật khẩu ngân hàng hoặc mã OTP để xử lý hoàn tiền.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">6.7. Thời gian hoàn tiền</h4>
            <p>
              Còn Số dự kiến xử lý yêu cầu hoàn tiền trong vòng <strong>05 ngày làm việc</strong> kể từ khi xác nhận đủ điều kiện hoàn tiền và nhận đủ thông tin cần thiết.
            </p>
            <p>
              Thời gian tiền thực tế về tài khoản có thể phụ thuộc vào ngân hàng hoặc đơn vị trung gian thanh toán. Nếu việc xử lý kéo dài hơn dự kiến, Còn Số sẽ thông báo cho khách hàng khi phù hợp.
            </p>
            <p>
              Thời gian nêu trên là mục tiêu xử lý thông thường và không thay thế thời hạn bắt buộc theo quy định pháp luật, nếu có.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-sky-800">6.8. Các trường hợp cần xác minh thêm</h4>
            <p>
              Đối với giao dịch đã hoàn tất hoặc vé đã được giao đúng theo thông tin xác nhận, yêu cầu đổi vé, hủy hoặc hoàn tiền sẽ được xem xét dựa trên tình trạng thực tế, căn cứ của yêu cầu và quy định pháp luật.
            </p>
            <p>
              Còn Số không áp dụng việc từ chối hoàn tiền một cách tuyệt đối trong trường hợp khách hàng có quyền được hoàn tiền theo quy định pháp luật.
            </p>
          </div>

          <div className="space-y-1 pt-1 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
            <h4 className="font-bold text-sky-800">6.9. Liên hệ hỗ trợ</h4>
            <p>Khách hàng cần hỗ trợ về nhận vé, đổi vé, hủy yêu cầu hoặc hoàn tiền vui lòng liên hệ:</p>
            <ul className="space-y-0.5">
              <li>• Website: <a href="https://con-so.io.vn" target="_blank" rel="noreferrer" className="text-sky-700 font-semibold underline">https://con-so.io.vn</a></li>
              <li>• Điện thoại: <a href="tel:0899258808" className="text-sky-700 font-semibold hover:underline">0899 25 8808</a></li>
              <li>• Email: <a href="mailto:vuhoang712@gmail.com" className="text-sky-700 font-semibold hover:underline">vuhoang712@gmail.com</a></li>
              <li>• Địa chỉ: 72 Ngô Sĩ Liên, P. Phan Thiết, Lâm Đồng.</li>
            </ul>
            <p className="pt-1 text-slate-500 italic">
              Còn Số sẽ tiếp nhận và xử lý yêu cầu trên cơ sở thông tin liên quan đến giao dịch và quy định pháp luật.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-500 font-medium">
          {openItems.length > 0 ? `Đang mở ${openItems.length}/6 mục` : "Nhấn để xem từng mục"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 px-2 py-0.5 rounded-md hover:bg-sky-100/60 transition-colors"
          >
            Mở tất cả
          </button>
          <span className="text-slate-300 text-xs">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            Thu gọn
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {subItems.map((item) => {
          const isOpen = openItems.includes(item.id);
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-white border-sky-200 shadow-sm ring-1 ring-sky-100"
                  : "bg-white/70 hover:bg-white border-sky-100/80 shadow-2xs"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer select-none"
              >
                <div className="flex items-start gap-2.5 pr-2">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isOpen ? "bg-sky-600 text-white" : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-sky-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cập nhật: {item.updatedAt}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-slate-400">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-sky-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-sky-50 animate-in fade-in duration-200">
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
