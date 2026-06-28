const Avatar = ({ profile, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-32 h-32 text-5xl'
  };

  const initials = profile?.full_name
    ? profile.full_name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
    : '?';

  const baseClass = `${sizes[size] || sizes.md} rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-medium flex-shrink-0 overflow-hidden ${className}`.trim();

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile?.full_name || 'Profile avatar'}
        className={`${baseClass} object-cover`}
      />
    );
  }

  return (
    <div className={baseClass}>
      {initials}
    </div>
  );
};

export default Avatar;
