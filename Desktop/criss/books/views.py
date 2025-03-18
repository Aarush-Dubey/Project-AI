from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Book
from .serializers import BookSerializer

class BookListCreateAPIView(generics.ListCreateAPIView):
    queryset = Book.objects.all().order_by('id')
    serializer_class = BookSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['author', 'published_date']
    ordering_fields = ['published_date', 'author']

class BookRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    http_method_names = ['get', 'put', 'patch', 'delete']

