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
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#0075de] text-white shadow-none">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111111] font-heading">
          Ponpes Finance
        </h1>
        <p className="text-sm text-[#757575]">
          Sistem Manajemen Keuangan Pondok Pesantren
        </p>
      </div>

      <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white text-[#111111] shadow-none">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-semibold text-[#111111]">Masuk ke Akun</CardTitle>
          <CardDescription className="text-xs text-[#757575]">
            Santri gunakan NIS. Bendahara gunakan username yang terdaftar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5 rounded-[8px] bg-[#fbebe9] border-[rgba(192,56,43,0.2)] text-[#c0382b]">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-[#111111]">
                NIS / Username
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#757575]">
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
                  className="pl-9 rounded-[8px] border-[rgba(0,0,0,0.12)] bg-white text-[#111111] placeholder:text-[rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-[#0075de]/30 focus-visible:border-[#0075de] shadow-none"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-[#111111]">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#757575]">
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
                  className="pl-9 rounded-[8px] border-[rgba(0,0,0,0.12)] bg-white text-[#111111] placeholder:text-[rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-[#0075de]/30 focus-visible:border-[#0075de] shadow-none"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-[8px] bg-[#0075de] hover:bg-[#0060b8] active:bg-[#004f94] text-white font-medium py-2.5 shadow-none transition-colors cursor-pointer"
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

      {/* Quick Demo Helper - Notion Callout Block with Sky Tint */}
      <div className="rounded-[12px] border border-[rgba(0,117,222,0.2)] bg-[#e6f3fe] p-4 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">💡</span>
          <span className="font-semibold text-[#0075de]">Akun Uji Coba (Password: password123)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => { setUsername('admin'); setPassword('password123'); }}
            className="text-left p-2 rounded-[6px] bg-white/80 hover:bg-white border border-[rgba(0,117,222,0.15)] hover:border-[#0075de] transition-all cursor-pointer text-[#111111]"
          >
            <span className="font-semibold text-[#0075de]">Super Admin</span>: admin
          </button>
          <button
            type="button"
            onClick={() => { setUsername('bendahara_putra'); setPassword('password123'); }}
            className="text-left p-2 rounded-[6px] bg-white/80 hover:bg-white border border-[rgba(0,117,222,0.15)] hover:border-[#0075de] transition-all cursor-pointer text-[#111111]"
          >
            <span className="font-semibold text-[#0075de]">Bend. Putra</span>: bendahara_putra
          </button>
          <button
            type="button"
            onClick={() => { setUsername('2024001'); setPassword('password123'); }}
            className="text-left p-2 rounded-[6px] bg-white/80 hover:bg-white border border-[rgba(0,117,222,0.15)] hover:border-[#0075de] transition-all cursor-pointer text-[#111111]"
          >
            <span className="font-semibold text-[#0075de]">Santri</span>: 2024001
          </button>
          <button
            type="button"
            onClick={() => { setUsername('2024002'); setPassword('password123'); }}
            className="text-left p-2 rounded-[6px] bg-white/80 hover:bg-white border border-[rgba(0,117,222,0.15)] hover:border-[#0075de] transition-all cursor-pointer text-[#111111]"
          >
            <span className="font-semibold text-[#0075de]">Santri (Cicil)</span>: 2024002
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f5f4] p-4 sm:p-6">
      <Suspense fallback={<div className="text-center text-sm text-[#757575]">Memuat halaman login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
