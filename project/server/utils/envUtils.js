/** Strip whitespace and optional surrounding quotes from env vars (common Railway copy-paste issue). */
const cleanEnv = (value) => {
  if (value === undefined || value === null) return '';
  let v = String(value).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
};

const getAdminCredentials = () => {
  const email = cleanEnv(process.env.ADMIN_EMAIL).toLowerCase();
  const password = cleanEnv(process.env.ADMIN_PASSWORD);
  return { email, password, configured: Boolean(email && password) };
};

module.exports = { cleanEnv, getAdminCredentials };
