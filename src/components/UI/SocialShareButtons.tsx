import React from 'react';
import { Share2, Twitter, Linkedin, Facebook, Mail, Copy, Check } from 'lucide-react';

interface SocialShareButtonsProps {
  url?: string;
  title: string;
  text: string;
  hashtags?: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'compact' | 'icon-only';
  showCopyLink?: boolean;
  copyContent?: string; // New prop for custom copy content
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url = 'https://site.cisspstudygroup.com',
  title,
  text,
  hashtags = ['CISSP', 'Cybersecurity', 'StudyGroup'],
  className = '',
  size = 'md',
  variant = 'full',
  showCopyLink = true,
  copyContent
}) => {
  const [copied, setCopied] = React.useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=${hashtags.join(',')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Use custom copy content if provided, otherwise use the URL
      const contentToCopy = copyContent || url;
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleShare = (platform: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const link = shareLinks[platform as keyof typeof shareLinks];
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (variant === 'icon-only') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={(e) => handleShare('twitter', e)}
          className={`${buttonSizeClasses[size]} bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors`}
          title="Share on Twitter"
        >
          <Twitter className={iconSize[size]} />
        </button>
        <button
          onClick={(e) => handleShare('linkedin', e)}
          className={`${buttonSizeClasses[size]} bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors`}
          title="Share on LinkedIn"
        >
          <Linkedin className={iconSize[size]} />
        </button>
        <button
          onClick={(e) => handleShare('facebook', e)}
          className={`${buttonSizeClasses[size]} bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors`}
          title="Share on Facebook"
        >
          <Facebook className={iconSize[size]} />
        </button>
        {showCopyLink && (
          <button
            onClick={handleCopyLink}
            className={`${buttonSizeClasses[size]} bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors`}
            title={copyContent ? "Copy question & answer" : "Copy link"}
          >
            {copied ? <Check className={iconSize[size]} /> : <Copy className={iconSize[size]} />}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Share2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Share:</span>
        <div className="flex space-x-1">
          <button
            onClick={(e) => handleShare('twitter', e)}
            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title="Twitter"
          >
            <Twitter className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleShare('linkedin', e)}
            className="p-1 text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleShare('facebook', e)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Facebook"
          >
            <Facebook className="w-4 h-4" />
          </button>
          {showCopyLink && (
            <button
              onClick={handleCopyLink}
              className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
              title={copyContent ? "Copy question & answer" : "Copy link"}
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Share2 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Share</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={(e) => handleShare('twitter', e)}
          className="flex items-center space-x-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Twitter className="w-5 h-5" />
          <span className="font-medium">Twitter</span>
        </button>
        
        <button
          onClick={(e) => handleShare('linkedin', e)}
          className="flex items-center space-x-3 p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Linkedin className="w-5 h-5" />
          <span className="font-medium">LinkedIn</span>
        </button>
        
        <button
          onClick={(e) => handleShare('facebook', e)}
          className="flex items-center space-x-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Facebook className="w-5 h-5" />
          <span className="font-medium">Facebook</span>
        </button>
        
        <button
          onClick={(e) => handleShare('email', e)}
          className="flex items-center space-x-3 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Mail className="w-5 h-5" />
          <span className="font-medium">Email</span>
        </button>
      </div>

      {showCopyLink && (
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          <span className="font-medium">
            {copied ? 'Copied!' : copyContent ? 'Copy Question & Answer' : 'Copy Link'}
          </span>
        </button>
      )}
    </div>
  );
};