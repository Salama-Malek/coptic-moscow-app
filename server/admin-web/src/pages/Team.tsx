import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiGet } from '../hooks/useApi';
import api from '../api/client';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';

interface AdminRow {
  id: number;
  display_name: string;
  email: string;
  role: string;
  active: number;
  must_change_password: number;
  created_at: string;
}

export default function Team() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const { data: admins, loading, refetch } = useApiGet<AdminRow[]>('/admin/team');

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const res = await api.post('/admin/team', { display_name: newName, email: newEmail, role: newRole });
      setTempPassword(res.data.temp_password);
      setNewName(''); setNewEmail('');
      refetch();
    } catch {
      alert(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number, currentActive: number) => {
    try {
      await api.put(`/admin/team/${id}`, { active: currentActive ? 0 : 1 });
      refetch();
    } catch {
      alert(t('error'));
    }
  };

  const handleResetPassword = async (id: number) => {
    if (!confirm(t('confirm') + '?')) return;
    try {
      const res = await api.post(`/admin/team/${id}/reset-password`);
      setTempPassword(res.data.temp_password);
    } catch {
      alert(t('error'));
    }
  };

  if (loading) return <p>{t('loading')}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: fonts.heading, color: colors.primary, margin: 0 }}>{t('nav_team')}</h1>
        <button onClick={() => { setShowAdd(true); setTempPassword(null); }}
          style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: colors.primary, color: colors.white, cursor: 'pointer' }}>
          {t('team_add')}
        </button>
      </div>

      {/* Temp password display */}
      {tempPassword && (
        <div style={{ background: '#FFF3E0', border: `1px solid ${colors.warning}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <strong>{t('team_temp_password')}:</strong>
          <code style={{ display: 'block', fontSize: 18, margin: '8px 0', padding: 8, background: colors.white, borderRadius: 4, direction: 'ltr' }}>
            {tempPassword}
          </code>
          <small style={{ color: colors.muted }}>{t('team_temp_password_note')}</small>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label>
              <span style={labelStyle}>{t('team_display_name')}</span>
              <input value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>{t('email')}</span>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} dir="ltr" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>{t('team_role')}</span>
              <select value={newRole} onChange={e => setNewRole(e.target.value as typeof newRole)}
                style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 6, width: '100%' }}>
                <option value="admin">{t('team_admin')}</option>
                <option value="super_admin">{t('team_super_admin')}</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleAdd} disabled={saving || !newName || !newEmail}
              style={{ padding: '8px 24px', border: 'none', borderRadius: 6, background: colors.primary, color: colors.white, cursor: 'pointer' }}>
              {saving ? t('loading') : t('save')}
            </button>
            <button onClick={() => setShowAdd(false)}
              style={{ padding: '8px 24px', border: `1px solid ${colors.border}`, borderRadius: 6, background: 'transparent', cursor: 'pointer' }}>
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: colors.parchmentDark }}>
              <th style={thStyle}>{t('team_display_name')}</th>
              <th style={thStyle}>{t('email')}</th>
              <th style={thStyle}>{t('team_role')}</th>
              <th style={thStyle}>{t('team_active')}</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {admins?.map((a) => (
              <tr key={a.id} style={{ borderBottom: `1px solid ${colors.border}`, opacity: a.active ? 1 : 0.5 }}>
                <td style={tdStyle}>{a.display_name}</td>
                <td style={{ ...tdStyle, direction: 'ltr' }}>{a.email}</td>
                <td style={tdStyle}>{a.role === 'super_admin' ? t('team_super_admin') : t('team_admin')}</td>
                <td style={tdStyle}>{a.active ? '✓' : '✗'}</td>
                <td style={{ ...tdStyle, display: 'flex', gap: 8 }}>
                  <button onClick={() => handleToggleActive(a.id, a.active)}
                    style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                    {a.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleResetPassword(a.id)}
                    style={{ color: colors.warning, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                    {t('team_reset_password')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: '#7A6E5C', display: 'block', marginBottom: 3 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #D4C5A9', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'start', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '10px 14px' };
