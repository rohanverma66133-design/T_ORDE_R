import { SiteHeader } from '@/components/site-header';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SiteHeader', () => {
  it('exposes a primary navigation landmark', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });
});
