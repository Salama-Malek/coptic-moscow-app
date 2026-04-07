import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useApiGet } from '../hooks/useApi';
import TemplateForm from '../components/TemplateForm';
import LivePreview from '../components/LivePreview';
import ConfirmModal from '../components/ConfirmModal';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';
import type { Template, Stats } from '../types';

export default function NewAnnouncement() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const { data: templates } = useApiGet<Template[]>('/admin/templates');
  const { data: stats } = useApiGet<Stats>('/admin/stats');

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string | number | boolean>>({});

  // Rendered preview bodies
  const [bodyAr, setBodyAr] = useState('');
  const [bodyRu, setBodyRu] = useState<string | null>(null);
  const [bodyEn, setBodyEn] = useState<string | null>(null);

  // Allow manual edits to the rendered body
  const [editedBodyAr, setEditedBodyAr] = useState('');
  const [editedBodyRu, setEditedBodyRu] = useState('');
  const [editedBodyEn, setEditedBodyEn] = useState('');
  const [manualEdit, setManualEdit] = useState(false);

  // Announcement fields
  const [titleAr, setTitleAr] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'critical'>('normal');
  const [category, setCategory] = useState<'service' | 'announcement'>('announcement');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
  const [scheduledFor, setScheduledFor] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Load template details when selection changes
  useEffect(() => {
    if (selectedTemplateId && templates) {
      const tmpl = templates.find(t => t.id === selectedTemplateId);
      if (tmpl) {
        setSelectedTemplate(tmpl);
        // Initialize values from defaults
        const placeholders = typeof tmpl.placeholders === 'string' ? JSON.parse(tmpl.placeholders) : tmpl.placeholders;
        const defaults: Record<string, string | number | boolean> = {};
        for (const p of placeholders) {
          if (p.default !== undefined) defaults[p.key] = p.default;
        }
        setValues(defaults);
        // Set title from template name
        setTitleAr(tmpl.name_ar);
        setTitleRu(tmpl.name_ru || '');
        setTitleEn(tmpl.name_en || '');
        setManualEdit(false);
      }
    } else {
      setSelectedTemplate(null);
      setValues({});
      setBodyAr('');
      setBodyRu(null);
      setBodyEn(null);
      setManualEdit(false);
    }
  }, [selectedTemplateId, templates]);

  // Render template preview on value changes
  const renderPreview = useCallback(async () => {
    if (!selectedTemplate || manualEdit) return;
    try {
      const res = await api.post(`/admin/templates/${selectedTemplate.id}/render`, { values });
      setBodyAr(res.data.body_ar || '');
      setBodyRu(res.data.body_ru);
      setBodyEn(res.data.body_en);
      setEditedBodyAr(res.data.body_ar || '');
      setEditedBodyRu(res.data.body_ru || '');
      setEditedBodyEn(res.data.body_en || '');
    } catch {
      // silently fail preview
    }
  }, [selectedTemplate, values, manualEdit]);

  useEffect(() => {
    const timer = setTimeout(renderPreview, 300);
    return () => clearTimeout(timer);
  }, [renderPreview]);

  const handleValueChange = (key: string, value: string | number | boolean) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSend = async (asDraft: boolean) => {
    setSending(true);
    setSuccessMsg('');
    try {
      const finalBodyAr = manualEdit ? editedBodyAr : bodyAr;
      const finalBodyRu = manualEdit ? editedBodyRu : (bodyRu || '');
      const finalBodyEn = manualEdit ? editedBodyEn : (bodyEn || '');

      await api.post('/admin/announcements', {
        title_ar: titleAr,
        title_ru: titleRu || undefined,
        title_en: titleEn || undefined,
        body_ar: finalBodyAr,
        body_ru: finalBodyRu || undefined,
        body_en: finalBodyEn || undefined,
        priority,
        category,
        status: asDraft ? 'draft' : undefined,
        scheduled_for: scheduleMode === 'schedule' && !asDraft ? scheduledFor : undefined,
        template_id: selectedTemplateId || undefined,
      });
      setSuccessMsg(asDraft ? t('ann_draft') + ' ✓' : t('ann_sent') + ' ✓');
      setShowConfirm(false);
      // Reset form
      if (!asDraft) {
        setSelectedTemplateId(null);
        setTitleAr(''); setTitleRu(''); setTitleEn('');
        setBodyAr(''); setBodyRu(null); setBodyEn(null);
        setEditedBodyAr(''); setEditedBodyRu(''); setEditedBodyEn('');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to send';
      setSuccessMsg('');
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  const placeholders = selectedTemplate
    ? (typeof selectedTemplate.placeholders === 'string' ? JSON.parse(selectedTemplate.placeholders) : selectedTemplate.placeholders)
    : [];

  return (
    <div>
      <h1 style={{ fontFamily: fonts.heading, color: colors.primary, margin: '0 0 20px' }}>
        {t('nav_new_announcement')}
      </h1>

      {successMsg && (
        <div style={{ background: '#E8F5E9', color: colors.success, padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>
          {successMsg}
        </div>
      )}

      {/* Template picker */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6 }}>
          {t('choose_template')}
        </label>
        <select
          value={selectedTemplateId || ''}
          onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
          style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 14, minWidth: 280 }}
        >
          <option value="">{t('no_template')}</option>
          {templates?.map((tmpl) => (
            <option key={tmpl.id} value={tmpl.id}>
              {i18n.language === 'ru' ? (tmpl.name_ru || tmpl.name_ar) : i18n.language === 'en' ? (tmpl.name_en || tmpl.name_ar) : tmpl.name_ar}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Left: form */}
        <div style={{ flex: 1, minWidth: 320 }}>
          {/* Title fields */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_title_ar')}</span>
              <input value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl"
                style={inputStyle} required />
            </label>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_title_ru')}</span>
              <input value={titleRu} onChange={e => setTitleRu(e.target.value)} dir="ltr" style={inputStyle} />
            </label>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_title_en')}</span>
              <input value={titleEn} onChange={e => setTitleEn(e.target.value)} dir="ltr" style={inputStyle} />
            </label>
          </div>

          {/* Template placeholder fields */}
          {selectedTemplate && placeholders.length > 0 && (
            <div style={{ marginBottom: 16, padding: 16, background: colors.parchment, borderRadius: 8 }}>
              <TemplateForm placeholders={placeholders} values={values} onChange={handleValueChange} />
            </div>
          )}

          {/* Manual body edit (no template or manual override) */}
          {(!selectedTemplate || manualEdit) && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_body_ar')}</span>
                <textarea value={editedBodyAr} onChange={e => setEditedBodyAr(e.target.value)} dir="rtl"
                  rows={6} style={{ ...inputStyle, resize: 'vertical' }} required />
              </label>
              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_body_ru')}</span>
                <textarea value={editedBodyRu} onChange={e => setEditedBodyRu(e.target.value)} dir="ltr"
                  rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </label>
              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_body_en')}</span>
                <textarea value={editedBodyEn} onChange={e => setEditedBodyEn(e.target.value)} dir="ltr"
                  rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </label>
            </div>
          )}

          {/* Switch to manual edit */}
          {selectedTemplate && !manualEdit && (
            <button onClick={() => setManualEdit(true)}
              style={{ fontSize: 12, color: colors.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginBottom: 16 }}>
              Edit rendered text manually
            </button>
          )}

          {/* Priority, category, schedule */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <label>
              <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_priority')}</span>
              <select value={priority} onChange={e => setPriority(e.target.value as typeof priority)}
                style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 6 }}>
                <option value="normal">{t('priority_normal')}</option>
                <option value="high">{t('priority_high')}</option>
                <option value="critical">{t('priority_critical')}</option>
              </select>
            </label>
            <label>
              <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_category')}</span>
              <select value={category} onChange={e => setCategory(e.target.value as typeof category)}
                style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 6 }}>
                <option value="service">{t('category_service')}</option>
                <option value="announcement">{t('category_announcement')}</option>
              </select>
            </label>
            <label>
              <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_schedule')}</span>
              <select value={scheduleMode} onChange={e => setScheduleMode(e.target.value as 'now' | 'schedule')}
                style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 6 }}>
                <option value="now">{t('ann_send_now')}</option>
                <option value="schedule">{t('ann_schedule_for')}</option>
              </select>
            </label>
            {scheduleMode === 'schedule' && (
              <label>
                <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>{t('ann_schedule_for')}</span>
                <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)}
                  style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 6 }} />
              </label>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => handleSend(true)} disabled={sending || !titleAr}
              style={{ padding: '10px 24px', border: `1px solid ${colors.primary}`, borderRadius: 6, background: 'transparent', color: colors.primary, cursor: 'pointer', fontSize: 14 }}>
              {t('ann_save_draft')}
            </button>
            <button onClick={() => setShowConfirm(true)} disabled={sending || !titleAr || (!bodyAr && !editedBodyAr)}
              style={{ padding: '10px 24px', border: 'none', borderRadius: 6, background: colors.primary, color: colors.white, cursor: 'pointer', fontSize: 14 }}>
              {t('ann_preview_send')}
            </button>
          </div>
        </div>

        {/* Right: live preview */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3 style={{ color: colors.primary, margin: '0 0 10px', fontSize: 15 }}>{t('live_preview')}</h3>
          <LivePreview
            bodyAr={manualEdit ? editedBodyAr : bodyAr}
            bodyRu={manualEdit ? editedBodyRu : bodyRu}
            bodyEn={manualEdit ? editedBodyEn : bodyEn}
          />
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title={t('ann_confirm_send')}
        message={t('ann_confirm_message', { count: stats?.total_devices ?? 0 })}
        onConfirm={() => handleSend(false)}
        onCancel={() => setShowConfirm(false)}
        loading={sending}
      />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: `1px solid #D4C5A9`,
  borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
};
