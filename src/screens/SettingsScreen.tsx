import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsScreenProps {
  onExit: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onExit }) => {
  const { theme, setTheme, availableThemes } = useTheme();

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
  };

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onExit}>
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>⚙️ Settings</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Customize your experience
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🎨 Visual Themes
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Choose a theme to personalize all your games
          </Text>

          <View style={styles.themesGrid}>
            {availableThemes.map((t) => {
              const isSelected = t.id === theme.id;

              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themeCard,
                    {
                      width: CARD_WIDTH,
                      borderColor: isSelected ? theme.colors.primary : 'transparent',
                      borderWidth: isSelected ? 3 : 0,
                    },
                  ]}
                  onPress={() => handleThemeSelect(t.id)}
                >
                  <LinearGradient
                    colors={t.colors.backgroundGradient}
                    style={styles.themeGradient}
                  >
                    {/* Theme Emoji */}
                    <Text style={styles.themeEmoji}>{t.emoji}</Text>

                    {/* Theme Name */}
                    <Text style={[styles.themeName, { color: t.colors.text }]}>
                      {t.name}
                    </Text>

                    {/* Theme Description */}
                    <Text style={[styles.themeDescription, { color: t.colors.textSecondary }]}>
                      {t.description}
                    </Text>

                    {/* Card Back Preview */}
                    <View
                      style={[
                        styles.cardBackPreview,
                        {
                          backgroundColor: t.cardBack.value,
                          borderRadius: t.buttonStyle.borderRadius,
                        },
                      ]}
                    >
                      {t.cardBack.emoji && (
                        <Text style={styles.cardBackEmoji}>{t.cardBack.emoji}</Text>
                      )}
                    </View>

                    {/* Color Palette Preview */}
                    <View style={styles.colorPalette}>
                      <View
                        style={[styles.colorSwatch, { backgroundColor: t.colors.primary }]}
                      />
                      <View
                        style={[styles.colorSwatch, { backgroundColor: t.colors.secondary }]}
                      />
                      <View
                        style={[styles.colorSwatch, { backgroundColor: t.colors.accent }]}
                      />
                    </View>

                    {/* Selected Badge */}
                    {isSelected && (
                      <View
                        style={[
                          styles.selectedBadge,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Text style={styles.selectedText}>✓ Active</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            ℹ️ About
          </Text>
          <View style={[styles.infoBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Card Wars - Premium Card Gaming
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Version 1.0.0
            </Text>
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.textSecondary, marginTop: 12 },
              ]}
            >
              Features: War, Egyptian Rat Screw, Uno, Phase 10, and Custom Games
            </Text>
          </View>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🎮 Game Modes
          </Text>
          <View style={[styles.infoBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • War - Classic battle
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • Egyptian Rat Screw - Fast slapping action
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • Uno - Match colors and numbers
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • Phase 10 - Complete all 10 phases
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • Custom Games - Create your own rules
            </Text>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  themeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  themeGradient: {
    padding: 16,
    minHeight: 200,
  },
  themeEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  cardBackPreview: {
    width: 50,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBackEmoji: {
    fontSize: 32,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 6,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
