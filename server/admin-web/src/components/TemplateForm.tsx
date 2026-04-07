import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import type { PlaceholderDef, Language } from '../types';

interface TemplateFormProps {
  placeholders: PlaceholderDef[];
  values: Record<string, string | number | boolean>;
  onChange: (key: string, value: string | number | boolean) => void;
}

export default function TemplateForm({ placeholders, values, onChange }: TemplateFormProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as Language;

  const getLabel = (p: PlaceholderDef) => {
    if (lang === 'ru' && p.label_ru) return p.label_ru;
    if (lang === 'en' && p.label_en) return p.label_en;
    return p.label_ar;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {placeholders.map((p) => {
        const val = values[p.key] ?? p.default ?? '';

        if (p.type === 'boolean') {
          return (
            <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={!!val}
                onChange={(e) => onChange(p.key, e.target.checked)}
                style={{ width: 18, height: 18, accentColor: colors.primary }}
              />
              <span>{getLabel(p)}</span>
              {p.optional && <span style={{ color: colors.muted, fontSize: 12 }}>(optional)</span>}
            </label>
          );
        }

        const inputType = p.type === 'number' ? 'number'
          : p.type === 'date' ? 'date'
          : p.type === 'time' ? 'time'
          : p.type === 'datetime' ? 'datetime-local'
          : 'text';

        return (
          <label key={p.key} style={{ display: 'block' }}>
            <span style={{ fontSize: 13, color: colors.muted, display: 'block', marginBottom: 3 }}>
              {getLabel(p)}
              {p.optional && <span style={{ marginInlineStart: 4, fontSize: 11 }}>(optional)</span>}
            </span>
            <input
              type={inputType}
              value={String(val)}
              onChange={(e) => onChange(p.key, p.type === 'number' ? Number(e.target.value) : e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`,
                borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </label>
        );
      })}
    </div>
  );
}
