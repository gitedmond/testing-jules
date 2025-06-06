import React, { useState } from 'react';
import './App.css';
import ShortenForm from './components/ShortenForm';
import DisplayShortenedURL from './components/DisplayShortenedURL';

function App() {
  const [originalURL, setOriginalURL] = useState(''); // Renamed for clarity
  const [customShortCode, setCustomShortCode] = useState(''); // New state for custom short code
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Initialize error as empty string for easier conditional rendering

  const handleOriginalURLChange = (event) => {
    setOriginalURL(event.target.value);
    setError(''); // Clear error when user types
  };

  const handleCustomShortCodeChange = (event) => {
    setCustomShortCode(event.target.value);
    setError(''); // Clear error when user types
  };

  // handleShortenURL will now be called by ShortenForm's onSubmit without arguments
  // It will use originalURL and customShortCode from state.
  const handleShortenURL = async () => {
    setError(''); // Clear previous errors
    setShortenedUrl(''); // Clear previous success
    setIsLoading(true);

    // Prepare payload
    const payload = { original_url: originalURL };
    if (customShortCode.trim() !== '') {
      payload.short_code = customShortCode.trim();
    }

    try {
      const response = await fetch('/api/shorten/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Use payload with potentially custom short_code
      });

      if (response.ok) { // Handles 200 and 201
        const data = await response.json();
        const fullShortenedUrl = `${window.location.origin}/${data.short_code}`;
        setShortenedUrl(fullShortenedUrl);
        setError(''); // Clear any previous errors on success
      } else {
        // Handle business logic errors (400, 409, etc.)
        const errorData = await response.json();
        let errorMessage = `Error: ${response.status} ${response.statusText}`; // Default message
        if (errorData) {
          if (errorData.error) { // Custom error message from our backend (e.g., "short code taken")
            errorMessage = errorData.error;
          } else if (errorData.original_url && Array.isArray(errorData.original_url)) {
            errorMessage = `Original URL: ${errorData.original_url.join(' ')}`;
          } else if (errorData.short_code && Array.isArray(errorData.short_code)) {
            errorMessage = `Custom Short Code: ${errorData.short_code.join(' ')}`;
          } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
            // Try to format DRF validation errors
            const fieldErrors = Object.entries(errorData).map(([field, errors]) => {
              return `${field.replace(/_/g, ' ')}: ${Array.isArray(errors) ? errors.join(' ') : errors}`;
            });
            if (fieldErrors.length > 0) errorMessage = fieldErrors.join('; ');
          }
        }
        setError(errorMessage);
        setShortenedUrl(''); // Clear any previously successful shortened URL
        console.error('Error response from server:', errorData);
      }
    } catch (err) {
      // Handle network errors
      setError('Network error or server is unreachable. Please try again.');
      setShortenedUrl(''); // Clear any previously successful shortened URL
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
        <ShortenForm
          originalUrl={originalURL}
          onOriginalUrlChange={handleOriginalURLChange}
          customShortCode={customShortCode}
          onCustomShortCodeChange={handleCustomShortCodeChange}
          onSubmit={handleShortenURL} // This is now the actual submission trigger
          loading={isLoading}
        />
        {isLoading && <p className="loading-message">Loading...</p>}
        {/* Display error message if it exists */}
        {error && <p className="error-message">{error}</p>}
        <DisplayShortenedURL shortenedUrl={shortenedUrl} />
      </main>
    </div>
  );
}

export default App;
