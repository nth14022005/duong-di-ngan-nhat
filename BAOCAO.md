# BÁO CÁO ĐỀ TÀI 3
# TÌM ĐƯỜNG ĐI GIỮA HAI ĐỊA ĐIỂM BẰNG API CỦA LEAFLET

---

## 1. GIỚI THIỆU ĐỀ TÀI

Trong thời đại số hóa, việc tìm kiếm đường đi giữa các địa điểm là nhu cầu thiết yếu
trong đời sống hằng ngày: tìm cửa hàng gần nhất, chỉ đường đến một địa chỉ mới, hay
lập lộ trình đi qua nhiều điểm. Nhận thấy tầm quan trọng đó, nhóm chúng em lựa chọn
đề tài **"Tìm đường đi giữa hai địa điểm bằng API của Leaflet"** với mục tiêu xây dựng
một ứng dụng bản đồ web cho phép:

- Hiển thị bản đồ các điểm bán hàng (cửa hàng) có sẵn trên thành phố.
- Từ một điểm bất kỳ người dùng chọn trên bản đồ, tự động tìm và vẽ đường đi đến
  cửa hàng có khoảng cách gần nhất, kèm **so sánh khoảng cách chim bay (Haversine)**
  và **quãng đường đi thực tế (OSRM)** bằng đường nét đứt trên bản đồ.
- Chọn 2 điểm trên bản đồ để xác định đường đi ngắn nhất giữa chúng.
- Thêm một hoặc nhiều điểm trung gian sau khi đã có 2 điểm để tạo ra lộ trình mới
  kèm chỉ đường chi tiết, và **tối ưu hóa thứ tự ghé thăm (TSP – Nearest Neighbor)**
  khi có từ 3 điểm trở lên.
- Chọn **phương tiện di chuyển** (ô tô / xe đạp / đi bộ) để tính lại thời gian phù hợp.
- **Định vị GPS** vị trí hiện tại của người dùng (Geolocation API) chỉ với 1 nút bấm.
- Thêm / xóa **cửa hàng mới** trực tiếp trên giao diện.
- Hiển thị tọa độ địa lý (latitude, longitude) khi click chuột trên bản đồ.
- Nhập tọa độ điểm trực tiếp từ bàn phím, kèm gợi ý địa điểm nổi tiếng.
- Giao diện **responsive**, hiển thị tốt trên điện thoại (sidebar trượt được).

Ứng dụng được xây dựng hoàn toàn trên nền tảng web, sử dụng thư viện bản đồ mã nguồn
mở **Leaflet** kết hợp dịch vụ định tuyến **OSRM** (Open Source Routing Machine),
chạy trực tiếp trên trình duyệt mà không cần cài đặt phần mềm nào.

---

## 2. MỤC ĐÍCH LÀM ĐỀ TÀI

- **Về học tập:**
  - Nắm vững kiến thức về lập trình web (HTML, CSS, JavaScript) và lập trình
    bất đồng bộ (gọi API bằng AJAX/fetch).
  - Hiểu và vận dụng thư viện bản đồ Leaflet: tạo bản đồ, thêm marker, bắt sự
    kiện click, vẽ tuyến đường.
  - Hiểu cách tích hợp API bên thứ ba (OSRM routing API, OpenStreetMap tile) vào
    ứng dụng thực tế.
  - Rèn luyện tư duy thuật toán: tính khoảng cách địa lý hai điểm trên trái đất
    bằng công thức Haversine, tìm điểm gần nhất trong tập hợp, và bài toán
    **người giao hàng (TSP)** với thuật toán tham lam Nearest Neighbor để sắp xếp
    thứ tự ghé thăm các điểm sao cho tổng quãng đường ngắn nhất.
- **Về thực tiễn:**
  - Xây dựng một ứng dụng hữu ích phục vụ việc tìm kiếm cửa hàng gần nhất và chỉ
    đường, có thể mở rộng cho các cửa hàng, kho hàng, trạm dịch vụ... thực tế.
- **Về kỹ năng làm việc nhóm:**
  - Thực hành phân công công việc, quản lý mã nguồn và quy trình phát triển
    sản phẩm nhóm.

---

## 3. PHÂN CÔNG CÔNG VIỆC TRONG NHÓM

> *Nhóm điền tên thành viên tương ứng vào bảng dưới đây.*

| STT | Họ và tên | MSSV | Nhiệm vụ chính | Mức độ hoàn thành |
|-----|-----------|------|----------------|-------------------|
| 1 | (Thành viên 1 – Nhóm trưởng) | ... | Quản lý dự án, thiết kế tổng thể giao diện, viết báo cáo | 100% |
| 2 | (Thành viên 2) | ... | Xây dựng bản đồ Leaflet, hiển thị cửa hàng, bắt sự kiện click bản đồ và hiển thị tọa độ | 100% |
| 3 | (Thành viên 3) | ... | Tích hợp OSRM Routing API, vẽ đường đi, xử lý chế độ 2 điểm và nhiều điểm trung gian | 100% |
| 4 | (Thành viên 4) | ... | Thuật toán Haversine tìm cửa hàng gần nhất, chức năng nhập tọa độ có gợi ý, kiểm thử và viết tài liệu | 100% |

---

## 4. CÔNG CỤ SỬ DỤNG TRONG ĐỀ TÀI VÀ HƯỚNG DẪN SỬ DỤNG CƠ BẢN

### 4.1. Các công cụ sử dụng

| Công cụ | Vai trò trong đề tài |
|---------|----------------------|
| **Visual Studio Code** | Môi trường phát triển (IDE) viết mã nguồn HTML/CSS/JS |
| **HTML5 / CSS3 / JavaScript (ES6)** | Ngôn ngữ xây dựng giao diện và xử lý logic |
| **Leaflet 1.9.4** | Thư viện bản đồ mã nguồn mở: hiển thị bản đồ, marker, bắt sự kiện |
| **Leaflet Routing Machine (LRM) 3.2.12** | Phần mở rộng của Leaflet dùng để tính và vẽ tuyến đường |
| **OSRM API (router.project-osrm.org, routing.openstreetmap.de)** | Dịch vụ định tuyến mã nguồn mở, trả về đường đi ngắn nhất. Ô tô dùng `router.project-osrm.org`; xe đạp / đi bộ dùng `routing.openstreetmap.de/routed-bike`, `/routed-foot` |
| **Geolocation API** | API chuẩn của trình duyệt dùng để định vị vị trí hiện tại của người dùng (GPS) |
| **OpenStreetMap Tile** | Nguồn dữ liệu bản đồ nền (ô tile) cho Leaflet |
| **Vitest** | Chạy kiểm thử tự động cho phần logic thuần (`npm test`) |
| **VS Code Live Server** / **Python HTTP Server** (`python -m http.server`) | Web server cục bộ để chạy và kiểm thử ứng dụng |
| **Google Chrome / trình duyệt hiện đại** | Chạy và kiểm thử ứng dụng (kèm DevTools để debug) |
| **Git / GitHub** *(nếu nhóm sử dụng)* | Quản lý phiên bản mã nguồn, cộng tác nhóm |

### 4.2. Hướng dẫn sử dụng cơ bản

**a) Visual Studio Code**
- Tải và cài tại `https://code.visualstudio.com`.
- Dùng **File → Open Folder** để mở thư mục dự án.
- Cài tiện ích mở rộng hỗ trợ: *Live Server* (chạy nhanh trang web), *Prettier*
  (định dạng code).
- Sửa mã trong khung soạn thảo, lưu bằng `Ctrl + S`, xem kết quả trên trình duyệt.

**b) Leaflet — hiển thị bản đồ cơ bản**
```html
<!-- 1. Nhúng CSS và JS của Leaflet -->
<link rel="stylesheet" href="css/leaflet.css" />
<script src="js/leaflet.js"></script>

<!-- 2. Tạo thẻ div chứa bản đồ -->
<div id="map"></div>
```
```javascript
// 3. Khởi tạo bản đồ, đặt tâm tại TP.HCM, mức zoom 13
const map = L.map("map").setView([10.78, 106.70], 13);

// 4. Thêm lớp tile bản đồ từ OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// 5. Thêm marker tại một tọa độ
L.marker([10.7769, 106.7009]).addTo(map).bindPopup("Cửa hàng 1");
```

**c) Leaflet Routing Machine — vẽ đường đi**
```javascript
const control = L.Routing.control({
  waypoints: [
    L.latLng(10.7911, 106.7063),  // điểm bắt đầu
    L.latLng(10.7769, 106.7009),  // điểm kết thúc
  ],
  router: L.Routing.osrmv1({
    serviceUrl: "https://router.project-osrm.org/route/v1",
    profile: "driving",
  }),
}).addTo(map);

control.on("routesfound", (e) => {
  // e.routes[0].summary.totalDistance (m), totalDistance (giây)
  console.log("Quãng đường:", e.routes[0].summary.totalDistance, "m");
});
```

**d) OSRM API — gọi trực tiếp (khi cần)**
```
https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full
```
- Lưu ý: OSRM dùng thứ tự **kinh độ, vĩ độ** (lng trước, lat sau), khác với Leaflet.
- Kết quả trả về dạng JSON chứa `routes[0].distance`, `routes[0].duration`,
  `routes[0].geometry` (tọa độ polyline để vẽ đường).

**e) Chạy ứng dụng**

*Cách 1 — dùng Live Server (khuyến nghị, không cần cài thêm gì):*
1. Mở thư mục dự án bằng VS Code.
2. Cài extension **Live Server** (trong tab Extensions của VS Code).
3. Chuột phải vào `index.html` → **Open with Live Server** — trình duyệt sẽ mở
   `http://127.0.0.1:5500` tự động.

*Cách 2 — dùng Python (nếu máy đã cài Python):*
```
# Trong thư mục dự án, chạy web server cục bộ:
python -m http.server 8080

# Mở trình duyệt truy cập:
http://localhost:8080
```

> **Lưu ý:** không mở trực tiếp `index.html` bằng đường dẫn `file://` — trình duyệt chặn
> module JavaScript (`type="module"`) nên bản đồ sẽ không hiện. Trang sẽ hiện thanh cảnh báo
> màu cam nếu bị mở sai cách.

*Chạy kiểm thử (tùy chọn):* `npm install` rồi `npm test`.

**f) Sử dụng ứng dụng (hướng dẫn người dùng cuối)**
1. Mở trang web — bản đồ TP.HCM hiển thị kèm 6 cửa hàng (marker 🏬 xanh).
2. **Tìm cửa hàng gần nhất:** giữ chế độ "Tìm cửa hàng gần nhất", click một điểm
   trên bản đồ (hoặc nhập tọa độ) — hệ thống tìm cửa hàng gần nhất và vẽ:
   - Tuyến đường đi **thực tế** (nét liền xanh) theo OSRM;
   - Đường thẳng **chim bay** (nét đứt đỏ) theo công thức Haversine;
   - Bảng thống kê so sánh 2 khoảng cách + thời gian di chuyển.
3. **📍 Vị trí của tôi:** nhấn nút này để trình duyệt định vị GPS vị trí hiện tại,
   tự động tìm cửa hàng gần bạn nhất (cần cho phép truy cập vị trí).
4. **Phương tiện:** chọn 🚗 Ô tô / 🚲 Xe đạp / 🚶 Đi bộ — tuyến đường được lấy từ máy chủ
   định tuyến tương ứng, thời gian xe đạp / đi bộ được tính lại theo tốc độ trung bình
   (đạp xe ~15 km/h, đi bộ ~4,5 km/h).
5. **Đường đi giữa 2 điểm:** chọn chế độ "Tuyến đường giữa 2 điểm", click 2 điểm
   trên bản đồ — tuyến ngắn nhất được vẽ kèm tổng quãng đường và thời gian.
6. **Thêm điểm trung gian:** chọn chế độ "Lộ trình nhiều điểm trung gian", click
   thêm điểm thứ 3, 4... — lộ trình mới được tính lại tự động; muốn bỏ một điểm,
   nhấn ✕ cạnh điểm đó trong danh sách.
7. **⚡ Tối ưu (TSP):** khi có từ 3 điểm trở lên, nhấn nút này để thuật toán
   Nearest Neighbor sắp xếp lại thứ tự ghé thăm sao cho tổng quãng đường ngắn nhất.
8. **🏬 Tạo cửa hàng mới:** click bản đồ (hoặc nhập tọa độ) rồi nhấn nút này,
   đặt tên cửa hàng — cửa hàng xuất hiện trên bản đồ và danh sách, có thể xóa
   bằng ✕ trong danh sách. Cửa hàng tự thêm được lưu trong trình duyệt (`localStorage`)
   nên vẫn còn sau khi tải lại trang.
9. **Xem tọa độ:** mỗi lần click bản đồ, tọa độ (lat, lng) hiển thị trong ô nhập.
10. Nhấn **"🗑️ Xóa toàn bộ"** để bắt đầu lại.
11. **Trên điện thoại:** nút "☰ Điều khiển" ở góc mở/đóng bảng điều khiển.

### 4.3. Cấu trúc mã nguồn

```
dtdm/
├── index.html                     # Giao diện chính (sidebar + bản đồ)
├── BAOCAO.md                      # Tài liệu báo cáo đề tài
├── package.json                   # Script: npm test, npm run build:docs
├── css/
│   ├── leaflet.css                # CSS của Leaflet
│   ├── leaflet-routing-machine.css# CSS của Leaflet Routing Machine
│   └── style.css                  # Giao diện tùy chỉnh (dark theme, responsive)
├── js/
│   ├── leaflet.js                 # Thư viện Leaflet 1.9.4
│   ├── leaflet-routing-machine.js # Thư viện LRM
│   ├── logic.js                   # Dữ liệu + thuật toán thuần (Haversine, TSP, tách chặng, escape HTML...)
│   └── app.js                     # Logic giao diện: Leaflet, DOM, sự kiện
├── tests/
│   └── logic.test.js              # Kiểm thử Vitest cho logic.js
└── scripts/
    └── build-docs.mjs             # Sinh phụ lục dữ liệu của BAOCAO.md từ logic.js
```

Các module trong `logic.js`: dữ liệu cửa hàng & địa danh, Haversine, tìm cửa hàng gần nhất,
TSP (Nearest Neighbor), ước tính thời gian theo phương tiện, phân tích tọa độ, cấu hình
máy chủ định tuyến theo phương tiện, escape HTML, lưu/khôi phục cửa hàng, tách các chặng.

Các module chính trong `app.js` (đánh số theo chú thích trong mã):
2. State ứng dụng | 3. Khởi tạo bản đồ + LayerGroup | 6. Quản lý cửa hàng (có lưu `localStorage`)
7. Vẽ đường đi OSRM + đường chim bay | 8. Hiển thị thống kê chỉ đường | 9. Xử lý thêm điểm theo
từng chế độ | 10. Render danh sách điểm | 11. Nhập tọa độ + gợi ý địa danh | 12. Định vị GPS
13. Nút tối ưu TSP | 14. Đổi chế độ & phương tiện | 15. Toggle sidebar mobile | 16. Khởi chạy

---

## 5. HẠN CHẾ VÀ LƯU Ý KỸ THUẬT

- **Máy chủ định tuyến demo:** OSRM demo của FOSSGIS không đảm bảo thời gian hoạt động và giới hạn
  khoảng 1 yêu cầu/giây, chỉ nên dùng cho học tập, không dùng thương mại. Khi máy chủ lỗi hoặc mất
  mạng, ứng dụng hiển thị thông báo "Không tìm thấy đường đi".
- **TSP:** thuật toán Nearest Neighbor là heuristic tham lam, tính theo khoảng cách chim bay
  (Haversine) chứ không theo quãng đường thực tế, nên kết quả gần tối ưu chứ không tối ưu tuyệt đối.
- **Thời gian xe đạp / đi bộ:** được ước tính từ quãng đường và tốc độ trung bình cố định, không
  tính độ dốc hay giao thông.
- **An toàn dữ liệu nhập:** tên cửa hàng và nhãn điểm do người dùng nhập được escape trước khi đưa
  vào HTML (hàm `escapeHtml`) để tránh chèn mã độc (XSS).
- **Lưu trữ:** cửa hàng tự thêm chỉ lưu trong trình duyệt của từng người dùng (`localStorage`),
  không có cơ sở dữ liệu máy chủ.

---

## Phụ lục: Dữ liệu ứng dụng (sinh tự động)

<!-- AUTO-GEN:DATA BEGIN (dữ liệu sinh từ js/logic.js, không sửa tay) -->

**Số lượng cửa hàng mặc định:** 6
**Số lượng địa danh gợi ý:** 10
**Tọa độ trung tâm bản đồ mặc định:** 10.78, 106.7 (zoom 13)

### Danh sách cửa hàng mặc định

| STT | Tên cửa hàng | Vĩ độ (lat) | Kinh độ (lng) |
|-----|--------------|-------------|---------------|
| 1 | Cửa hàng Bách Hóa Xanh - Lê Lợi | 10.7769 | 106.7009 |
| 2 | Cửa hàng WinMart - Nguyễn Huệ | 10.7753 | 106.7038 |
| 3 | Cửa hàng Co.opMart - Cống Quỳnh | 10.7725 | 106.696 |
| 4 | Cửa hàng CircleK - Nam Kỳ Khởi Nghĩa | 10.7801 | 106.6945 |
| 5 | Cửa hàng Mega Market - An Phú | 10.8015 | 106.7305 |
| 6 | Cửa hàng GS25 - Hai Bà Trưng | 10.7863 | 106.6981 |

### Gợi ý địa danh nổi tiếng

- Chợ Bến Thành, TP.HCM — (10.772, 106.698)
- Dinh Độc Lập, TP.HCM — (10.7768, 106.6957)
- Phố Đi Bộ Nguyễn Huệ — (10.7745, 106.7032)
- Nhà thờ Đức Bà Sài Gòn — (10.7798, 106.699)
- Cầu Sài Gòn / Landmark 81 — (10.7951, 106.722)
- Sân bay Tân Sơn Nhất — (10.802, 106.656)
- Đại học Bách Khoa TP.HCM — (10.7911, 106.7063)
- Khu du lịch Suối Tiên — (10.8659, 106.8027)
- Hồ Hoàn Kiếm, Hà Nội — (21.0287, 105.8524)
- Cầu Rồng, Đà Nẵng — (16.0611, 108.2208)

<!-- AUTO-GEN:DATA END -->
