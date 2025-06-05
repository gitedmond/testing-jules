from django.urls import path
from . import views

app_name = 'shortener'

urlpatterns = [
    path('api/shorten/', views.ShortenURLView.as_view(), name='shorten_url'),
    path('<str:short_code>/', views.redirect_to_original_url, name='redirect'),
]
