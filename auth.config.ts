import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const user = auth?.user;
      const { pathname } = nextUrl;

      const isAuthPage = pathname.startsWith('/login');
      const isPasswordChangePage = pathname.startsWith('/ganti-password');
      const isSantriPath = pathname.startsWith('/santri');
      const isBendaharaPath = pathname.startsWith('/bendahara') || pathname.startsWith('/master');
      const isAdminPath = pathname.startsWith('/admin');

      // 1. Unauthenticated users cannot access protected paths
      if (!isLoggedIn && (isSantriPath || isBendaharaPath || isAdminPath || isPasswordChangePage)) {
        return false; // Triggers redirect to /login
      }

      // 2. Already logged-in users visiting /login are redirected to their dashboard
      if (isLoggedIn && isAuthPage) {
        if (user?.role === 'santri') {
          if (user.isFirstLogin) {
            return Response.redirect(new URL('/ganti-password', nextUrl));
          }
          return Response.redirect(new URL('/santri', nextUrl));
        }
        return Response.redirect(new URL('/bendahara', nextUrl));
      }

      // 3. Mandatory First-Login Password Change enforcement for santri
      if (isLoggedIn && user?.role === 'santri' && user.isFirstLogin) {
        if (!isPasswordChangePage) {
          return Response.redirect(new URL('/ganti-password', nextUrl));
        }
        return true;
      }

      // 4. Role Authorization
      if (isSantriPath && user?.role !== 'santri' && user?.role !== 'super_admin') {
        return Response.redirect(new URL('/unauthorized', nextUrl));
      }

      if (isBendaharaPath && user?.role !== 'bendahara_komplek' && user?.role !== 'super_admin') {
        return Response.redirect(new URL('/unauthorized', nextUrl));
      }

      if (isAdminPath && user?.role !== 'super_admin') {
        return Response.redirect(new URL('/unauthorized', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.nama = user.nama;
        token.role = user.role;
        token.complexIds = user.complexIds;
        token.isFirstLogin = user.isFirstLogin;
        token.santriId = user.santriId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.nama = token.nama as string;
        session.user.role = token.role as any;
        session.user.complexIds = (token.complexIds as string[]) || [];
        session.user.isFirstLogin = token.isFirstLogin as boolean;
        session.user.santriId = token.santriId as string | null | undefined;
      }
      return session;
    },
  },
  providers: [],
};
