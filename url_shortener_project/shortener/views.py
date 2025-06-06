import string
import random
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect
from django.db import IntegrityError # Import IntegrityError
from .models import URL
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import URLSerializer

def generate_short_code(length=6): # Default length for generated codes
    """Generates a random alphanumeric short code of a given length, ensuring uniqueness."""
    characters = string.ascii_letters + string.digits
    while True:
        code = ''.join(random.choices(characters, k=length)) # Use random.choices for Python 3.6+
        if not URL.objects.filter(short_code=code).exists():
            return code

def redirect_to_original_url(request, short_code):
    """Redirects to the original URL based on the short code."""
    url_entry = get_object_or_404(URL, short_code=short_code)
    return HttpResponseRedirect(url_entry.original_url)


class ShortenURLView(APIView):
    def post(self, request, *args, **kwargs):
        # Pass context, useful if HyperlinkedModelSerializer is ever used or for other context-dependent things
        serializer = URLSerializer(data=request.data, context={'request': request})

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        original_url = validated_data['original_url'] # Serializer ensures this is a valid URL string

        # user_short_code will be an empty string if user sent `""`, or the actual code.
        # If not provided in request, .get('short_code') defaults to None.
        # Serializer `allow_blank=True` means `""` is possible in validated_data.
        # Serializer `required=False` means it can be absent from validated_data if not in request.
        user_short_code = validated_data.get('short_code') # Safely get, could be None or "" or actual code

        final_short_code = None

        # Scenario 1: User provided a custom short_code (and it's not an empty string)
        if user_short_code: # Check for truthiness (not None and not empty string)
            # Serializer's validate_short_code already checked format (isalnum, length).
            # Now, check for uniqueness conflict.
            existing_url_for_custom_code = URL.objects.filter(short_code=user_short_code).first()

            if existing_url_for_custom_code:
                if existing_url_for_custom_code.original_url == original_url:
                    # Custom code matches an existing entry for the exact same original_url. This is fine.
                    return Response(URLSerializer(existing_url_for_custom_code, context={'request': request}).data, status=status.HTTP_200_OK)
                else:
                    # Custom code is taken by a different original_url. Conflict.
                    return Response(
                        {"error": f"Custom short code '{user_short_code}' is already in use by another URL."},
                        status=status.HTTP_409_CONFLICT
                    )
            # Custom code is not taken and format is valid. Proceed to use this code.
            final_short_code = user_short_code

        # Scenario 2: User did NOT provide a custom short_code (it was None or empty string)
        else:
            # Check if the original_url already has an entry (with a generated short_code).
            existing_url_by_original = URL.objects.filter(original_url=original_url).first()
            if existing_url_by_original:
                # Original URL already exists, return its current data.
                return Response(URLSerializer(existing_url_by_original, context={'request': request}).data, status=status.HTTP_200_OK)

            # Original URL is new, and no valid custom code provided, so generate one.
            final_short_code = generate_short_code() # Uses default length 6

        # At this point, final_short_code is set (either custom and available, or newly generated).
        # And, the original_url is confirmed to be new (or user is providing a custom code for a new original_url).
        try:
            url_instance = URL.objects.create(original_url=original_url, short_code=final_short_code)
            return Response(URLSerializer(url_instance, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            # This handles potential race conditions if a short_code (custom or generated)
            # becomes non-unique between the check and the create call.
            # This is more likely for custom short codes if another request snags it.
            # For generated codes, `unique=True` on model + `generate_short_code`'s loop makes this very rare.
            # Re-query to see what the conflict was, if possible, or return generic error.
             conflicting_url = URL.objects.filter(short_code=final_short_code).first()
             if conflicting_url and conflicting_url.original_url != original_url:
                 return Response({"error": f"Short code '{final_short_code}' has just been taken. Please try a different custom code or try again for a generated one."}, status=status.HTTP_409_CONFLICT)
             elif conflicting_url and conflicting_url.original_url == original_url: # Should have been caught
                 return Response(URLSerializer(conflicting_url, context={'request': request}).data, status=status.HTTP_200_OK)
             else: # Generic fallback
                 return Response({"error": "Failed to create short URL due to a database conflict. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
