import React from 'react';
import { BookmarksProvider } from '../../hooks/useBookmarks';
import { FlagProvider } from '../../hooks/useFlags';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageWrapper - A reusable wrapper that includes all necessary providers
 * 
 * This prevents the "must be used within Provider" errors when creating new pages.
 * 
 * Usage:
 * <PageWrapper>
 *   <YourPageComponent />
 * </PageWrapper>
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      <BookmarksProvider>
        <FlagProvider>
          {children}
        </FlagProvider>
      </BookmarksProvider>
    </div>
  );
}; 