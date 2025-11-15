import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameTemplate, GAME_TEMPLATES } from '../types/customGame';

interface CustomGameCreatorScreenProps {
  onStartCustomGame: (template: GameTemplate) => void;
  onExit: () => void;
}

export const CustomGameCreatorScreen: React.FC<CustomGameCreatorScreenProps> = ({
  onStartCustomGame,
  onExit,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const handleTemplateSelect = (template: GameTemplate) => {
    setSelectedTemplate(template);
    if (Object.keys(template.customizable).length > 0) {
      // Has customization options
      setShowCustomizer(true);
    } else {
      // No customization, start immediately
      onStartCustomGame(template);
    }
  };

  const handleStartGame = () => {
    if (selectedTemplate) {
      onStartCustomGame(selectedTemplate);
      setShowCustomizer(false);
    }
  };

  const updateTemplate = (field: string, value: any) => {
    if (!selectedTemplate) return;

    const updated = { ...selectedTemplate };
    (updated as any)[field] = value;
    setSelectedTemplate(updated);
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E1B4B', '#312E81']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onExit}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🎲 Create Custom Game</Text>
          <Text style={styles.subtitle}>Choose a template to start</Text>
        </View>
      </View>

      {/* Templates Grid */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.templatesGrid}>
        {GAME_TEMPLATES.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => handleTemplateSelect(template)}
          >
            <LinearGradient
              colors={['#1F2937', '#374151']}
              style={styles.templateGradient}
            >
              <Text style={styles.templateEmoji}>{template.emoji}</Text>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateDescription}>{template.description}</Text>

              {/* Rules Preview */}
              <View style={styles.rulesPreview}>
                {template.rules.slice(0, 2).map((rule, idx) => (
                  <Text key={idx} style={styles.rulePreviewText}>
                    • {rule}
                  </Text>
                ))}
              </View>

              {/* Customizable Badge */}
              {Object.keys(template.customizable).length > 0 && (
                <View style={styles.customizableBadge}>
                  <Text style={styles.badgeText}>⚙️ Customizable</Text>
                </View>
              )}

              <View style={styles.playButton}>
                <Text style={styles.playButtonText}>Play →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Coming Soon Card */}
        <View style={[styles.templateCard, styles.comingSoonCard]}>
          <LinearGradient colors={['#4C1D95', '#5B21B6']} style={styles.templateGradient}>
            <Text style={styles.templateEmoji}>✨</Text>
            <Text style={styles.templateName}>More Coming Soon!</Text>
            <Text style={styles.templateDescription}>
              Describe your own game in natural language
            </Text>
            <Text style={styles.aiHintText}>
              "Like Uno but you match suits..."
            </Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.badgeText}>🚀 AI-Powered</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Customizer Modal */}
      <Modal visible={showCustomizer} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.customizerModal}>
            {selectedTemplate && (
              <>
                <Text style={styles.customizerTitle}>
                  {selectedTemplate.emoji} Customize {selectedTemplate.name}
                </Text>

                <ScrollView style={styles.customOptions}>
                  {/* Starting Cards Option */}
                  {selectedTemplate.customizable.startingCards && (
                    <View style={styles.optionGroup}>
                      <Text style={styles.optionLabel}>Starting Cards:</Text>
                      <View style={styles.optionButtons}>
                        {selectedTemplate.customizable.startingCards.map((count) => (
                          <TouchableOpacity
                            key={count}
                            style={[
                              styles.optionButton,
                              selectedTemplate.startingCards === count && styles.optionButtonActive,
                            ]}
                            onPress={() => updateTemplate('startingCards', count)}
                          >
                            <Text
                              style={[
                                styles.optionButtonText,
                                selectedTemplate.startingCards === count &&
                                  styles.optionButtonTextActive,
                              ]}
                            >
                              {count}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Draw Count Option */}
                  {selectedTemplate.customizable.drawCount && (
                    <View style={styles.optionGroup}>
                      <Text style={styles.optionLabel}>Cards to Draw:</Text>
                      <View style={styles.optionButtons}>
                        {selectedTemplate.customizable.drawCount.map((count) => (
                          <TouchableOpacity
                            key={count}
                            style={[
                              styles.optionButton,
                              selectedTemplate.drawCount === count && styles.optionButtonActive,
                            ]}
                            onPress={() => updateTemplate('drawCount', count)}
                          >
                            <Text
                              style={[
                                styles.optionButtonText,
                                selectedTemplate.drawCount === count &&
                                  styles.optionButtonTextActive,
                              ]}
                            >
                              {count}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Match Rule Option */}
                  {selectedTemplate.customizable.matchRule && (
                    <View style={styles.optionGroup}>
                      <Text style={styles.optionLabel}>Match Rule:</Text>
                      <View style={styles.optionButtons}>
                        {selectedTemplate.customizable.matchRule.map((rule) => (
                          <TouchableOpacity
                            key={rule}
                            style={[
                              styles.optionButton,
                              styles.wideOptionButton,
                              selectedTemplate.matchRule === rule && styles.optionButtonActive,
                            ]}
                            onPress={() => updateTemplate('matchRule', rule)}
                          >
                            <Text
                              style={[
                                styles.optionButtonText,
                                selectedTemplate.matchRule === rule &&
                                  styles.optionButtonTextActive,
                              ]}
                            >
                              {rule.replace('_', ' ')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
                    <Text style={styles.startButtonText}>Start Game →</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowCustomizer(false);
                      setSelectedTemplate(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    color: '#A78BFA',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  scrollView: {
    flex: 1,
  },
  templatesGrid: {
    padding: 16,
    gap: 16,
  },
  templateCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  templateGradient: {
    padding: 20,
  },
  templateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  templateName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  rulesPreview: {
    marginBottom: 16,
  },
  rulePreviewText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  customizableBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#C4B5FD',
    fontWeight: '600',
  },
  playButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comingSoonCard: {
    opacity: 0.7,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  aiHintText: {
    fontSize: 14,
    color: '#A78BFA',
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  customizerModal: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  customizerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  customOptions: {
    marginBottom: 20,
  },
  optionGroup: {
    marginBottom: 24,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  wideOptionButton: {
    minWidth: 120,
  },
  optionButtonText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    gap: 12,
  },
  startButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
