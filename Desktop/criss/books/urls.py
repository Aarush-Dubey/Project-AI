from django.urls import path
from .views import BookListCreateAPIView, BookRetrieveUpdateDestroyAPIView

urlpatterns = [
    path('', BookListCreateAPIView.as_view(), name='books-list-create'),
    path('<int:pk>/', BookRetrieveUpdateDestroyAPIView.as_view(), name='book-detail'),
]
