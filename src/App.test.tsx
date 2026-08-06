import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('redirects unauthenticated visitors to the login screen', () => {
  render(<App />);
  expect(screen.getByText('KABUNSEKI-WEB')).toBeInTheDocument();
  expect(screen.getByText('株式分析システム')).toBeInTheDocument();
  expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ログイン' })).toBeDisabled();
});
