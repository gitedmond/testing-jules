from django.test import TestCase, Client
from django.urls import reverse
from .models import URL
from .views import generate_short_code
import json

class URLModelTest(TestCase):
    def test_url_model_creation(self):
        original = "https://www.google.com"
        short = "googl"
        url_entry = URL.objects.create(original_url=original, short_code=short)
        self.assertEqual(url_entry.original_url, original)
        self.assertEqual(url_entry.short_code, short)
        self.assertIsNotNone(url_entry.created_at)
        self.assertEqual(str(url_entry), f"{short} -> {original}")

class UtilsTest(TestCase):
    def test_generate_short_code_length(self):
        code = generate_short_code(length=8)
        self.assertEqual(len(code), 8)

    def test_generate_short_code_uniqueness(self):
        codes = set()
        for _ in range(100): # Generate 100 codes
            codes.add(generate_short_code())
        self.assertEqual(len(codes), 100) # All should be unique

class ShortenerViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url_entry = URL.objects.create(original_url="https://www.example.com", short_code="testcd")

    def test_redirect_to_original_url_success(self):
        response = self.client.get(reverse('shortener:redirect', args=[self.url_entry.short_code]))
        self.assertEqual(response.status_code, 302) # Should be a redirect
        self.assertEqual(response.url, self.url_entry.original_url)

    def test_redirect_to_original_url_not_found(self):
        response = self.client.get(reverse('shortener:redirect', args=['nonexistent']))
        self.assertEqual(response.status_code, 404)

    def test_shorten_url_api_create_new(self):
        new_url = "https://www.anotherexample.com"
        response = self.client.post(
            reverse('shortener:shorten_url'),
            data=json.dumps({'original_url': new_url}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201) # Created
        self.assertTrue('short_code' in response.json())
        self.assertTrue(URL.objects.filter(original_url=new_url).exists())
        # Check that the returned short_code matches the one in DB for that URL
        created_entry = URL.objects.get(original_url=new_url)
        self.assertEqual(response.json()['short_code'], created_entry.short_code)


    def test_shorten_url_api_existing_url(self):
        # Post the same URL that was set up
        response = self.client.post(
            reverse('shortener:shorten_url'),
            data=json.dumps({'original_url': self.url_entry.original_url}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200) # OK, as it exists
        self.assertEqual(response.json()['short_code'], self.url_entry.short_code)

    def test_shorten_url_api_invalid_url(self):
        response = self.client.post(
            reverse('shortener:shorten_url'),
            data=json.dumps({'original_url': 'not-a-valid-url'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400) # Bad request

    def test_shorten_url_api_missing_original_url(self):
        response = self.client.post(
            reverse('shortener:shorten_url'),
            data=json.dumps({'another_field': 'some_value'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400) # Bad request
