export const localAdminUser = {
  id: 'local-admin',
  email: 'admin@vasundharaacademy.edu.in',
  password: 'admin123',
  name: 'Admin',
};

export function isLocalDevWithoutDatabase() {
  return process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;
}
