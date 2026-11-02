from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views_admin as admin
from . import views_public as public

urlpatterns = [
    # ---------- Publik ----------
    path("api/articles", public.articles_list),
    path("api/articles/<str:slug>", public.article_detail),
    path("api/announcements", public.announcements_list),
    path("api/institution-stats", public.institution_stats),
    path("api/staff", public.staff_list),
    path("api/rental-items", public.rental_items),
    path("api/donation-confirmations", public.donation_create),
    path("api/rental-requests", public.rental_create),
    # ---------- Sesi admin ----------
    path("api/admin/login", admin.login),
    path("api/admin/logout", admin.logout),
    path("api/admin/session", admin.session_info),
    # ---------- Statistik ----------
    path("api/admin/stats", admin.stats_collection),
    # ---------- Donasi ----------
    path("api/admin/donations", admin.donations_list),
    path("api/admin/donations/<str:id>/status", admin.donation_status),
    path("api/admin/receipts/<str:key>", admin.receipt_view),
    # ---------- Persewaan ----------
    path("api/admin/rentals", admin.rentals_list),
    path("api/admin/rentals/<str:id>/status", admin.rental_status),
    path("api/admin/rental-items", admin.rental_items_collection),
    # ---------- Berita ----------
    path("api/admin/articles", admin.articles_collection),
    path("api/admin/articles/<str:id>", admin.article_detail_collection),
    # ---------- Pengumuman ----------
    path("api/admin/announcements", admin.announcements_collection),
    path("api/admin/announcements/<str:id>", admin.announcement_detail_collection),
    # ---------- Pengasuh ----------
    path("api/admin/staff", admin.staff_collection),
    # ---------- Akun ----------
    path("api/admin/users", admin.users_collection),
    # ---------- Notifikasi ----------
    path("api/admin/notifications", admin.notifications_list),
    path("api/admin/notifications/<str:id>/read", admin.notification_read),
    path("api/admin/notifications/<str:id>/resend", admin.notification_resend),
    # ---------- Unggah media ----------
    path("api/admin/upload", admin.upload_media),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
