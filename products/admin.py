from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'brand',
        'category',
        'expiry_date',
        'expiry_status',
        'days_left',
    )

    list_filter = (
        'category',
        'expiry_date',
    )

    search_fields = (
        'name',
        'brand',
    )

    @admin.display(description='Days Left')
    def days_left(self, obj):
        from django.utils import timezone

        today = timezone.localdate()
        return (obj.expiry_date - today).days