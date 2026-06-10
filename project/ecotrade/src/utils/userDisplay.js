export const getUserDisplayName = (user) => {
  if (!user) return 'User';

  const fullName = user.fullName?.trim();
  if (fullName && fullName !== 'undefined' && !fullName.includes('undefined')) {
    return fullName;
  }

  const legacyName = [user.firstName, user.lastName].filter((v) => v && v !== 'undefined').join(' ').trim();
  if (legacyName) return legacyName;

  if (user.companyName?.trim()) return user.companyName.trim();
  if (user.email) return user.email.split('@')[0];
  return 'User';
};

export const getUserAvatarUrl = (user) =>
  user?.profileImage || user?.companyLogo || '';

export const getUserInitial = (user) => {
  const name = getUserDisplayName(user);
  return name.charAt(0).toUpperCase() || 'U';
};
