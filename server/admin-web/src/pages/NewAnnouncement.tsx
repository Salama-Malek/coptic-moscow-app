import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useApiGet } from '../hooks/useApi';
import { useIsMobile } from '../hooks/useMediaQuery';
import TemplateForm from '../components/TemplateForm';
import LivePreview from '../components/LivePreview';
import ConfirmModal from '../components/ConfirmModal';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';
import type { Template, Stats } from '../types';

export default function NewAnnouncement() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const isMobile = useIsMobile();
  const { data: templates } = useApiGet<Template[]>('/admin/templates');
  const { data: stats } = useApiGet<Stats>('/admin/stats');

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string | number | boolean>>({});

  const [bodyAr, setBodyAr] = useState('');
  const [bodyRu, setBodyRu] = useState<string | null>(null);
  const [bodyEn, setBodyEn] = useState<string | null>(null);

  const [editedBodyAr, setEditedBodyAr] = useState('');
  const [editedBodyRu, setEditedBodyRu] = useState('');
  const [editedBodyEn, setEditedBodyEn] = useState('');
  const [manualEdit, setManualEdit] = useState(false);

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
  const [showPreview, setShowPreview] = useState(!isMobile);

  useEffect(() => {
    if (selectedTemplateId && templates) {
      const tmpl = templates.find(t => t.id === selectedTemplateId);
      if (tmpl) {
        setSelectedTemplate(tmpl);
        const placeholders = typeof tmpl.placeholders === 'string' ? JSON.parse(tmpl.placeholders) : tmpl.placeholders;
        const defaults: Record<string, string | number | boolean> = {};
        for (const p of placeholders) {
          if (p.default !== undefined) defaults[p.key] = p.default;
        }
        setValues(defaults);
        setTitleAr(tmpl.name_ar);
        setTitleRu(tmpl.name_ru || '');
        setTitleEn(tmpl.name_en || '');
        setManualEdit(false);
      }
    } else {
      setSelectedTemplate(null);
      setValues({});
      setBodyAr(''); setBodyRu(null); setBodyEn(null);
      setManualEdit(false);
    }
  }, [selectedTemplateId, templates]);

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
    } catch { /* silent */ }
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
        priority, category,
        status: asDraft ? 'draft' : undefined,
        scheduled_for: scheduleMode === 'schedule' && !asDraft ? scheduledFor : undefined,
        template_id: selectedTemplateId || undefined,
      });
      setSuccessMsg(asDraft ? t('ann_draft') + ' ✓' : t('ann_sent') + ' ✓');
      setShowConfirm(false);
      if (!asDraft) {
        setSelectedTemplateId(null);
        setTitleAr(''); setTitleRu(''); setTitleEn('');
        setBodyAr(''); setBodyRu(null); setBodyEn(null);
        setEditedBodyAr(''); setEditedBodyRu(''); setEditedBodyEn('');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to send';
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
      <h1 className="page-title" style={{ fontFamily: fonts.heading }}>{t('nav_new_announcement')}</h1>

      {successMsg && (
        <div style={{ background: '#E8F5E9', color: colors.success, padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
          {successMsg}
        </div>
      )}

      {/* Template picker */}
      <div className="form-group">
        <label className="form-label">{t('choose_template')}</label>
        <select
          value={selectedTemplateId || ''}
          onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
          className="form-input"
        >
          <option value="">{t('no_template')}</option>
          {templates?.map((tmpl) => (
            <option key={tmpl.id} value={tmpl.id}>
              {i18n.language === 'ru' ? (tmpl.name_ru || tmpl.name_ar) : i18n.language === 'en' ? (tmpl.name_en || tmpl.name_ar) : tmpl.name_ar}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 24 }}>
        {/* Form section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title fields */}
          <div className="form-group">
            <label className="form-label">{t('ann_title_ar')}</label>
            <input value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl" className="form-input" required />
          </div>
          <div className={isMobile ? '' : 'grid-2'}>
            <div className="form-group">
              <label className="form-label">{t('ann_title_ru')}</label>
              <input value={titleRu} onChange={e => setTitleRu(e.target.value)} dir="ltr" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('ann_title_en')}</label>
              <input value={titleEn} onChange={e => setTitleEn(e.target.value)} dir="ltr" className="form-input" />
            </div>
          </div>

          {/* Template placeholder fields */}
          {selectedTemplate && placeholders.length > 0 && (
            <div style={{ padding: 14, background: colors.parchmentDark, borderRadius: 8, marginBottom: 14 }}>
              <TemplateForm placeholders={placeholders} values={values} onChange={handleValueChange} />
            </div>
          )}

          {/* Manual body edit */}
          {(!selectedTemplate || manualEdit) && (
            <>
              <div className="form-group">
                <label className="form-label">{t('ann_body_ar')}</label>
                <textarea value={editedBodyAr} onChange={e => setEditedBodyAr(e.target.value)} dir="rtl"
                  rows={6} className="form-input" style={{ resize: 'vertical' }} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('ann_body_ru')}</label>
                <textarea value={editedBodyRu} onChange={e => setEditedBodyRu(e.target.value)} dir="ltr"
                  rows={4} className="form-input" style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('ann_body_en')}</label>
                <textarea value={editedBodyEn} onChange={e => setEditedBodyEn(e.target.value)} dir="ltr"
                  rows={4} className="form-input" style={{ resize: 'vertical' }} />
              </div>
            </>
          )}

          {selectedTemplate && !manualEdit && (
            <button onClick={() => setManualEdit(true)} className="btn btn-ghost" style={{ fontSize: 12, marginBottom: 14 }}>
              Edit rendered text manually
            </button>
          )}

          {/* Priority / category / schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">{t('ann_priority')}</label>
              <select value={priority} onChange={e => setPriority(e.target.value as typeof priority)} className="form-input">
                <option value="normal">{t('priority_normal')}</option>
                <option value="high">{t('priority_high')}</option>
                <option value="critical">{t('priority_critical')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('ann_category')}</label>
              <select value={category} onChange={e => setCategory(e.target.value as typeof category)} className="form-input">
                <option value="service">{t('category_service')}</option>
                <option value="announcement">{t('category_announcement')}</option>
              </select>
            </div>
            <div className="form-group" style={isMobile ? { gridColumn: '1 / -1' } : {}}>
              <label className="form-label">{t('ann_schedule')}</label>
              <select value={scheduleMode} onChange={e => setScheduleMode(e.target.value as 'now' | 'schedule')} className="form-input">
                <option value="now">{t('ann_send_now')}</option>
                <option value="schedule">{t('ann_schedule_for')}</option>
              </select>
            </div>
          </div>

          {scheduleMode === 'schedule' && (
            <div className="form-group">
              <label className="form-label">{t('ann_schedule_for')}</label>
              <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} className="form-input" />
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
            <button onClick={() => handleSend(true)} disabled={sending || !titleAr}
              className={`btn btn-secondary ${isMobile ? 'btn-block' : ''}`}>
              {t('ann_save_draft')}
            </button>
            <button onClick={() => setShowConfirm(true)} disabled={sending || !titleAr || (!bodyAr && !editedBodyAr)}
              className={`btn btn-primary ${isMobile ? 'btn-block' : ''}`}>
              {t('ann_preview_send')}
            </button>
          </div>
        </div>

        {/* Preview section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isMobile && (
            <button onClick={() => setShowPreview(!showPreview)} className="btn btn-ghost" style={{ marginBottom: 8, width: '100%' }}>
              {showPreview ? '▲' : '▼'} {t('live_preview')}
            </button>
          )}
          {(!isMobile || showPreview) && (
            <>
              {!isMobile && <h3 style={{ color: colors.primary, margin: '0 0 10px', fontSize: 15 }}>{t('live_preview')}</h3>}
              <LivePreview
                bodyAr={manualEdit ? editedBodyAr : bodyAr}
                bodyRu={manualEdit ? editedBodyRu : bodyRu}
                bodyEn={manualEdit ? editedBodyEn : bodyEn}
              />
            </>
          )}
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
