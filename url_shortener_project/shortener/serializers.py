from rest_framework import serializers
from .models import URL

class URLSerializer(serializers.ModelSerializer):
    original_url = serializers.URLField(write_only=True)
    short_code = serializers.CharField(read_only=True)

    class Meta:
        model = URL
        fields = ['original_url', 'short_code']
