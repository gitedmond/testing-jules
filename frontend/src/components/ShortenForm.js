import React, { useState } from 'react';
import './ShortenForm.css';

function ShortenForm({ onSubmit }) {
  const [originalUrl, setOriginalUrl] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(originalUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="shorten-form">
      <input
        type="url"
        placeholder="Enter URL to shorten"
        value={originalUrl}
        onChange={(e) => setOriginalUrl(e.target.value)}
        required
      />
      <button type="submit">Shorten</button>
    </form>
  );
}

export default ShortenForm;
