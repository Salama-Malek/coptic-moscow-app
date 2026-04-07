import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { getItem } from '../lib/storage';
import { expandEvents, ExpandedOccurrence } from '../lib/rrule';
import { CalendarEventData, AnnouncementData } from '../lib/api';
import CalendarEventCard from '../components/CalendarEventCard';
import AnnouncementCard from '../components/AnnouncementCard';
import CopticCross from '../components/CopticCross';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const [todayEvents, setTodayEvents] = useState<ExpandedOccurrence[]>([]);
  const [nextEvent, setNextEvent] = useState<ExpandedOccurrence | null>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<AnnouncementData[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const cachedCalendar = await getItem<CalendarEventData[]>('calendar');
    if (cachedCalendar) {
      const expanded = expandEvents(cachedCalendar);
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const today = expanded.filter(o => o.date >= now && o.date <= todayEnd);
      setTodayEvents(today);

      const next = expanded.find(o => o.date > now);
      setNextEvent(next || null);
    }

    const cachedInbox = await getItem<AnnouncementData[]>('inbox');
    if (cachedInbox) {
      setRecentAnnouncements(cachedInbox.slice(0, 3));
    }
  };

  const isRTL = i18n.language === 'ar';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <CopticCross size={40} />
        <Text style={[styles.headerTitle, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
          {t('app_name')}
        </Text>
      </View>

      {/* Today's services */}
      <Text style={styles.sectionTitle}>{t('today_services')}</Text>
      {todayEvents.length > 0 ? (
        todayEvents.map((occ, i) => <CalendarEventCard key={i} occurrence={occ} />)
      ) : (
        <Text style={styles.emptyText}>{t('no_services_today')}</Text>
      )}

      {/* Next upcoming */}
      {nextEvent && (
        <>
          <Text style={styles.sectionTitle}>{t('next_event')}</Text>
          <CalendarEventCard occurrence={nextEvent} />
        </>
      )}

      {/* Recent announcements */}
      <Text style={styles.sectionTitle}>{t('recent_announcements')}</Text>
      {recentAnnouncements.length > 0 ? (
        recentAnnouncements.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
      ) : (
        <Text style={styles.emptyText}>{t('no_announcements')}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
