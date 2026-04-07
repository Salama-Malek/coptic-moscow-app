import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { getItem, setItem } from '../lib/storage';
import { fetchAnnouncements, AnnouncementData } from '../lib/api';
import AnnouncementCard from '../components/AnnouncementCard';

export default function InboxScreen() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    // Load from cache first
    const cached = await getItem<AnnouncementData[]>('inbox');
    if (cached) setAnnouncements(cached);

    // Then fetch fresh data
    await refresh();
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchAnnouncements(50);
      if (data.length > 0) {
        setAnnouncements(data);
        await setItem('inbox', data);
      }
    } catch {
      // offline — use cached data
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>{t('inbox')}</Text>
      {announcements.length > 0 ? (
        announcements.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
      ) : (
        <Text style={styles.empty}>{t('no_announcements')}</Text>
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
