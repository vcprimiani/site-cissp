import React, { useEffect, useState, useCallback, useContext, createContext, ReactNode } from 'react';

interface BookmarksContextValue {
  bookmarkedIds: string[];
  loading: boolean;
  addBookmark: (questionId: string) => Promise<void>;
  removeBookmark: (questionId: string) => Promise<void>;
  toggleBookmark: (questionId: string) => Promise<void>;
  fetchBookmarks: () => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'cissp-bookmarks';

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch bookmarks from localStorage
  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setBookmarkedIds(JSON.parse(stored));
      } else {
        setBookmarkedIds([]);
      }
    } catch {
      setBookmarkedIds([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Save bookmarks to localStorage
  const saveBookmarks = (ids: string[]) => {
    setBookmarkedIds(ids);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
  };

  // Add a bookmark
  const addBookmark = async (questionId: string) => {
    if (!bookmarkedIds.includes(questionId)) {
      const updated = [...bookmarkedIds, questionId];
      saveBookmarks(updated);
    }
  };

  // Remove a bookmark
  const removeBookmark = async (questionId: string) => {
    if (bookmarkedIds.includes(questionId)) {
      const updated = bookmarkedIds.filter(id => id !== questionId);
      saveBookmarks(updated);
    }
  };

  // Toggle bookmark
  const toggleBookmark = async (questionId: string) => {
    if (bookmarkedIds.includes(questionId)) {
      await removeBookmark(questionId);
    } else {
      await addBookmark(questionId);
    }
  };

  const value: BookmarksContextValue = {
    bookmarkedIds,
    loading,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    fetchBookmarks,
  };

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
} 