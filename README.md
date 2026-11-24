# DTDM – Tìm đường đi giữa hai địa điểm

Dự án cá nhân trang web tra cứu vị trí và tìm đường, sử dụng JavaScript, HTML/CSS, bản đồ Leaflet và bộ định tuyến OSRM. **Có dùng AI hỗ trợ tạo và sửa mã nguồn**; tác giả đã chạy thử trong quá trình học tập.

## Thành phần chính
- `index.html`, `css/`: giao diện.
- `js/app.js`, `js/logic.js`: logic ứng dụng.
- `js/leaflet.js`, `js/leaflet-routing-machine.js`: thư viện bản đồ bên thứ ba được kèm trong mã nguồn bản gốc.
- `tests/logic.test.js`: kiểm thử bằng Vitest.

## Chạy thử
1. Cài Node.js phiên bản tương thích với `package.json`.
2. Chạy `npm ci`, sau đó `npm test` để chạy unit tests, hoặc mở ứng dụng qua một local HTTP server để xem giao diện.
3. Dịch vụ định tuyến trực tuyến và định vị trình duyệt có thể yêu cầu Internet/quyền vị trí và có giới hạn; không cam kết dịch vụ luôn hoạt động.

Xem `BAOCAO.md` để biết mô tả bài tập. Các thư viện bên thứ ba giữ nguyên từ nguồn dự án, cần tuân theo giấy phép tương ứng.
