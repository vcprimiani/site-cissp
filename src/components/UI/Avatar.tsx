import React from 'react';
import { getAvatarProps } from '../../utils/avatars';

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

  // Otherwise, use animal avatar
  const avatarProps = getAvatarProps(user);
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`}
      style={{ 
        backgroundColor: avatarProps.bgColor,
        color: avatarProps.color 
      }}
      title={`${user.name || 'User'}'s avatar - ${avatarProps.name}`}
    >
      <span className="select-none">
        {avatarProps.emoji}
      </span>
    </div>
  );
};