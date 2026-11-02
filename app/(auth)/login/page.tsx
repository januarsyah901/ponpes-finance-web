'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, User, Building2, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('NIS / Username atau Password salah. Silakan periksa kembali.');
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Terjadi kesalahan jaringan saat mencoba masuk. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F5132] text-white shadow-md">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading">
          Ponpes Finance
        </h1>
        <p className="text-sm text-[#64748B]">
          Sistem Manajemen Keuangan Pondok Pesantren
        </p>
      </div>

      <Card className="border-[#E2E8F0] shadow-sm bg-white">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-semibold text-[#0F172A]">Masuk ke Akun</CardTitle>
          <CardDescription className="text-xs text-[#64748B]">
            Santri gunakan NIS. Bendahara gunakan username yang terdaftar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-[#334155]">
                NIS / Username
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="Contoh: 2024001 atau admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-[#334155]">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-medium py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Quick Demo Helper */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 text-xs text-[#64748B] space-y-1.5">
        <div className="font-semibold text-[#0F172A]">Akun Uji Coba (Password: password123)</div>
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <button
            type="button"
            onClick={() => { setUsername('admin'); setPassword('password123'); }}
            className="text-left p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0F5132] transition-colors"
          >
            <span className="font-medium text-[#0F5132]">Super Admin</span>: admin
          </button>
          <button
            type="button"
            onClick={() => { setUsername('bendahara_putra'); setPassword('password123'); }}
            className="text-left p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0F5132] transition-colors"
          >
            <span className="font-medium text-[#0F5132]">Bend. Putra</span>: bendahara_putra
          </button>
          <button
            type="button"
            onClick={() => { setUsername('2024001'); setPassword('password123'); }}
            className="text-left p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0F5132] transition-colors"
          >
            <span className="font-medium text-[#0F5132]">Santri</span>: 2024001
          </button>
          <button
            type="button"
            onClick={() => { setUsername('2024002'); setPassword('password123'); }}
            className="text-left p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0F5132] transition-colors"
          >
            <span className="font-medium text-[#0F5132]">Santri (Cicil)</span>: 2024002
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 sm:p-6">
      <Suspense fallback={<div className="text-center text-sm text-[#64748B]">Memuat halaman login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
