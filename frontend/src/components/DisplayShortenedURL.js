import React from 'react';
import './DisplayShortenedURL.css';

function DisplayShortenedURL({ shortenedUrl }) {
  if (!shortenedUrl) {
    return null;
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shortenedUrl)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard.');
      });
  };

  return (
    <div className="display-shortened-url">
      <p>Shortened URL: <a href={shortenedUrl} target="_blank" rel="noopener noreferrer">{shortenedUrl}</a></p>
      <button onClick={handleCopyToClipboard}>Copy to Clipboard</button>
    </div>
  );
}

export default DisplayShortenedURL;
