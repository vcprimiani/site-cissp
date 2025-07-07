// Google Docs style animal avatars
export const animalAvatars = [
  // Cats
  { name: 'cat-orange', emoji: '🐱', color: '#FF6B35', bgColor: '#FFF4F0' },
  { name: 'cat-gray', emoji: '🐱', color: '#6B7280', bgColor: '#F9FAFB' },
  { name: 'cat-black', emoji: '🐱', color: '#1F2937', bgColor: '#F3F4F6' },
  
  // Dogs
  { name: 'dog-golden', emoji: '🐶', color: '#F59E0B', bgColor: '#FFFBEB' },
  { name: 'dog-brown', emoji: '🐶', color: '#92400E', bgColor: '#FEF3C7' },
  { name: 'dog-white', emoji: '🐶', color: '#374151', bgColor: '#F9FAFB' },
  
  // Bears
  { name: 'bear-brown', emoji: '🐻', color: '#92400E', bgColor: '#FEF3C7' },
  { name: 'bear-polar', emoji: '🐻‍❄️', color: '#1E40AF', bgColor: '#EFF6FF' },
  
  // Foxes
  { name: 'fox-red', emoji: '🦊', color: '#DC2626', bgColor: '#FEF2F2' },
  { name: 'fox-orange', emoji: '🦊', color: '#EA580C', bgColor: '#FFF7ED' },
  
  // Pandas
  { name: 'panda', emoji: '🐼', color: '#1F2937', bgColor: '#F3F4F6' },
  
  // Koalas
  { name: 'koala', emoji: '🐨', color: '#6B7280', bgColor: '#F9FAFB' },
  
  // Lions
  { name: 'lion', emoji: '🦁', color: '#D97706', bgColor: '#FFFBEB' },
  
  // Tigers
  { name: 'tiger', emoji: '🐯', color: '#DC2626', bgColor: '#FEF2F2' },
  
  // Rabbits
  { name: 'rabbit-white', emoji: '🐰', color: '#6B7280', bgColor: '#F9FAFB' },
  { name: 'rabbit-brown', emoji: '🐰', color: '#92400E', bgColor: '#FEF3C7' },
  
  // Monkeys
  { name: 'monkey', emoji: '🐵', color: '#92400E', bgColor: '#FEF3C7' },
  
  // Elephants
  { name: 'elephant', emoji: '🐘', color: '#6B7280', bgColor: '#F9FAFB' },
  
  // Penguins
  { name: 'penguin', emoji: '🐧', color: '#1F2937', bgColor: '#F3F4F6' },
  
  // Owls
  { name: 'owl', emoji: '🦉', color: '#92400E', bgColor: '#FEF3C7' },
  
  // Frogs
  { name: 'frog', emoji: '🐸', color: '#059669', bgColor: '#ECFDF5' },
  
  // Turtles
  { name: 'turtle', emoji: '🐢', color: '#059669', bgColor: '#ECFDF5' },
  
  // Dolphins
  { name: 'dolphin', emoji: '🐬', color: '#0284C7', bgColor: '#F0F9FF' },
  
  // Whales
  { name: 'whale', emoji: '🐋', color: '#1E40AF', bgColor: '#EFF6FF' },
  
  // Octopus
  { name: 'octopus', emoji: '🐙', color: '#7C3AED', bgColor: '#F5F3FF' },
  
  // Fish
  { name: 'fish-tropical', emoji: '🐠', color: '#0284C7', bgColor: '#F0F9FF' },
  { name: 'fish-blue', emoji: '🐟', color: '#1E40AF', bgColor: '#EFF6FF' },
  
  // Birds
  { name: 'bird-blue', emoji: '🐦', color: '#1E40AF', bgColor: '#EFF6FF' },
  { name: 'bird-red', emoji: '🐦', color: '#DC2626', bgColor: '#FEF2F2' },
  
  // Unicorn
  { name: 'unicorn', emoji: '🦄', color: '#EC4899', bgColor: '#FDF2F8' },
  
  // Dragon
  { name: 'dragon', emoji: '🐉', color: '#059669', bgColor: '#ECFDF5' }
];

// Generate a consistent avatar for a user based on their email or ID
export const generateUserAvatar = (identifier: string) => {
  // Create a simple hash from the identifier
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value to ensure positive index
  const index = Math.abs(hash) % animalAvatars.length;
  return animalAvatars[index];
};

// Returns a random avatar URL from DiceBear (or similar service)
export function getRandomAvatarUrl() {
  // Use DiceBear Avatars API for a random avatar
  // You can swap 'adventurer' for other styles (e.g., 'identicon', 'bottts', etc.)
  const seed = Math.random().toString(36).substring(2, 15);
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
}

// Get avatar component props
export const getAvatarProps = (user: { id?: string; email?: string; name?: string }) => {
  const identifier = user.id || user.email || user.name || 'default';
  const avatar = generateUserAvatar(identifier);
  
  return {
    emoji: avatar.emoji,
    color: avatar.color,
    bgColor: avatar.bgColor,
    name: avatar.name
  };
};