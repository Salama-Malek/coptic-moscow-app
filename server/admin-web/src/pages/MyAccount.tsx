import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';

export default function MyAccount() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.post('/admin/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage(t('success'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || t('error');
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const adminStr = localStorage.getItem('admin_user');
  const admin = adminStr ? JSON.parse(adminStr) : null;

  return (
    <div>
      <h1 style={{ fontFamily: fonts.heading, color: colors.primary, margin: '0 0 20px' }}>{t('nav_my_account')}</h1>

      {admin && (
        <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <p><strong>{t('team_display_name')}:</strong> {admin.display_name}</p>
          <p><strong>{t('email')}:</strong> {admin.email}</p>
          <p><strong>{t('team_role')}:</strong> {admin.role}</p>
        </div>
      )}

      <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, padding: 20, maxWidth: 400 }}>
        <h3 style={{ color: colors.primary, margin: '0 0 16px' }}>{t('change_password')}</h3>

        {message && (
          <div style={{
            padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13,
            background: message === t('success') ? '#E8F5E9' : '#FFEBEE',
            color: message === t('success') ? colors.success : colors.error,
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('current_password')}</span>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              required dir="ltr"
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
          </label>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('new_password')}</span>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              required minLength={8} dir="ltr"
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
          </label>
          <button type="submit" disabled={loading}
            style={{ padding: '10px 24px', border: 'none', borderRadius: 6, background: colors.primary, color: colors.white, cursor: 'pointer' }}>
            {loading ? t('loading') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
