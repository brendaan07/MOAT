// Asks before a destructive action. Alert.alert is a no-op on react-native-web, so web asks with the browser's own confirm.
import { Alert, Platform } from 'react-native';

/** Runs onConfirm only if the learner agrees; confirmLabel is the native dialog's destructive button. */
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
