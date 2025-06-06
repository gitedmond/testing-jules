"""
URL configuration for url_shortener_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.http import HttpResponse

def welcome_view(request):
    return HttpResponse("Welcome to the URL Shortener API!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', welcome_view),
    # API and redirect URLs from the 'shortener' app
    # These are more specific, so they should come before the general catch-all.
    # Assuming shortener.urls.py contains:
    #   path('api/shorten/', ...)
    #   path('<str:short_code>/', ...)
    # Including it at the root like this makes these paths available directly from root.
    path('', include('shortener.urls')),
]
