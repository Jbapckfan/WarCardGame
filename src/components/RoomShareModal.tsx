import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { hapticService } from '../utils/hapticService';

interface RoomShareModalProps {
  visible: boolean;
  roomCode: string;
  gameType: string;
  onClose: () => void;
}

/**
 * Modal for sharing room codes with QR code and native sharing
 */
export const RoomShareModal: React.FC<RoomShareModalProps> = ({
  visible,
  roomCode,
  gameType,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const deepLink = `cardwars://join/${roomCode}`;
  const webLink = `https://cardwars.app/join/${roomCode}`; // Future web version

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(roomCode);
    await hapticService.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(deepLink);
    await hapticService.success();
    Alert.alert('Copied!', 'Deep link copied to clipboard');
  };

  const handleShare = async () => {
    await hapticService.light();
    try {
      const result = await Share.share({
        message: `Join my ${gameType} game on Card Wars! Room code: ${roomCode}\n\nOr tap this link: ${deepLink}`,
        title: `Join ${gameType} Game`,
        url: Platform.OS === 'ios' ? deepLink : undefined,
      });

      if (result.action === Share.sharedAction) {
        await hapticService.success();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share room code');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Room</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* QR Code */}
            <View style={styles.qrContainer}>
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={deepLink}
                  size={200}
                  backgroundColor="white"
                  color="#1E293B"
                  logo={require('../../assets/icon.png')}
                  logoSize={40}
                  logoBackgroundColor="white"
                  logoBorderRadius={20}
                />
              </View>
              <Text style={styles.qrLabel}>Scan to join</Text>
            </View>

            {/* Room Code Display */}
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>Room Code</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{roomCode}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.copyButton]}
                onPress={handleCopyCode}
              >
                <Text style={styles.buttonIcon}>{copied ? '✓' : '📋'}</Text>
                <Text style={styles.buttonText}>
                  {copied ? 'Copied!' : 'Copy Code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.shareButton]}
                onPress={handleShare}
              >
                <Text style={styles.buttonIcon}>📤</Text>
                <Text style={styles.buttonText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Deep Link Info */}
            <TouchableOpacity style={styles.linkSection} onPress={handleCopyLink}>
              <Text style={styles.linkLabel}>Direct Link</Text>
              <Text style={styles.linkText} numberOfLines={1}>
                {deepLink}
              </Text>
              <Text style={styles.linkHint}>Tap to copy</Text>
            </TouchableOpacity>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Share this code with friends to let them join your game!
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    width: 200,
    height: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    padding: 10,
  },
  qrLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  codeSection: {
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    letterSpacing: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#3B82F6',
  },
  shareButton: {
    backgroundColor: '#10B981',
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  linkSection: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  linkLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  linkText: {
    fontSize: 14,
    color: '#60A5FA',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  linkHint: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  instructions: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
