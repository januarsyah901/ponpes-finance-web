'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { pengguna, auditLog } from '@ponpes-finance/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function changePasswordAction(formData: {
  passwordLama: string;
  passwordBaru: string;
  konfirmasiPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Sesi login tidak valid. Silakan masuk kembali.' };
    }

    const { passwordLama, passwordBaru, konfirmasiPassword } = formData;

    if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
      return { success: false, error: 'Semua kolom password wajib diisi.' };
    }

    if (passwordBaru !== konfirmasiPassword) {
      return { success: false, error: 'Password baru dan konfirmasi password tidak cocok.' };
    }

    if (passwordBaru.length < 6) {
      return { success: false, error: 'Password baru minimal harus 6 karakter.' };
    }

    // 1. Fetch current user from database
    const [user] = await db
      .select()
      .from(pengguna)
      .where(eq(pengguna.id, session.user.id))
      .limit(1);

    if (!user) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    // 2. Verify old password
    const isMatch = await bcrypt.compare(passwordLama, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Password lama yang Anda masukkan salah.' };
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(passwordBaru, salt);

    // 4. Update user record
    await db
      .update(pengguna)
      .set({
        passwordHash: newHash,
        isFirstLogin: false,
        updatedAt: new Date(),
      })
      .where(eq(pengguna.id, user.id));

    // 5. Create audit log
    await db.insert(auditLog).values({
      userId: user.id,
      action: 'CHANGE_PASSWORD_FIRST_LOGIN',
      entityType: 'pengguna',
      entityId: user.id,
      newValues: { isFirstLogin: false },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan sistem saat mengganti password.' };
  }
}
