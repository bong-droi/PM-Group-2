<<<<<<< HEAD
# He thong quan ly ha tang do thi

Ung dung web quan ly ha tang tren OpenStreetMap su dung Django + DRF + PostgreSQL/PostGIS + Leaflet.

## 1) Chuc nang chinh da co

- Quan ly doi tuong ha tang: them/sua/xoa (`/api/hatang/`)
- Cap nhat trang thai ha tang: (`/api/hatang/<id>/trangthai/`)
- Quan ly nhat ky bao tri (`/api/nhatky-baotri/`)
- Bao cao su co va theo doi trang thai (`/api/suco/`)
- Thong ke tong hop cho admin (`/api/thongke/`)
- Lay du lieu map dang GeoJSON (`/api/dulieubando/`)
- Xep hang ky thuat vien theo it su co -> nhieu su co (`/api/kythuatvien-xephang/`)
- Dang ky nguoi dan (`/api/dangky/`) va JWT login (`/api/auth/token/`)

## 2) Chay toan bo bang Docker (khuyen dung tren Windows)

Khong can cai GDAL tren may host. Tat ca chay trong container.

```bash
docker compose up --build
```

Mo trinh duyet: [http://127.0.0.1:8000](http://127.0.0.1:8000)

Lenh tren se tu dong:

- build image web co GDAL
- khoi dong PostGIS
- `migrate`
- `seed_data`
- chay `runserver`

## 3) Khoi tao moi truong local (tu chay tren host)

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 4) Chay PostGIS bang Docker (neu chay Django tren host)

```bash
docker compose up -d
```

## 5) Tao bang va du lieu mau

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py seed_data
```

Tai khoan mau:

- `admin / admin123`
- `operator / operator123`
- `technical1 / tech12345`
- `technical2 / tech12345`
- `citizen / citizen123`

## 6) Chay ung dung

```bash
python manage.py runserver
```

Mo trinh duyet: [http://127.0.0.1:8000](http://127.0.0.1:8000)

## 7) Luu y ve phan quyen

- Admin: toan quyen CRUD + thong ke
- Operator: theo doi su co, xac nhan va phan cong
- Technical: cap nhat xu ly/bao tri
- Citizen: xem map + gui su co + theo doi su co cua minh
=======
# 🗺️ Hệ thống quản lý hạ tầng điện – nước đô thị dựa trên bản đồ

## 1. Tổng quan về dự án

### 1.1 Vấn đề thực trạng
Hiện nay, công tác quản lý hạ tầng điện nước đang gặp một số khó khăn:
- 📉 Tình trạng dữ liệu hạ tầng thường được lưu trữ rời rạc, gây khó khăn cho việc tra cứu và cập nhật thông tin.
- 📍 Việc theo dõi vị trí hạ tầng trên thực tế chưa được trực quan hoá, chưa có khả năng hiển thị lên bản đồ.
- 🔄 Quy trình xử lý sự cố thiếu tính quy trình và đồng bộ.
- 🤝 Khó khăn trong việc phối hợp giữa các bộ phận quản lý và kỹ thuật.

### 1.2 Mục tiêu dự án
**Mục tiêu cốt lõi:** Xây dựng một hệ thống web cho phép quản lý và hiển thị các hạ tầng đô thị trên bản đồ số. 

**Các mục tiêu cụ thể bao gồm:**
- 🌍 **Trực quan hóa:** Hiển thị bản đồ cơ sở hạ tầng đô thị trên nền OpenStreetMap (như các tuyến điện, tuyến nước, máy bơm, máy biến áp, trụ điện và các thiết bị điện nước khác).
- 👨‍💼 **Quản trị viên:** Cho phép quản lý toàn bộ dữ liệu hạ tầng.
- 👁️ **Nhân viên vận hành:** Cho phép theo dõi tình trạng hoạt động của hạ tầng.
- 🛠️ **Nhân viên kỹ thuật:** Cho phép cập nhật trạng thái sửa chữa và bảo trì.
- 🙋‍♂️ **Người dân:** Cho phép xem, tra cứu thông tin và báo cáo sự cố một cách dễ dàng.

### 1.3 Công nghệ sử dụng
- **Frontend:** `HTML`, `CSS`, `JavaScript`, `Leaflet.js`
- **Backend:** `Python (Django)`, `Django REST framework`
- **Database:** `PostgreSQL`, `PostGIS`
- **Map Data:** `OpenStreetMap`

---

## 2. Tính khả thi của dự án

### 2.1 Tính khả thi về kỹ thuật
- ✔️ Dự án sử dụng các công nghệ phổ biến và có nhiều tài liệu hỗ trợ.
- ✔️ **Leaflet.js:** Là thư viện mã nguồn mở mạnh mẽ dùng để hiển thị bản đồ web.
- ✔️ **OpenStreetMap:** Cung cấp dữ liệu bản đồ chi tiết và miễn phí.
- ✔️ **Django:** Là framework backend bằng Python vô cùng mạnh mẽ, an toàn và dễ phát triển.
- ✔️ **PostgreSQL & PostGIS:** Hỗ trợ tuyệt vời cho việc lưu trữ và truy vấn dữ liệu không gian (spatial data).

### 2.2 Tính khả thi về kinh tế
- 💰 Các công cụ, ngôn ngữ và nền tảng được sử dụng trong hệ thống đều là **mã nguồn mở và miễn phí**, giúp tối ưu hóa chi phí triển khai dự án.
>>>>>>> c5cc37c23b927dbfd3ae3cb57d36a07d68394d88
