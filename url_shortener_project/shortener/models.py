from django.db import models

class URL(models.Model):
    original_url = models.URLField(max_length=2000) # Increase max_length for original_url
    short_code = models.CharField(max_length=15, unique=True, db_index=True) # Update max_length and add db_index
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.short_code} -> {self.original_url}"
