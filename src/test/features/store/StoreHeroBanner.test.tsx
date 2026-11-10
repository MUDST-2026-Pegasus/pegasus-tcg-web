import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StoreHero } from '@/features/store/components/StoreHero';

const profile = { username: 'cardshop', displayName: 'Card Shop', avatarUrl: null, bannerUrl: 'https://example.com/banner.webp' };

describe('StoreHero banner', () => {
  it('shows the banner and falls back to the gradient when loading fails', () => {
    const { container } = render(<StoreHero profile={profile} />);
    const image = screen.getByAltText('แบนเนอร์ร้าน Card Shop');
    expect(image).toHaveAttribute('src', profile.bannerUrl);
    fireEvent.error(image);
    expect(screen.queryByAltText('แบนเนอร์ร้าน Card Shop')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-gradient-to-r')).toBeInTheDocument();
  });

  it('keeps the gradient for a non-seller', () => {
    render(<StoreHero profile={profile} isNonSeller />);
    expect(screen.queryByAltText('แบนเนอร์ร้าน Card Shop')).not.toBeInTheDocument();
  });
});
