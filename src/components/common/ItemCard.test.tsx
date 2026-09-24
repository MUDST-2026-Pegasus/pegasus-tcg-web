import { describe, it, expect } from 'vitest';
import { screen, render } from '@testing-library/react';
import { ItemCard, type ItemCardProps } from './ItemCard';

describe('ItemCard', () => {
  const mockItem: ItemCardProps = {
    badge: 'Sealed',
    title: 'Booster Box',
    price: '฿3,500',
    imageSrc: 'https://example.com/booster.jpg',
    imageAlt: 'Pokemon Booster Box',
  };

  it('renders item information correctly', () => {
    render(<ItemCard {...mockItem} />);

    expect(screen.getByText('Sealed')).toBeInTheDocument();
    expect(screen.getByText('Booster Box')).toBeInTheDocument();
    expect(screen.getByText('฿3,500')).toBeInTheDocument();
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/booster.jpg');
    expect(image).toHaveAttribute('alt', 'Pokemon Booster Box');
  });

  it('renders as a link when href is provided', () => {
    render(<ItemCard {...mockItem} href="/product/123" />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/product/123');
    // Ensure aria-label is present
    expect(link).toHaveAttribute('aria-label', 'Booster Box ฿3,500');
  });

  it('renders footer when provided and no price', () => {
    render(
      <ItemCard 
        badge="Single" 
        title="Pikachu" 
        footer={<span data-testid="custom-footer">Custom Footer</span>} 
      />
    );

    expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
    expect(screen.queryByText(/฿/)).not.toBeInTheDocument();
  });
});
