import string
import random
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect # Removed HttpResponseNotFound, render
from .models import URL
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import URLSerializer

def generate_short_code(length=6):
    """Generates a random alphanumeric short code of a given length."""
    characters = string.ascii_letters + string.digits
    while True:
        short_code = ''.join(random.choice(characters) for _ in range(length))
        if not URL.objects.filter(short_code=short_code).exists():
            return short_code

def redirect_to_original_url(request, short_code):
    """Redirects to the original URL based on the short code."""
    url_entry = get_object_or_404(URL, short_code=short_code)
    return HttpResponseRedirect(url_entry.original_url)


class ShortenURLView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = URLSerializer(data=request.data)
        if serializer.is_valid():
            original_url = serializer.validated_data['original_url']

            # Check if URL already exists
            try:
                existing_url = URL.objects.get(original_url=original_url)
                response_serializer = URLSerializer(existing_url)
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            except URL.DoesNotExist:
                # If not, create new
                short_code = generate_short_code()
                url_entry = URL.objects.create(original_url=original_url, short_code=short_code)
                response_serializer = URLSerializer(url_entry)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
