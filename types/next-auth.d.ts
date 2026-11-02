import { DefaultSession } from 'next-auth';

export type UserRole = 'super_admin' | 'bendahara_komplek' | 'santri' | 'pengasuh';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      nama: string;
      role: UserRole;
      complexIds: string[];
      isFirstLogin: boolean;
      santriId?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username: string;
    nama: string;
    role: UserRole;
    complexIds: string[];
    isFirstLogin: boolean;
    santriId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    nama: string;
    role: UserRole;
    complexIds: string[];
    isFirstLogin: boolean;
    santriId?: string | null;
  }
}
