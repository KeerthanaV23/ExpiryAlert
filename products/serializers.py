from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    expiry_status = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'brand',
            'category',
            'quantity',
            'purchase_date',
            'expiry_date',
            'storage_location',
            'image',
            'notes',
            'expiry_status',
        ]