import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the application header', () => {
  render(<App />);
  expect(screen.getByText('KABUNSEKI-WEB')).toBeInTheDocument();
  expect(screen.getByText('日本株分析ダッシュボード')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ランキングを開く' })).toBeInTheDocument();
});
