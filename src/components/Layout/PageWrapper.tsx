import React from 'react';
import { BookmarksProvider } from '../../hooks/useBookmarks';
import { FlagProvider } from '../../hooks/useFlags';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageWrapper - Universal Provider Wrapper for All Pages
 * 
 * IMPORTANT FOR AI AGENTS: This component MUST be used for any new page or component
 * that uses React hooks like useBookmarks, useFlags, or any other context-dependent hooks.
 * 
 * PROBLEM: React throws "must be used within Provider" errors when components try to use
 * hooks without being wrapped in the appropriate provider context.
 * 
 * SOLUTION: This wrapper includes ALL necessary providers in the correct order.
 * 
 * USAGE PATTERN:
 * ```typescript
 * import { PageWrapper } from '../Layout/PageWrapper';
 * 
 * // ✅ CORRECT - Always wrap new pages/components
 * <PageWrapper>
 *   <YourNewPage />
 * </PageWrapper>
 * 
 * // ❌ WRONG - Will cause provider errors
 * <YourNewPage />
 * ```
 * 
 * PROVIDERS INCLUDED:
 * - BookmarksProvider: Required for useBookmarks() hook
 * - FlagProvider: Required for useFlags() hook
 * 
 * WHEN TO USE:
 * - ✅ New pages/routes
 * - ✅ Modal components that use hooks
 * - ✅ Standalone components that need context
 * - ✅ Admin panels
 * - ✅ Any component that uses useBookmarks or useFlags
 * 
 * ERROR PREVENTION:
 * This prevents common errors like:
 * - "useBookmarks must be used within a BookmarksProvider"
 * - "useFlags must be used within a FlagProvider"
 * 
 * MAINTENANCE:
 * When adding new providers, update this component to include them.
 * 
 * @param children - The page/component to wrap with providers
 * @param className - Optional CSS class for styling
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {/* 
        PROVIDER HIERARCHY:
        - BookmarksProvider: Enables bookmark functionality (useBookmarks hook)
        - FlagProvider: Enables flag functionality (useFlags hook)
        
        ORDER MATTERS: Providers are nested in dependency order
      */}
      <BookmarksProvider>
        <FlagProvider>
          {children}
        </FlagProvider>
      </BookmarksProvider>
    </div>
  );
}; 