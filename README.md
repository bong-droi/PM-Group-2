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
