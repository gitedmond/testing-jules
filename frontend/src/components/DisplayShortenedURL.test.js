import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DisplayShortenedURL from './DisplayShortenedURL';

describe('DisplayShortenedURL', () => {
  const testUrl = 'http://localhost/shorty';

  beforeEach(() => {
    // Ensure a fresh mock for each test
    global.navigator.clipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    // Clear any previous calls to alert or console.error spies if they are used across tests
    if (window.alert.mockRestore) window.alert.mockRestore();
    if (console.error.mockRestore) console.error.mockRestore();
  });

  test('renders nothing if shortenedUrl prop is null or empty', () => {
    const { container } = render(<DisplayShortenedURL shortenedUrl={null} />);
    expect(container.firstChild).toBeNull();

    const { container: containerEmpty } = render(<DisplayShortenedURL shortenedUrl="" />);
    expect(containerEmpty.firstChild).toBeNull();
  });

  test('renders shortened URL and copy button when shortenedUrl is provided', () => {
    render(<DisplayShortenedURL shortenedUrl={testUrl} />);

    const urlElement = screen.getByText(testUrl);
    expect(urlElement).toBeInTheDocument();
    expect(urlElement.closest('a')).toHaveAttribute('href', testUrl);

    expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeInTheDocument();
  });

  test('calls navigator.clipboard.writeText when copy button is clicked', () => {
    // Spy on window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<DisplayShortenedURL shortenedUrl={testUrl} />);
    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testUrl);

    // Check if alert was called (optional, depends on implementation detail)
    // await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Copied to clipboard!'));
    // No need to restore alertSpy if it's created within the test and not a global spy.
  });

  test('handles clipboard writeText failure', async () => {
    // Set up the specific mock for this test case
    global.navigator.clipboard.writeText = jest.fn().mockRejectedValueOnce(new Error('Copy failed'));

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<DisplayShortenedURL shortenedUrl={testUrl} />);
    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyButton);

    // Wait for promises to resolve
    await screen.findByText('Copy to Clipboard'); // Re-ensure button is there

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testUrl);
    // Check if alert was called with failure message (optional, depends on implementation detail)
    // await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Failed to copy to clipboard.'));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy text: ', expect.any(Error));

    // Spies created with jest.spyOn should be restored if they are on global objects
    // and might affect other tests, or if we want to ensure no mock leakage.
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
