const getLogoUrl = () => {
  if (process.env.APP_LOGO_URL) return process.env.APP_LOGO_URL;
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/enigma-logo.svg`;
};

module.exports = { getLogoUrl };
