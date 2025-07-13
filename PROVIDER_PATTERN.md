# Provider Pattern Documentation for AI Agents

## 🚨 CRITICAL: Provider Pattern Implementation

This document explains the provider pattern used in this React application to prevent "must be used within Provider" errors.

## Problem Statement

React components that use hooks like `useBookmarks()` or `useFlags()` must be wrapped in their respective providers. Without proper wrapping, React throws errors like:

```
Error: useBookmarks must be used within a BookmarksProvider
Error: useFlags must be used within a FlagProvider
```

## Solution: PageWrapper Component

### Location
`src/components/Layout/PageWrapper.tsx`

### Purpose
Universal wrapper that includes ALL necessary providers for any page or component.

### Usage Pattern (MANDATORY)

```typescript
import { PageWrapper } from '../Layout/PageWrapper';

// ✅ ALWAYS DO THIS for new pages/components
<PageWrapper>
  <YourNewPage />
</PageWrapper>

// ❌ NEVER DO THIS (will cause provider errors)
<YourNewPage />
```

## Provider Hierarchy

```
PageWrapper
├── BookmarksProvider (enables useBookmarks hook)
└── FlagProvider (enables useFlags hook)
    └── Your Components (can use any hooks safely)
```

## When to Use PageWrapper

### ✅ REQUIRED for:
- New pages/routes
- Modal components that use hooks
- Standalone components that need context
- Admin panels
- Any component that uses `useBookmarks()` or `useFlags()`
- Components that might use hooks in the future

### ❌ NOT needed for:
- Simple UI components without hooks
- Components that don't use context

## Common Error Scenarios

### Scenario 1: New Page Creation
```typescript
// ❌ WRONG - Will cause provider error
function NewPage() {
  const { bookmarkedIds } = useBookmarks(); // ERROR!
  return <div>...</div>;
}

// ✅ CORRECT - Wrapped in PageWrapper
function NewPage() {
  return (
    <PageWrapper>
      <div>...</div>
    </PageWrapper>
  );
}
```

### Scenario 2: Modal Components
```typescript
// ❌ WRONG - Modal uses hooks without provider
<Modal>
  <QuestionCard question={question} /> {/* ERROR! */}
</Modal>

// ✅ CORRECT - Modal wrapped in PageWrapper
<PageWrapper>
  <Modal>
    <QuestionCard question={question} />
  </Modal>
</PageWrapper>
```

## Implementation in App.tsx

The main application uses PageWrapper for all major sections:

```typescript
// Admin page
<PageWrapper>
  <AdminAccess />
</PageWrapper>

// Main app
<PageWrapper>
  <div className="min-h-screen">
    <Header />
    <main>
      <QuestionBankMode />
    </main>
  </div>
</PageWrapper>
```

## Adding New Providers

When adding new providers to the application:

1. **Update PageWrapper.tsx**:
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

2. **Update this documentation** with the new provider details

3. **Test with new pages** to ensure the provider works correctly

## Error Prevention Checklist

Before creating any new page or component, check:

- [ ] Does the component use any React hooks?
- [ ] Does the component use `useBookmarks()` or `useFlags()`?
- [ ] Is the component wrapped in `<PageWrapper>`?
- [ ] Are there any modal or popup components that need providers?

## Quick Fix for Existing Errors

If you encounter a provider error:

1. **Import PageWrapper**:
```typescript
import { PageWrapper } from '../Layout/PageWrapper';
```

2. **Wrap the problematic component**:
```typescript
<PageWrapper>
  <ComponentWithError />
</PageWrapper>
```

3. **Test the functionality**

## AI Agent Instructions

When working with this codebase:

1. **ALWAYS** use `PageWrapper` for new pages/components
2. **NEVER** create components that use hooks without proper provider wrapping
3. **CHECK** existing pages to see how they use `PageWrapper`
4. **UPDATE** `PageWrapper.tsx` when adding new providers
5. **DOCUMENT** any new provider patterns

## File Locations

- **PageWrapper Component**: `src/components/Layout/PageWrapper.tsx`
- **Provider Documentation**: `src/components/Layout/README.md`
- **Main App Usage**: `src/App.tsx`

## Testing Provider Setup

To verify provider setup is correct:

1. Create a test component that uses hooks
2. Wrap it in `PageWrapper`
3. Verify no provider errors in console
4. Test functionality works as expected

This pattern ensures consistent, error-free development across the entire application. 