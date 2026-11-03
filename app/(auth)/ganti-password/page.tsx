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
    <div className="flex min-h-screen items-center justify-center bg-[#F6F6F6] p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] bg-[#F4512A] text-white shadow-none">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#202119] font-heading">
            Ganti Password Pertama Kali
          </h1>
          <p className="text-sm text-[#747474]">
            Untuk keamanan akun Anda, silakan ubah password bawaan dari bendahara sebelum melanjutkan.
          </p>
        </div>

        <Card className="rounded-[18px] border border-[#E8E8E8] bg-white text-[#202119] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold text-[#202119]">Atur Password Baru</CardTitle>
            <CardDescription className="text-xs text-[#747474]">
              Gunakan minimal 6 karakter kombinasi huruf dan angka.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2.5 rounded-[18px] bg-[#FCEDEF] border-[rgba(200,76,90,0.2)] text-[#C84C5A]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="py-2.5 rounded-[18px] bg-[#EAF7EF] border-[rgba(43,138,96,0.2)] text-[#2B8A60]">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    Password berhasil diperbarui! Mengalihkan ke dashboard...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="passwordLama" className="text-xs font-semibold text-[#202119]">
                  Password Saat Ini (Password Bawaan)
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#747474]">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="passwordLama"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordLama}
                    onChange={(e) => setPasswordLama(e.target.value)}
                    className="pl-9 rounded-[8px] border border-[#E8E8E8] bg-white text-[#202119] placeholder:text-[#747474] focus-visible:ring-2 focus-visible:ring-[#315FC4] focus-visible:border-transparent shadow-none"
                    disabled={success}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordBaru" className="text-xs font-semibold text-[#202119]">
                  Password Baru
                </Label>
                <Input
                  id="passwordBaru"
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  className="rounded-[8px] border border-[#E8E8E8] bg-white text-[#202119] placeholder:text-[#747474] focus-visible:ring-2 focus-visible:ring-[#315FC4] focus-visible:border-transparent shadow-none"
                  disabled={success}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="konfirmasiPassword" className="text-xs font-semibold text-[#202119]">
                  Ulangi Password Baru
                </Label>
                <Input
                  id="konfirmasiPassword"
                  type="password"
                  required
                  placeholder="Ketik ulang password baru"
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  className="rounded-[8px] border border-[#E8E8E8] bg-white text-[#202119] placeholder:text-[#747474] focus-visible:ring-2 focus-visible:ring-[#315FC4] focus-visible:border-transparent shadow-none"
                  disabled={success}
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                disabled={loading || success}
                className="w-full rounded-[8px] bg-[#202119] hover:bg-[#2e2f26] active:bg-[#181913] text-white font-medium py-2.5 shadow-none transition-colors cursor-pointer"
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
