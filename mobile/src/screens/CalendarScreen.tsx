import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { getItem } from '../lib/storage';
import { expandEvents, ExpandedOccurrence } from '../lib/rrule';
import { CalendarEventData } from '../lib/api';
import CalendarEventCard from '../components/CalendarEventCard';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const [occurrences, setOccurrences] = useState<ExpandedOccurrence[]>([]);

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    const cached = await getItem<CalendarEventData[]>('calendar');
    if (cached) {
      setOccurrences(expandEvents(cached, 30));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('upcoming_30_days')}</Text>
      {occurrences.length > 0 ? (
        occurrences.map((occ, i) => <CalendarEventCard key={i} occurrence={occ} />)
      ) : (
        <Text style={styles.empty}>{t('no_events')}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  content: { padding: 16, paddingBottom: 32 },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 14,
    paddingTop: 8,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
