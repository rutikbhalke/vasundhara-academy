import { createAuthHandler } from '@/lib/authOptions';

const handler = createAuthHandler();
export { handler as GET, handler as POST };
