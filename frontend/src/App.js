import React, { useState } from 'react';
import './App.css';
import ShortenForm from './components/ShortenForm';
import DisplayShortenedURL from './components/DisplayShortenedURL';

function App() {
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleShortenURL = async (originalUrl) => {
    setIsLoading(true);
    setError(null);
    setShortenedUrl(''); // Clear previous shortened URL

    try {
      const response = await fetch('/api/shorten/', { // Assuming Django dev server is on the same host or proxied
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ original_url: originalUrl }),
      });

      if (response.ok) { // Handles 200 and 201
        const data = await response.json();
        // Construct the full shortened URL.
        // The redirect is handled by Django at the root path + short_code
        const fullShortenedUrl = `${window.location.origin}/${data.short_code}`;
        setShortenedUrl(fullShortenedUrl);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Error: ${response.status} ${response.statusText}`);
        console.error('Error response from server:', errorData);
      }
    } catch (err) {
      setError('Network error or server is unreachable. Please try again.');
      console.error('Network error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>URL Shortener</h1>
      </header>
      <main>
        <ShortenForm onSubmit={handleShortenURL} />
        {isLoading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <DisplayShortenedURL shortenedUrl={shortenedUrl} />
      </main>
    </div>
  );
}

export default App;
