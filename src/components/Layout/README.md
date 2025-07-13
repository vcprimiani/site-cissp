# Provider Pattern Guide

## 🚨 The "Must be used within Provider" Error

This error occurs when a component tries to use a React hook but isn't wrapped in the required provider.

### Common Error:
```
Error: useBookmarks must be used within a BookmarksProvider
Error: useFlags must be used within a FlagProvider
```

## ✅ Solution: Use PageWrapper

Always wrap new pages/components with `PageWrapper` to include all necessary providers:

```typescript
import { PageWrapper } from '../Layout/PageWrapper';

// ✅ Correct - Use PageWrapper
<PageWrapper>
  <YourNewPage />
</PageWrapper>

// ❌ Wrong - Missing providers
<YourNewPage />
```

## 🏗 Provider Architecture

```
PageWrapper
├── BookmarksProvider (for bookmark functionality)
└── FlagProvider (for flag functionality)
    └── Your Components (can use useBookmarks, useFlags, etc.)
```

## 📝 When to Use PageWrapper

- ✅ **New pages/routes**
- ✅ **Modal components that use hooks**
- ✅ **Standalone components that need context**
- ✅ **Admin panels**
- ✅ **Any component that uses useBookmarks or useFlags**

## 🔧 Adding New Providers

If you add a new provider, update `PageWrapper.tsx`:

```typescript
export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return (
    <BookmarksProvider>
      <FlagProvider>
        <NewProvider>  {/* Add new provider here */}
          {children}
        </NewProvider>
      </FlagProvider>
    </BookmarksProvider>
  );
};
```

## 🎯 Best Practices

1. **Always use PageWrapper for new pages**
2. **Test components that use hooks**
3. **Add new providers to PageWrapper**
4. **Document provider dependencies**

## 🚀 Quick Fix for Existing Issues

If you get a provider error:

1. Import PageWrapper: `import { PageWrapper } from '../Layout/PageWrapper';`
2. Wrap your component: `<PageWrapper><YourComponent /></PageWrapper>`
3. Test the functionality

This pattern prevents provider errors and makes development faster! 