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
    <div className="flex min-h-screen items-center justify-center bg-[#f6f5f4] p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#0075de] text-white shadow-none">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] font-heading">
            Ganti Password Pertama Kali
          </h1>
          <p className="text-sm text-[#757575]">
            Untuk keamanan akun Anda, silakan ubah password bawaan dari bendahara sebelum melanjutkan.
          </p>
        </div>

        <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white text-[#111111] shadow-none">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold text-[#111111]">Atur Password Baru</CardTitle>
            <CardDescription className="text-xs text-[#757575]">
              Gunakan minimal 6 karakter kombinasi huruf dan angka.
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

              {success && (
                <Alert variant="success" className="py-2.5 rounded-[8px] bg-[#ebf5ee] border-[rgba(43,110,79,0.2)] text-[#2b6e4f]">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    Password berhasil diperbarui! Mengalihkan ke dashboard...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="passwordLama" className="text-xs font-semibold text-[#111111]">
                  Password Saat Ini (Password Bawaan)
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#757575]">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="passwordLama"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordLama}
                    onChange={(e) => setPasswordLama(e.target.value)}
                    className="pl-9 rounded-[8px] border-[rgba(0,0,0,0.12)] bg-white text-[#111111] placeholder:text-[rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-[#0075de]/30 focus-visible:border-[#0075de] shadow-none"
                    disabled={success}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordBaru" className="text-xs font-semibold text-[#111111]">
                  Password Baru
                </Label>
                <Input
                  id="passwordBaru"
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  className="rounded-[8px] border-[rgba(0,0,0,0.12)] bg-white text-[#111111] placeholder:text-[rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-[#0075de]/30 focus-visible:border-[#0075de] shadow-none"
                  disabled={success}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="konfirmasiPassword" className="text-xs font-semibold text-[#111111]">
                  Ulangi Password Baru
                </Label>
                <Input
                  id="konfirmasiPassword"
                  type="password"
                  required
                  placeholder="Ketik ulang password baru"
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  className="rounded-[8px] border-[rgba(0,0,0,0.12)] bg-white text-[#111111] placeholder:text-[rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-[#0075de]/30 focus-visible:border-[#0075de] shadow-none"
                  disabled={success}
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                disabled={loading || success}
                className="w-full rounded-[8px] bg-[#0075de] hover:bg-[#0060b8] active:bg-[#004f94] text-white font-medium py-2.5 shadow-none transition-colors cursor-pointer"
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
