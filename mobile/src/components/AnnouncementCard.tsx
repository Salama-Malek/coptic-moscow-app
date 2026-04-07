import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import type { AnnouncementData } from '../lib/api';

interface Props {
  announcement: AnnouncementData;
}

export default function AnnouncementCard({ announcement }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ar' | 'ru' | 'en';

  const title = lang === 'ru' ? (announcement.title_ru || announcement.title_ar)
    : lang === 'en' ? (announcement.title_en || announcement.title_ar)
    : announcement.title_ar;

  const body = lang === 'ru' ? (announcement.body_ru || announcement.body_ar)
    : lang === 'en' ? (announcement.body_en || announcement.body_ar)
    : announcement.body_ar;

  const date = announcement.sent_at
    ? new Date(announcement.sent_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'ru' ? 'ru-RU' : 'en-US')
    : '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { writingDirection: lang === 'ar' ? 'rtl' : 'ltr' }]}>{title}</Text>
        {announcement.priority === 'critical' && (
          <View style={styles.criticalBadge}><Text style={styles.criticalText}>!</Text></View>
        )}
      </View>
      <Text style={[styles.body, { writingDirection: lang === 'ar' ? 'rtl' : 'ltr' }]} numberOfLines={4}>
        {body}
      </Text>
      <Text style={styles.date}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.white,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  body: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: colors.muted,
  },
  criticalBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: 8,
  },
  criticalText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
