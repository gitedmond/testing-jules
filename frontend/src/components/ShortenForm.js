import React from 'react'; // Removed useState as state is lifted to App.js
import './ShortenForm.css';

// Props will now include values and handlers from App.js
function ShortenForm({
  originalUrl,
  onOriginalUrlChange,
  customShortCode,
  onCustomShortCodeChange,
  onSubmit,
  loading // Added loading prop to disable button during submission
}) {

  const handleSubmit = (event) => {
    event.preventDefault();
    // onSubmit will now be called by App.js's handler, which has access to both values
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="shorten-form">
      <div>
        <label htmlFor="originalUrl">Original URL:</label>
        <input
          id="originalUrl"
          type="url"
          placeholder="Enter URL to shorten"
          value={originalUrl}
          onChange={onOriginalUrlChange} // Use handler from props
          required
        />
      </div>
      <div>
        <label htmlFor="customShortCode">Custom Short Code (Optional):</label>
        <input
          id="customShortCode"
          type="text"
          placeholder="e.g., mylink"
          value={customShortCode}
          onChange={onCustomShortCodeChange} // Use handler from props
          // No 'required' attribute here, as it's optional
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Shortening...' : 'Shorten'}
      </button>
    </form>
  );
}

export default ShortenForm;
