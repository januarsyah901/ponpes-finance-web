import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import { db } from './lib/db';
import { pengguna, penggunaKomplek, santri } from '@ponpes-finance/db/schema';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  username: z.string().min(1, 'NIS / Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'NIS / Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;

        // 1. Fetch user by username / NIS
        const [userRecord] = await db
          .select()
          .from(pengguna)
          .where(eq(pengguna.username, username.trim()))
          .limit(1);

        if (!userRecord || !userRecord.isActive) {
          return null;
        }

        // 2. Verify password with bcrypt
        const isValidPassword = await bcrypt.compare(password, userRecord.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        // 3. Resolve complex IDs based on user role
        let complexIds: string[] = [];
        let santriId: string | null = userRecord.santriId || null;

        if (userRecord.role === 'super_admin') {
          complexIds = ['all'];
        } else if (userRecord.role === 'bendahara_komplek') {
          // Fetch assigned complexes (Putra bendahara gets 3 complexes, Putri gets 1)
          const assigned = await db
            .select({ komplekId: penggunaKomplek.komplekId })
            .from(penggunaKomplek)
            .where(eq(penggunaKomplek.userId, userRecord.id));
          complexIds = assigned.map((a) => a.komplekId);
        } else if (userRecord.role === 'santri') {
          if (santriId) {
            const [s] = await db
              .select({ komplekId: santri.komplekId })
              .from(santri)
              .where(eq(santri.id, santriId))
              .limit(1);
            if (s?.komplekId) {
              complexIds = [s.komplekId];
            }
          }
        }

        return {
          id: userRecord.id,
          username: userRecord.username,
          nama: userRecord.nama,
          role: userRecord.role as any,
          complexIds,
          isFirstLogin: userRecord.isFirstLogin,
          santriId,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET || 'ponpes-finance-development-secret-key-32chars!!',
});
