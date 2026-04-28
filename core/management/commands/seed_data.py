from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from assets.models import LoaiHaTang, TrangThaiHaTang


class Command(BaseCommand):
    help = "Tạo dữ liệu mẫu cho hệ thống hạ tầng đô thị."

    def handle(self, *args, **options):
        loai_mau = [
            ("Đường dây điện", True),
            ("Đường ống nước", True),
            ("Máy bơm", False),
            ("Máy biến áp", False),
            ("Trụ điện", False),
        ]
        for ten, la_duong in loai_mau:
            LoaiHaTang.objects.get_or_create(ten=ten, defaults={"la_duong_tuyen": la_duong})

        for ma, ten in TrangThaiHaTang.MaTrangThai.choices:
            TrangThaiHaTang.objects.get_or_create(ma=ma, defaults={"ten_hien_thi": ten})

        User = get_user_model()
        users = [
            ("admin", "admin123", User.VaiTro.ADMIN),
            ("operator", "operator123", User.VaiTro.OPERATOR),
            ("technical1", "tech12345", User.VaiTro.TECHNICAL),
            ("technical2", "tech12345", User.VaiTro.TECHNICAL),
            ("citizen", "citizen123", User.VaiTro.CITIZEN),
        ]
        for username, password, role in users:
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password=password, vai_tro=role)
                if role == User.VaiTro.ADMIN:
                    user.is_staff = True
                    user.is_superuser = True
                    user.save()

        self.stdout.write(self.style.SUCCESS("Đã tạo dữ liệu mẫu thành công."))
