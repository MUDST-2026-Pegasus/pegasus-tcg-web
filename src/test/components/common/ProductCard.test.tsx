import { describe, it, expect } from 'vitest';
import { screen, render } from '@testing-library/react';
import { ProductCard, type ProductCardData } from '@/components/common/ProductCard';

describe('ProductCard', () => {
  const mockProduct: ProductCardData = {
    id: 'p-1',
    type: 'Single Card',
    title: 'Blue-Eyes White Dragon',
    price: '฿5,000.00',
    image: 'https://example.com/blue-eyes.jpg',
    imageAlt: 'Blue-Eyes Dragon Card',
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Single Card')).toBeInTheDocument();
    expect(screen.getByText('Blue-Eyes White Dragon')).toBeInTheDocument();
    expect(screen.getByText('฿5,000.00')).toBeInTheDocument();
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/blue-eyes.jpg');
    expect(image).toHaveAttribute('alt', 'Blue-Eyes Dragon Card');
  });

  it('uses title as image alt text when imageAlt is not provided', () => {
    const productWithoutAlt = { ...mockProduct, imageAlt: undefined };
    render(<ProductCard product={productWithoutAlt} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Blue-Eyes White Dragon');
  });

  it('does not render image tag if image URL is not provided', () => {
    const productWithoutImage = { ...mockProduct, image: undefined };
    render(<ProductCard product={productWithoutImage} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
