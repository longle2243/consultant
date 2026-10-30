# Công cụ tư vấn website F&B

Website tĩnh dùng như bộ slide bán hàng tương tác khi tư vấn khách F&B. HTML + CSS + JavaScript thuần, không backend, không đăng nhập, không API.

## Cấu trúc

| Tệp | Vai trò |
|---|---|
| `index.html` | Khung trang |
| `styles.css` | Giao diện (nền sáng, xanh navy/xanh dương) và kiểu in |
| `app.js` | Toàn bộ logic, gồm cả dữ liệu demo mặc định |

Dữ liệu demo nằm trong `app.js` (hàm `defaultConfig`), không dùng `default-data.json`. Nhờ vậy mở thẳng `index.html` bằng đúp chuột vẫn chạy, vì trình duyệt chặn `fetch` tệp JSON khi mở kiểu `file://`.

## Bản trình bày báo giá

`fnb_quote_presentation-3.html` là bản trình bày báo giá độc lập, được chia riêng thành HTML, CSS, JavaScript và dữ liệu JSON. Bản này tải dữ liệu từ `fnb_quote_presentation-3.json`, vì vậy cần mở qua local web server thay vì mở trực tiếp bằng `file://`. Chạy `python3 -m http.server` trong thư mục dự án rồi truy cập `http://localhost:8000/fnb_quote_presentation-3.html` (GitHub Pages vẫn phục vụ bình thường).

Trong bản báo giá, bấm bánh răng để chọn nhóm nội dung, chỉnh sửa rồi bấm **Lưu chỉnh sửa**. Thay đổi được lưu trong `localStorage` của trình duyệt hiện tại. Bấm **Xuất JSON** để tải toàn bộ dữ liệu thành `fnb_quote_presentation-3.json`; sau đó tự upload file này lên GitHub để cập nhật dữ liệu trên Pages. Không có upload tự động hoặc cần token. Nút **Hủy** bỏ thay đổi chưa lưu; trạng thái trong hộp chỉnh sửa cho biết khi nào cần xuất JSON.

## Cách dùng

Chạy thử: mở `index.html` bằng Chrome/Edge. Hoặc chạy `python3 -m http.server` trong thư mục rồi vào http://localhost:8000.

Luồng 6 bước (phím ← → hoặc nút Tiếp theo / Quay lại):

1. **Nhu cầu**: chọn nhanh mô hình, hiện trạng, mục tiêu, vấn đề. Không bắt buộc điền hết.
2. **Phân tích**: các nút mở website/Fanpage ở tab mới (không iframe). Sửa tên nút và URL cho từng khách. URL trống thì nút ẩn. Quay lại bằng `Ctrl+W` hoặc bấm tab tư vấn.
3. **Giải pháp**: ba nhóm: công việc trong gói website, dịch vụ bổ trợ (giá riêng, chỉ tính vào tổng khi bật “Tính vào tổng”), chi phí bên thứ ba. Bật/tắt, thêm, sửa, xóa, sắp xếp từng việc.
4. **Báo giá**: 3 gói Phổ thông 8 triệu, Ưa thích 10 triệu, VIP 12 triệu (dữ liệu demo, sửa được hết). Bấm “Chọn gói”.
5. **Triển khai**: tỷ lệ thanh toán mặc định 50/30/20 tự tính ra tiền theo gói. Tổng tỷ lệ khác 100% sẽ có cảnh báo. Quy trình các giai đoạn sửa được.
6. **Tổng kết**: Quay lại chỉnh sửa, Đổi gói, Lưu phương án, Xuất JSON, In / Lưu PDF (chức năng in của trình duyệt, chọn “Lưu thành PDF”).

Bánh răng ở góc trên: sửa thương hiệu, gói, công việc, quy trình, tỷ lệ thanh toán, điều khoản, và quản lý dữ liệu.

## Dữ liệu

- **Mẫu chung** (cấu hình): thương hiệu và bộ danh mục mặc định cho phương án mới.
- **Phương án của từng khách**: mỗi phương án có **bản sao danh mục riêng**, nên sửa giá hay bật/tắt việc của khách A không ảnh hưởng khách B. Bấm nút tên phương án ở góc trên để tạo mới, mở, đổi tên, nhân bản, xóa (có xác nhận).
- Trong Cài đặt, mỗi tab có công tắc chọn sửa “Mẫu chung” hay “Phương án đang mở”.
- Lưu bằng **localStorage** (tự lưu khi chỉnh sửa). Dữ liệu chỉ nằm trên trình duyệt và thiết bị này, **không đồng bộ cloud**. Xóa dữ liệu duyệt web hoặc đổi máy sẽ mất, nên xuất JSON định kỳ.
- Mở công cụ ở hai tab cùng lúc có thể ghi đè nhau. Hãy dùng một tab.
- Xuất/nhập JSON: nhập có kiểm tra cấu trúc, **thêm** phương án mới và không ghi đè phương án đang có. Tệp sai định dạng bị từ chối.
- Khôi phục demo luôn có bước xác nhận.

## Triển khai lên GitHub Pages

1. Tạo repository mới trên GitHub (ví dụ `tu-van-website`).
2. Tải các tệp của website lên nhánh `main` (nút **Add file → Upload files**), rồi **Commit**. Nếu dùng bản báo giá độc lập, tải thêm `fnb_quote_presentation-3.html`, `fnb_quote_presentation-3.css`, `fnb_quote_presentation-3.js` và `fnb_quote_presentation-3.json`.
3. Vào **Settings → Pages**. Ở **Build and deployment**, chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)`, bấm **Save**.
4. Đợi 1–2 phút, truy cập `https://<tên-github>.github.io/<tên-repo>/`.

Lưu ý: repo công khai thì ai biết link cũng mở được công cụ, nhưng dữ liệu khách chỉ nằm trên trình duyệt của bạn, không được đưa lên repo. Trang có `noindex` để hạn chế bị tìm thấy trên Google. Font Be Vietnam Pro lấy từ Google Fonts, nếu offline sẽ dùng font hệ thống.

## Checklist kiểm thử nhanh

- [ ] Đi qua 6 màn hình bằng nút và phím mũi tên (phím không chạy khi đang gõ)
- [ ] Bấm link mở tab mới rồi quay lại màn tư vấn
- [ ] Bật/tắt, thêm, sửa, xóa đầu việc
- [ ] Gói Ưa thích: đợt 1 = 5.000.000 đ
- [ ] Gói VIP: 6.000.000 / 3.600.000 / 2.400.000 đ
- [ ] Đổi tỷ lệ thì số tiền tính lại, tổng khác 100% thì cảnh báo
- [ ] Dịch vụ bổ trợ không tự cộng vào giá website
- [ ] Tạo 2 phương án, sửa riêng, không đè nhau
- [ ] Xuất JSON rồi nhập lại
- [ ] Tải lại trang vẫn còn dữ liệu
- [ ] Xem trước bản in (Ctrl+P) ở màn 6 không có nút và popup
# consultant
