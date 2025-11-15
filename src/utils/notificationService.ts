import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
  let token;

  if (Platform.OS === 'ios') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
};

export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'game-updates',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Failed to send push notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

export const sendRichGameNotification = async (
  expoPushToken: string,
  gameState: {
    opponentName: string;
    yourCards: number;
    opponentCards: number;
    lastAction: string;
    isYourTurn: boolean;
  }
) => {
  const title = gameState.isYourTurn
    ? `🎴 Your turn vs ${gameState.opponentName}`
    : `⏳ Waiting for ${gameState.opponentName}`;

  const body = `${gameState.lastAction}\nYou: ${gameState.yourCards} cards | ${gameState.opponentName}: ${gameState.opponentCards} cards`;

  await sendPushNotification(expoPushToken, title, body, {
    type: 'game-update',
    ...gameState,
  });
};

export const sendReminderNotification = async (
  expoPushToken: string,
  opponentName: string,
  hoursSinceLastMove: number
) => {
  const title = `⏰ Game waiting for you!`;
  const body = `${opponentName} is waiting for your move (${hoursSinceLastMove}h ago)`;

  await sendPushNotification(expoPushToken, title, body, {
    type: 'reminder',
  });
};

export const scheduleLocalNotification = async (
  title: string,
  body: string,
  seconds: number = 0
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: seconds > 0 ? { seconds } : null,
  });
};
