import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock global fetch
global.fetch = jest.fn();

// Mock navigator.clipboard for DisplayShortenedURL component
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('App', () => {
  beforeEach(() => {
    fetch.mockClear();
    navigator.clipboard.writeText.mockClear();
  });

  test('renders initial state correctly', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /url shortener/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter url to shorten/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shorten/i })).toBeInTheDocument();
    expect(screen.queryByText(/shortened url:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/loading.../i)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(); // For error messages
  });

  test('handles successful URL shortening', async () => {
    const originalUrl = 'https://www.example.com/very/long/url';
    const shortCode = 'abc12';
    const expectedShortenedUrl = `${window.location.origin}/${shortCode}`;

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ short_code: shortCode }),
    });

    render(<App />);

    const inputElement = screen.getByPlaceholderText(/enter url to shorten/i);
    const submitButton = screen.getByRole('button', { name: /shorten/i });

    fireEvent.change(inputElement, { target: { value: originalUrl } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading.../i)).not.toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/shorten/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original_url: originalUrl }),
    });

    const shortenedUrlDisplay = screen.getByText(expectedShortenedUrl);
    expect(shortenedUrlDisplay).toBeInTheDocument();
    expect(shortenedUrlDisplay.closest('a')).toHaveAttribute('href', expectedShortenedUrl);
    expect(screen.getByRole('button', { name: /copy to clipboard/i})).toBeInTheDocument();
  });

  test('handles existing URL being shortened (status 200)', async () => {
    const originalUrl = 'https://www.existing-example.com';
    const shortCode = 'exist123';
    const expectedShortenedUrl = `${window.location.origin}/${shortCode}`;

    fetch.mockResolvedValueOnce({
      ok: true, // DRF API returns 200 if URL already exists
      status: 200,
      json: async () => ({ short_code: shortCode, original_url: originalUrl }),
    });

    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/enter url to shorten/i), { target: { value: originalUrl } });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => expect(screen.getByText(expectedShortenedUrl)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledTimes(1);
  });


  test('handles API error during URL shortening', async () => {
    const originalUrl = 'https://www.example.com/another/url';
    const errorMessage = 'Failed to shorten URL. Please try again.';

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: errorMessage }),
    });

    render(<App />);

    const inputElement = screen.getByPlaceholderText(/enter url to shorten/i);
    const submitButton = screen.getByRole('button', { name: /shorten/i });

    fireEvent.change(inputElement, { target: { value: originalUrl } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading.../i)).not.toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    // Error message uses the 'error' state which is rendered in a <p> with red color.
    // The App.css defines .App .error-message for styling. We can check for text content.
    const errorDisplay = screen.getByText(new RegExp(errorMessage, "i"));
    expect(errorDisplay).toBeInTheDocument();
    expect(errorDisplay).toHaveStyle('color: red'); // Check if specific styling for errors is applied
  });

  test('handles network error during URL shortening', async () => {
    const originalUrl = 'https://www.example.com/network/error/url';

    fetch.mockRejectedValueOnce(new TypeError('Network failed'));

    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/enter url to shorten/i), { target: { value: originalUrl } });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/loading.../i)).not.toBeInTheDocument());

    const errorDisplay = screen.getByText(/network error or server is unreachable/i);
    expect(errorDisplay).toBeInTheDocument();
    expect(errorDisplay).toHaveStyle('color: red');
  });
});
