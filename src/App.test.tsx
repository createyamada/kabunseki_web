import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the application header', () => {
  render(<App />);
  expect(screen.getByText('KABUNSEKI-WEB')).toBeInTheDocument();
});
