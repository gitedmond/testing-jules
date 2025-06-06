from rest_framework import serializers
from .models import URL

class URLSerializer(serializers.ModelSerializer):
    original_url = serializers.URLField(max_length=2000)
    short_code = serializers.CharField(
        max_length=15,  # Matches model's max_length
        required=False, # Not required for input
        allow_blank=True, # Allow empty string, view will treat as "not provided"
        # allow_null=True would allow null, but CharField usually not null.
        # If user sends {"short_code": ""}, validated_data will have short_code = ""
        # If user sends {"short_code": null} (and allow_null=True), validated_data will have short_code = None
        # If user omits short_code, it won't be in validated_data if required=False.
        # Let's make it simple: required=False, and view will check for truthiness.
    )

    class Meta:
        model = URL
        # id and created_at are read-only by default for ModelSerializers when not listed,
        # or can be explicitly added to read_only_fields.
        # Listing them in fields makes them part of the representation.
        fields = ['id', 'original_url', 'short_code', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_original_url(self, value):
        # Basic validation, can be expanded (e.g. check if URL is reachable)
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("URL must start with http:// or https://.")
        return value

    def validate_short_code(self, value):
        # This validation runs if short_code is provided in the input AND is not empty/None.
        # The `allow_blank=True` means an empty string `value=''` will pass this serializer field
        # but might be caught by this custom validation if we don't want empty strings.
        # If an empty string is provided for short_code, it will be in `validated_data`.
        # We want the view to treat an empty string from user as "generate for me".
        # So, if value is not empty, then validate its format.
        if value: # If value is not an empty string
            if not value.isalnum():
                raise serializers.ValidationError("Short code can only contain letters and numbers.")
            if len(value) < 3:
                raise serializers.ValidationError("Short code must be at least 3 characters long.")
            # Max length is implicitly handled by CharField's max_length on the model and serializer field.
            # The serializer field max_length=15 will also enforce this.
            # No need for: if len(value) > 15: raise serializers.ValidationError("Short code cannot exceed 15 characters.")
        return value # Return the value, even if it's an empty string (view will handle it)
