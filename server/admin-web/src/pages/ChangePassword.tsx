import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';

export default function ChangePassword() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const fonts = getFonts(i18n.language);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/admin/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      // Update stored admin to clear must_change_password
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        const admin = JSON.parse(stored);
        admin.must_change_password = false;
        localStorage.setItem('admin_user', JSON.stringify(admin));
      }
      navigate('/admin');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to change password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: colors.parchment, fontFamily: fonts.body,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360, padding: 32, background: colors.white,
          border: `1px solid ${colors.gold}`, borderRadius: 12,
        }}
      >
        <h2 style={{ fontFamily: fonts.heading, color: colors.primary, textAlign: 'center', margin: '0 0 8px' }}>
          {t('change_password')}
        </h2>
        <p style={{ textAlign: 'center', color: colors.muted, fontSize: 13, margin: '0 0 24px' }}>
          {t('must_change_password')}
        </p>

        {error && (
          <div style={{ background: '#FFEBEE', color: colors.error, padding: '8px 12px', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 4 }}>{t('current_password')}</span>
          <input
            type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            required dir="ltr"
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 4 }}>{t('new_password')}</span>
          <input
            type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            required minLength={8} dir="ltr"
            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
        </label>

        <button
          type="submit" disabled={loading}
          style={{
            width: '100%', padding: '12px 0', border: 'none', borderRadius: 6,
            background: colors.primary, color: colors.white, fontSize: 15,
            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? t('loading') : t('save')}
        </button>
      </form>
    </div>
  );
}
