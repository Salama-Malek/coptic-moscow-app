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
        borderRadius: 8,
        padding: 20,
        background: colors.white,
        minWidth: 160,
        textAlign: 'center',
      }}
    >
      <div style={{ color: colors.muted, fontSize: 13, marginBottom: 6 }}>{title}</div>
      <div style={{ color: colors.primary, fontSize: 28, fontWeight: 700 }}>{value}</div>
      {subtitle && <div style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}
