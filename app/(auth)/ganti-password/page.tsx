'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, KeyRound, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { changePasswordAction } from './actions';

export default function GantiPasswordPage() {
  const router = useRouter();
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await changePasswordAction({
      passwordLama,
      passwordBaru,
      konfirmasiPassword,
    });

    if (!result.success) {
      setError(result.error || 'Gagal mengubah password');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Give user visual feedback then navigate
    setTimeout(() => {
      router.push('/santri');
      router.refresh();
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F5132] text-white shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading">
            Ganti Password Pertama Kali
          </h1>
          <p className="text-sm text-[#64748B]">
            Untuk keamanan akun Anda, silakan ubah password bawaan dari bendahara sebelum melanjutkan.
          </p>
        </div>

        <Card className="border-[#E2E8F0] shadow-sm bg-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold text-[#0F172A]">Atur Password Baru</CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Gunakan minimal 6 karakter kombinasi huruf dan angka.
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

              {success && (
                <Alert variant="success" className="py-2.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    Password berhasil diperbarui! Mengalihkan ke dashboard...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="passwordLama" className="text-xs font-semibold text-[#334155]">
                  Password Saat Ini (Password Bawaan)
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="passwordLama"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordLama}
                    onChange={(e) => setPasswordLama(e.target.value)}
                    className="pl-9"
                    disabled={success}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordBaru" className="text-xs font-semibold text-[#334155]">
                  Password Baru
                </Label>
                <Input
                  id="passwordBaru"
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  disabled={success}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="konfirmasiPassword" className="text-xs font-semibold text-[#334155]">
                  Ulangi Password Baru
                </Label>
                <Input
                  id="konfirmasiPassword"
                  type="password"
                  required
                  placeholder="Ketik ulang password baru"
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  disabled={success}
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                disabled={loading || success}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-medium py-2.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan & Lanjutkan'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
