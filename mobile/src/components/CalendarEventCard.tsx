import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import type { ExpandedOccurrence } from '../lib/rrule';

interface Props {
  occurrence: ExpandedOccurrence;
}

export default function CalendarEventCard({ occurrence }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ar' | 'ru' | 'en';
  const { event, date } = occurrence;

  const title = lang === 'ru' ? (event.title_ru || event.title_ar)
    : lang === 'en' ? (event.title_en || event.title_ar)
    : event.title_ar;

  const dateStr = date.toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : lang === 'ru' ? 'ru-RU' : 'en-US',
    { weekday: 'long', month: 'long', day: 'numeric' }
  );

  const timeStr = event.duration_minutes > 0
    ? date.toLocaleTimeString(
        lang === 'ar' ? 'ar-EG' : lang === 'ru' ? 'ru-RU' : 'en-US',
        { hour: '2-digit', minute: '2-digit' }
      )
    : '';

  return (
    <View style={styles.card}>
      <View style={styles.dateColumn}>
        <Text style={styles.dayNumber}>{date.getDate()}</Text>
        <Text style={styles.month}>
          {date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang, { month: 'short' })}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { writingDirection: lang === 'ar' ? 'rtl' : 'ltr' }]}>{title}</Text>
        <Text style={styles.meta}>{dateStr}</Text>
        {timeStr ? <Text style={styles.meta}>{timeStr}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dateColumn: {
    width: 54,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dayNumber: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '700',
  },
  month: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 3,
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
  },
});
