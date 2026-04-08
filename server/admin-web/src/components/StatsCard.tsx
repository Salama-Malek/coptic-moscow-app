import { colors } from '../theme/colors';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <div
      style={{
        border: `1px solid ${colors.gold}`,
        borderRadius: 10,
        padding: '16px 14px',
        background: colors.white,
        textAlign: 'center',
      }}
    >
      <div style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>{title}</div>
      <div style={{ color: colors.primary, fontSize: 24, fontWeight: 700 }}>{value}</div>
      {subtitle && <div style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}
