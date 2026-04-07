import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }: ConfirmModalProps) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: colors.white,
          borderRadius: 12,
          padding: 28,
          minWidth: 340,
          maxWidth: 480,
          border: `1px solid ${colors.gold}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: colors.primary, margin: '0 0 12px' }}>{title}</h3>
        <p style={{ color: colors.ink, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px', border: `1px solid ${colors.border}`,
              borderRadius: 6, background: 'transparent', cursor: 'pointer',
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 20px', border: 'none', borderRadius: 6,
              background: colors.primary, color: colors.white, cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? t('loading') : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
