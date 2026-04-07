import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, I18nManager, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as Notifications from 'expo-notifications';
import { colors } from '../theme/colors';
import { getLanguage, setLanguage, getPreferences, setPreferences, getItem, setItem, DevicePreferences } from '../lib/storage';
import { sendTestNotification } from '../lib/notifications';
import { updateDevicePreferences } from '../lib/api';

const languages = [
  { code: 'ar' as const, label: 'العربية' },
  { code: 'ru' as const, label: 'Русский' },
  { code: 'en' as const, label: 'English' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const [prefs, setPrefs] = useState<DevicePreferences>({ services: true, announcements: true });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const perm = await Notifications.getPermissionsAsync();
    setPermissionStatus(perm.status);
    const storedPrefs = await getPreferences();
    setPrefs(storedPrefs);
  };

  const handleLanguageChange = async (lang: 'ar' | 'ru' | 'en') => {
    await setLanguage(lang);
    await i18n.changeLanguage(lang);

    // Update server
    const device = await getItem<{ fcm_token: string }>('deviceState');
    if (device?.fcm_token) {
      updateDevicePreferences({ fcm_token: device.fcm_token, language: lang });
    }

    const needsRTL = lang === 'ar';
    if (I18nManager.isRTL !== needsRTL) {
      I18nManager.forceRTL(needsRTL);
      I18nManager.allowRTL(needsRTL);
      // RTL change requires app restart — will apply on next launch
    }
  };

  const handlePrefToggle = async (key: keyof DevicePreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await setPreferences(updated);

    // Update server
    const device = await getItem<{ fcm_token: string }>('deviceState');
    if (device?.fcm_token) {
      updateDevicePreferences({ fcm_token: device.fcm_token, preferences: updated });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings')}</Text>

      {/* Language */}
      <Text style={styles.sectionTitle}>{t('language')}</Text>
      <View style={styles.card}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.langButton, i18n.language === lang.code && styles.langButtonActive]}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <Text style={[styles.langText, i18n.language === lang.code && styles.langTextActive]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>{t('notifications')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('notification_permission')}</Text>
          <Text style={[styles.rowValue, { color: permissionStatus === 'granted' ? colors.success : colors.error }]}>
            {permissionStatus === 'granted' ? t('granted') : t('denied')}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('services_notifications')}</Text>
          <Switch
            value={prefs.services}
            onValueChange={() => handlePrefToggle('services')}
            trackColor={{ true: colors.gold }}
            thumbColor={colors.white}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('announcements_notifications')}</Text>
          <Switch
            value={prefs.announcements}
            onValueChange={() => handlePrefToggle('announcements')}
            trackColor={{ true: colors.gold }}
            thumbColor={colors.white}
          />
        </View>
        <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
          <Text style={styles.testButtonText}>{t('test_notification')}</Text>
        </TouchableOpacity>
      </View>

      {/* Admin link */}
      <TouchableOpacity
        style={styles.adminLink}
        onPress={() => WebBrowser.openBrowserAsync('https://coptic-api.sm4tech.com/admin')}
      >
        <Text style={styles.adminLinkText}>{t('admin_login')}</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>{t('app_version')}: 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 14, paddingTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.primary, marginTop: 16, marginBottom: 8 },
  card: {
    borderWidth: 1, borderColor: colors.gold, borderRadius: 8,
    backgroundColor: colors.white, padding: 14,
  },
  langButton: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 6, marginBottom: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  langButtonActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  langText: { fontSize: 16, color: colors.ink, textAlign: 'center' },
  langTextActive: { color: colors.white },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark,
  },
  rowLabel: { fontSize: 14, color: colors.ink },
  rowValue: { fontSize: 14, fontWeight: '600' },
  testButton: {
    marginTop: 10, paddingVertical: 10, borderRadius: 6,
    borderWidth: 1, borderColor: colors.gold, alignItems: 'center',
  },
  testButtonText: { color: colors.primary, fontSize: 14 },
  adminLink: {
    marginTop: 20, paddingVertical: 12, borderRadius: 6,
    borderWidth: 1, borderColor: colors.primary, alignItems: 'center',
  },
  adminLinkText: { color: colors.primary, fontSize: 14 },
  version: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
});
