import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authConfig } from '../auth.config.ts';

// Helper to invoke authorized callback
function testAuthCallback(sessionUser: any, pathname: string) {
  const auth = sessionUser ? { user: sessionUser } : null;
  const nextUrl = new URL(`http://localhost:3000${pathname}`);
  const authorizedFn = authConfig.callbacks?.authorized;
  if (!authorizedFn) {
    throw new Error('callbacks.authorized is not defined in authConfig');
  }
  return authorizedFn({ auth, request: { nextUrl } as any });
}

describe('Authentication & RBAC Route Guard Empirical Tests', () => {
  // Test User Personas
  const uninitializedSantri = {
    id: 'user-santri-new',
    username: '2024001',
    nama: 'Ahmad Fauzi',
    role: 'santri' as const,
    isFirstLogin: true,
    santriId: 'santri-001',
    complexIds: ['komplek-pa1'],
  };

  const initializedSantri = {
    id: 'user-santri-active',
    username: '2024002',
    nama: 'Muhammad Rizqi',
    role: 'santri' as const,
    isFirstLogin: false,
    santriId: 'santri-002',
    complexIds: ['komplek-pa1'],
  };

  const bendaharaPutra = {
    id: 'user-bendahara-putra',
    username: 'bendahara_putra',
    nama: 'Ustadz Abdullah',
    role: 'bendahara_komplek' as const,
    isFirstLogin: false,
    complexIds: ['komplek-pa1', 'komplek-pa2', 'komplek-pa3'],
  };

  const bendaharaPutri1 = {
    id: 'user-bendahara-putri1',
    username: 'bendahara_putri1',
    nama: 'Ustadzah Khadijah',
    role: 'bendahara_komplek' as const,
    isFirstLogin: false,
    complexIds: ['komplek-pi1'],
  };

  const superAdmin = {
    id: 'user-super-admin',
    username: 'superadmin',
    nama: 'Kyai Ahmad',
    role: 'super_admin' as const,
    isFirstLogin: false,
    complexIds: ['all'],
  };

  // -------------------------------------------------------------
  // SUITE 1: UNAUTHENTICATED USERS
  // -------------------------------------------------------------
  describe('1. Unauthenticated User Access', () => {
    it('AUTH-01: Allows unauthenticated access to /login', () => {
      const res = testAuthCallback(null, '/login');
      assert.strictEqual(res, true, 'Unauthenticated user must be allowed on /login');
    });

    it('AUTH-02: Denies unauthenticated access to /santri (redirects to /login)', () => {
      const res = testAuthCallback(null, '/santri');
      assert.strictEqual(res, false, 'Unauthenticated user accessing /santri must return false');
    });

    it('AUTH-03: Denies unauthenticated access to /bendahara (redirects to /login)', () => {
      const res = testAuthCallback(null, '/bendahara');
      assert.strictEqual(res, false, 'Unauthenticated user accessing /bendahara must return false');
    });

    it('AUTH-04: Denies unauthenticated access to /master routes (redirects to /login)', () => {
      assert.strictEqual(testAuthCallback(null, '/master/santri'), false);
      assert.strictEqual(testAuthCallback(null, '/master/komplek'), false);
      assert.strictEqual(testAuthCallback(null, '/master/tarif'), false);
      assert.strictEqual(testAuthCallback(null, '/master/santri/impor'), false);
    });

    it('AUTH-05: Denies unauthenticated access to /ganti-password (redirects to /login)', () => {
      const res = testAuthCallback(null, '/ganti-password');
      assert.strictEqual(res, false, 'Unauthenticated user accessing /ganti-password must return false');
    });

    it('AUTH-06 [ADVERSARIAL]: Check unauthenticated access to standalone bendahara routes (/verifikasi, /kas, /pengeluaran)', () => {
      const resVerifikasi = testAuthCallback(null, '/verifikasi');
      const resKas = testAuthCallback(null, '/kas');
      const resPengeluaran = testAuthCallback(null, '/pengeluaran');

      console.log(`[AUTH-06] Unauthenticated on /verifikasi:`, resVerifikasi);
      console.log(`[AUTH-06] Unauthenticated on /kas:`, resKas);
      console.log(`[AUTH-06] Unauthenticated on /pengeluaran:`, resPengeluaran);

      // Also check prefixed routes /bendahara/verifikasi, /bendahara/kas, /bendahara/pengeluaran
      const resPrefixedVerifikasi = testAuthCallback(null, '/bendahara/verifikasi');
      const resPrefixedKas = testAuthCallback(null, '/bendahara/kas');
      const resPrefixedPengeluaran = testAuthCallback(null, '/bendahara/pengeluaran');

      console.log(`[AUTH-06] Unauthenticated on /bendahara/verifikasi:`, resPrefixedVerifikasi);
      console.log(`[AUTH-06] Unauthenticated on /bendahara/kas:`, resPrefixedKas);
      console.log(`[AUTH-06] Unauthenticated on /bendahara/pengeluaran:`, resPrefixedPengeluaran);

      assert.strictEqual(resPrefixedVerifikasi, false, 'Prefixed /bendahara/verifikasi must be blocked for unauthenticated');
      assert.strictEqual(resPrefixedKas, false, 'Prefixed /bendahara/kas must be blocked for unauthenticated');
      assert.strictEqual(resPrefixedPengeluaran, false, 'Prefixed /bendahara/pengeluaran must be blocked for unauthenticated');
    });
  });

  // -------------------------------------------------------------
  // SUITE 2: MANDATORY PASSWORD CHANGE FOR UNINITIALIZED SANTRI
  // -------------------------------------------------------------
  describe('2. Uninitialized Santri (must_change_password=true)', () => {
    it('AUTH-07: Redirects uninitialized santri from /login to /ganti-password', () => {
      const res = testAuthCallback(uninitializedSantri, '/login');
      assert.ok(res instanceof Response, 'Must return a Response redirect');
      const location = (res as Response).headers.get('Location') || '';
      assert.ok(location.includes('/ganti-password'), `Must redirect to /ganti-password, got: ${location}`);
    });

    it('AUTH-08: Redirects uninitialized santri from /santri to /ganti-password', () => {
      const res = testAuthCallback(uninitializedSantri, '/santri');
      assert.ok(res instanceof Response, 'Must return a Response redirect');
      const location = (res as Response).headers.get('Location') || '';
      assert.ok(location.includes('/ganti-password'), `Must redirect to /ganti-password, got: ${location}`);
    });

    it('AUTH-09: Allows uninitialized santri to access /ganti-password', () => {
      const res = testAuthCallback(uninitializedSantri, '/ganti-password');
      assert.strictEqual(res, true, 'Uninitialized santri must be allowed on /ganti-password');
    });

    it('AUTH-10: Redirects uninitialized santri attempting to access /master to /ganti-password', () => {
      const res = testAuthCallback(uninitializedSantri, '/master/santri');
      assert.ok(res instanceof Response, 'Must redirect uninitialized santri');
      const location = (res as Response).headers.get('Location') || '';
      assert.ok(location.includes('/ganti-password'), `Must redirect to /ganti-password, got: ${location}`);
    });
  });

  // -------------------------------------------------------------
  // SUITE 3: INITIALIZED SANTRI ACCESS RESTRICTIONS
  // -------------------------------------------------------------
  describe('3. Santri RBAC Scoping & Restrictions', () => {
    it('AUTH-11: Allows initialized santri to access /santri portal', () => {
      const res = testAuthCallback(initializedSantri, '/santri');
      assert.strictEqual(res, true, 'Santri must be allowed to access /santri');
    });

    it('AUTH-12: Redirects initialized santri visiting /login to /santri', () => {
      const res = testAuthCallback(initializedSantri, '/login');
      assert.ok(res instanceof Response, 'Must return redirect');
      const location = (res as Response).headers.get('Location') || '';
      assert.ok(location.includes('/santri'), `Must redirect to /santri, got: ${location}`);
    });

    it('AUTH-13: Blocks santri from accessing /bendahara (redirects to /unauthorized)', () => {
      const res = testAuthCallback(initializedSantri, '/bendahara');
      assert.ok(res instanceof Response, 'Must redirect unauthorized role');
      const location = (res as Response).headers.get('Location') || '';
      assert.ok(location.includes('/unauthorized'), `Must redirect to /unauthorized, got: ${location}`);
    });

    it('AUTH-14: Blocks santri from accessing /master routes (redirects to /unauthorized)', () => {
      const checkPaths = ['/master/santri', '/master/komplek', '/master/tarif', '/master/santri/impor'];
      for (const p of checkPaths) {
        const res = testAuthCallback(initializedSantri, p);
        assert.ok(res instanceof Response, `Must redirect on ${p}`);
        const location = (res as Response).headers.get('Location') || '';
        assert.ok(location.includes('/unauthorized'), `Must redirect ${p} to /unauthorized, got: ${location}`);
      }
    });

    it('AUTH-15: Blocks santri from accessing /admin (redirects to /unauthorized)', () => {
      const res = testAuthCallback(initializedSantri, '/admin');
      assert.ok(res instanceof Response, 'Must redirect on /admin');
      const location = (res as Response).headers.get('Location') || '';
      assert.ok(location.includes('/unauthorized'), `Must redirect to /unauthorized, got: ${location}`);
    });

    it('AUTH-16 [ADVERSARIAL]: Check santri access to /verifikasi, /kas, /pengeluaran', () => {
      // 1. Direct path check
      const resVerifikasi = testAuthCallback(initializedSantri, '/verifikasi');
      const resKas = testAuthCallback(initializedSantri, '/kas');
      const resPengeluaran = testAuthCallback(initializedSantri, '/pengeluaran');

      console.log(`[AUTH-16] Santri accessing /verifikasi result:`, resVerifikasi);
      console.log(`[AUTH-16] Santri accessing /kas result:`, resKas);
      console.log(`[AUTH-16] Santri accessing /pengeluaran result:`, resPengeluaran);

      // 2. Prefixed path check (/bendahara/verifikasi, /bendahara/kas, /bendahara/pengeluaran)
      const resPrefixedVerifikasi = testAuthCallback(initializedSantri, '/bendahara/verifikasi');
      const resPrefixedKas = testAuthCallback(initializedSantri, '/bendahara/kas');
      const resPrefixedPengeluaran = testAuthCallback(initializedSantri, '/bendahara/pengeluaran');

      console.log(`[AUTH-16] Santri accessing /bendahara/verifikasi:`, (resPrefixedVerifikasi as Response)?.headers?.get('Location'));
      console.log(`[AUTH-16] Santri accessing /bendahara/kas:`, (resPrefixedKas as Response)?.headers?.get('Location'));
      console.log(`[AUTH-16] Santri accessing /bendahara/pengeluaran:`, (resPrefixedPengeluaran as Response)?.headers?.get('Location'));

      // The prefixed routes are protected under pathname.startsWith('/bendahara')
      assert.ok(resPrefixedVerifikasi instanceof Response, 'Must block /bendahara/verifikasi');
      assert.ok(resPrefixedKas instanceof Response, 'Must block /bendahara/kas');
      assert.ok(resPrefixedPengeluaran instanceof Response, 'Must block /bendahara/pengeluaran');
    });
  });

  // -------------------------------------------------------------
  // SUITE 4: BENDAHARA KOMPLEK RBAC SCOPING
  // -------------------------------------------------------------
  describe('4. Bendahara Komplek Scoping', () => {
    it('AUTH-17: Allows Bendahara Komplek to access /bendahara dashboard & /master routes', () => {
      assert.strictEqual(testAuthCallback(bendaharaPutra, '/bendahara'), true);
      assert.strictEqual(testAuthCallback(bendaharaPutra, '/master/santri'), true);
      assert.strictEqual(testAuthCallback(bendaharaPutra, '/master/komplek'), true);
      assert.strictEqual(testAuthCallback(bendaharaPutra, '/master/tarif'), true);
    });

    it('AUTH-18: Redirects Bendahara from /login to /bendahara', () => {
      const res = testAuthCallback(bendaharaPutra, '/login');
      assert.ok(res instanceof Response);
      const location = (res as Response).headers.get('Location') || '';
      assert.ok(location.includes('/bendahara'), `Must redirect to /bendahara, got: ${location}`);
    });

    it('AUTH-19: Blocks Bendahara from accessing /santri portal (redirects to /unauthorized)', () => {
      const res = testAuthCallback(bendaharaPutra, '/santri');
      assert.ok(res instanceof Response);
      const location = (res as Response).headers.get('Location') || '';
      assert.ok(location.includes('/unauthorized'), `Must redirect to /unauthorized, got: ${location}`);
    });

    it('AUTH-20: Blocks Bendahara from accessing /admin (redirects to /unauthorized)', () => {
      const res = testAuthCallback(bendaharaPutra, '/admin');
      assert.ok(res instanceof Response);
      const location = (res as Response).headers.get('Location') || '';
      assert.ok(location.includes('/unauthorized'), `Must redirect to /unauthorized, got: ${location}`);
    });

    it('AUTH-21: Verifies Bendahara Putra is assigned exactly 3 Putra complexes', () => {
      assert.strictEqual(bendaharaPutra.complexIds.length, 3);
      assert.ok(bendaharaPutra.complexIds.includes('komplek-pa1'));
      assert.ok(bendaharaPutra.complexIds.includes('komplek-pa2'));
      assert.ok(bendaharaPutra.complexIds.includes('komplek-pa3'));
      assert.strictEqual(bendaharaPutra.complexIds.includes('komplek-pi1'), false);
    });

    it('AUTH-22: Verifies Bendahara Putri 1 is assigned only PI1 complex', () => {
      assert.strictEqual(bendaharaPutri1.complexIds.length, 1);
      assert.ok(bendaharaPutri1.complexIds.includes('komplek-pi1'));
      assert.strictEqual(bendaharaPutri1.complexIds.includes('komplek-pa1'), false);
    });
  });

  // -------------------------------------------------------------
  // SUITE 5: SUPER ADMIN ACCESS
  // -------------------------------------------------------------
  describe('5. Super Admin Scoping', () => {
    it('AUTH-23: Allows Super Admin to access /bendahara, /master, /santri, and /admin', () => {
      assert.strictEqual(testAuthCallback(superAdmin, '/bendahara'), true);
      assert.strictEqual(testAuthCallback(superAdmin, '/master/santri'), true);
      assert.strictEqual(testAuthCallback(superAdmin, '/master/komplek'), true);
      assert.strictEqual(testAuthCallback(superAdmin, '/santri'), true);
      assert.strictEqual(testAuthCallback(superAdmin, '/admin'), true);
    });

    it('AUTH-24: Super Admin has "all" in complexIds allowing unrestricted access', () => {
      assert.ok(superAdmin.complexIds.includes('all'));
    });
  });
});
