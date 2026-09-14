from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class Product(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="products"
    )

    CATEGORY_CHOICES = [
        ('Food', 'Food'),
        ('Medicine', 'Medicine'),
        ('Cosmetics', 'Cosmetics'),
        ('Cleaning', 'Cleaning'),
        ('Personal Care', 'Personal Care'),
        ('Other', 'Other'),
    ]

    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES
    )
    quantity = models.PositiveIntegerField(default=1)
    purchase_date = models.DateField()
    expiry_date = models.DateField()
    storage_location = models.CharField(
        max_length=200,
        blank=True
    )
    image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True
    )
    notes = models.TextField(blank=True)

    @property
    def expiry_status(self):
        today = timezone.localdate()

        days_left = (
            self.expiry_date - today
        ).days

        if days_left < 0:
            return "Expired"

        elif days_left <= 7:
            return "Expiring Soon"

        else:
            return "Safe"

    def __str__(self):
        return self.name