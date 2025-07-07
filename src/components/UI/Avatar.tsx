import React, { useState, useEffect } from 'react';
import { getAvatarProps, animalAvatars } from '../../utils/avatars';

interface AvatarProps {
  user: {
    id?: string;
    email?: string;
    name?: string;
    avatar_url?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl'
};

export const Avatar: React.FC<AvatarProps> = ({ user, size = 'md', className = '' }) => {
  const identifier = user.id || user.email || user.name || 'default';
  const localStorageKey = `avatar-choice-${identifier}`;
  const [avatarIndex, setAvatarIndex] = useState<number>(() => {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) return parseInt(stored, 10);
    // Default to hash-based index
    const hash = Math.abs(Array.from(identifier).reduce((acc, c) => acc + c.charCodeAt(0), 0));
    return hash % animalAvatars.length;
  });

  useEffect(() => {
    localStorage.setItem(localStorageKey, avatarIndex.toString());
  }, [avatarIndex, localStorageKey]);

  // If user has a custom avatar URL, use that
  if (user.avatar_url) {
    return (
      <img 
        src={user.avatar_url} 
        alt={user.name || 'User avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  const avatar = animalAvatars[avatarIndex];

  const handleClick = () => {
    setAvatarIndex((prev) => (prev + 1) % animalAvatars.length);
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center cursor-pointer transition-shadow hover:shadow-lg ${className}`}
      style={{ 
        backgroundColor: avatar.bgColor,
        color: avatar.color 
      }}
      title={`Click to change avatar (${avatar.name})`}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label="Change avatar"
    >
      <span className="select-none">
        {avatar.emoji}
      </span>
    </div>
  );
};