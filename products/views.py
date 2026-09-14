from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .serializers import ProductSerializer
from .models import Product


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(
            user=self.request.user
        ).order_by('expiry_date')

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )