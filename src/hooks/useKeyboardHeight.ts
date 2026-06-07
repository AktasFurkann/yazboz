import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Tracks the on-screen keyboard height so modals can shift their content
 * above the keyboard. Works reliably on Android (where KeyboardAvoidingView
 * inside a transparent Modal does nothing) as well as iOS.
 */
export const useKeyboardHeight = (): number => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
};
