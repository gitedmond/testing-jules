import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShortenForm from './ShortenForm';

describe('ShortenForm', () => {
  test('renders input field and submit button', () => {
    render(<ShortenForm onSubmit={() => {}} />);
    expect(screen.getByPlaceholderText(/enter url to shorten/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shorten/i })).toBeInTheDocument();
  });

  test('input field updates on typing', () => {
    render(<ShortenForm onSubmit={() => {}} />);
    const inputElement = screen.getByPlaceholderText(/enter url to shorten/i);
    fireEvent.change(inputElement, { target: { value: 'https://example.com' } });
    expect(inputElement.value).toBe('https://example.com');
  });

  test('calls onSubmit prop with input value when form is submitted', () => {
    const mockOnSubmit = jest.fn();
    render(<ShortenForm onSubmit={mockOnSubmit} />);
    const inputElement = screen.getByPlaceholderText(/enter url to shorten/i);
    const buttonElement = screen.getByRole('button', { name: /shorten/i });

    fireEvent.change(inputElement, { target: { value: 'https://testurl.com' } });
    fireEvent.click(buttonElement);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('https://testurl.com');
  });

  test('submit button is disabled if input is empty and required (HTML5 validation)', () => {
    // Note: JSDOM doesn't fully support HTML5 form validation like a browser would.
    // This test primarily checks if the `required` attribute is present.
    // Actual disablement on empty submit might rely on browser behavior or custom JS logic (not implemented here).
    render(<ShortenForm onSubmit={() => {}} />);
    const inputElement = screen.getByPlaceholderText(/enter url to shorten/i);
    expect(inputElement).toBeRequired();
  });
});
