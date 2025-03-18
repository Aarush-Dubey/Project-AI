from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Book
        fields = ['url', 'id', 'title', 'author', 'published_date', 'isbn', 'available_copies']
        extra_kwargs = {
            'url': {'view_name': 'book-detail', 'lookup_field': 'pk'}
        }
