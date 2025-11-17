import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { soundService } from '../utils/soundService';

interface SettingsScreenProps {
  playerId: string;
  onBack: () => void;
}

interface Settings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  playerName: string;
}

const SETTINGS_KEY = 'app_settings';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ playerId, onBack }) => {
  const [settings, setSettings] = useState<Settings>({
    soundEnabled: true,
    notificationsEnabled: true,
    hapticsEnabled: true,
    playerName: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);

      // Apply settings
      soundService.setEnabled(newSettings.soundEnabled);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleToggle = (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleNameSave = () => {
    saveSettings(settings);
    setIsEditing(false);
    Alert.alert('Success', 'Player name updated!');
  };

  const handleResetTutorial = async () => {
    Alert.alert(
      'Reset Tutorial',
      'This will show the ERS tutorial again on next launch. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('tutorial_seen');
            Alert.alert('Success', 'Tutorial reset! It will show on next app launch.');
          },
        },
      ]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your stats, achievements, and progress. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data cleared. Restart the app to start fresh.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Player Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Info</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Display Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={settings.playerName}
                  onChangeText={(text) => setSettings({ ...settings, playerName: text })}
                  placeholder="Enter your name"
                  placeholderTextColor="#64748B"
                />
              ) : (
                <Text style={styles.settingValue}>
                  {settings.playerName || 'Not set'}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={isEditing ? handleNameSave : () => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Player ID</Text>
              <Text style={styles.settingValue}>{playerId.slice(0, 12)}...</Text>
            </View>
          </View>
        </View>

        {/* Audio & Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio & Feedback</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingDescription}>
                Card flips, slaps, and game sounds
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={() => handleToggle('soundEnabled')}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Vibration on taps and actions
              </Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={() => handleToggle('hapticsEnabled')}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Alerts for game invites and turns
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={() => handleToggle('notificationsEnabled')}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Tutorial Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tutorial</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleResetTutorial}>
            <Text style={styles.actionButtonIcon}>🔄</Text>
            <Text style={styles.actionButtonText}>Reset Tutorial</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Made with</Text>
              <Text style={styles.settingValue}>❤️ for card game lovers</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearData}
          >
            <Text style={styles.actionButtonIcon}>⚠️</Text>
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Clear All Data
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#60A5FA',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  placeholder: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  settingValue: {
    fontSize: 14,
    color: '#94A3B8',
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  dangerTitle: {
    color: '#EF4444',
  },
  dangerButton: {
    backgroundColor: '#7F1D1D',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  dangerButtonText: {
    color: '#EF4444',
  },
  bottomPadding: {
    height: 40,
  },
});
