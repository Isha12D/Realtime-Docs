// Format date to readable format
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get initials from name
export const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

// Truncate text to specified length
export const truncateText = (text, length = 50) => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

// Count words in text
export const countWords = (text) => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Generate random color
export const getRandomColor = () => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get color based on index (for consistent colors)
export const getColorByIndex = (index) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  return colors[index % colors.length];
};

export default {
  formatDate,
  getInitials,
  truncateText,
  countWords,
  getRandomColor,
  isValidEmail,
  getColorByIndex,
};
