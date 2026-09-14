import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TextProps,
  TextInputProps,
  TextStyle,
} from 'react-native';

export const Fonts = {
  light: 'CeraPro-Light',
  regular: 'CeraPro-Medium',
  medium: 'CeraPro-Medium',
  bold: 'CeraPro-Bold',
  black: 'CeraPro-Black',
  italic: 'CeraPro-Italic',
} as const;

export type FontFamilyToken = (typeof Fonts)[keyof typeof Fonts];

/**
 * Resolves the appropriate Cera Pro font variant based on the element's existing styles.
 * If a custom fontFamily is already explicitly declared (e.g. icon fonts, monospace, reader fonts),
 * it returns null to preserve it without interference.
 */
export function resolveCeraFont(style: StyleProp<TextStyle>): {
  fontFamily: string;
  fontWeight?: TextStyle['fontWeight'];
} | null {
  const flattened = StyleSheet.flatten(style);
  if (flattened && flattened.fontFamily) {
    // Keep custom fonts (Feather, Ionicons, SpaceMono, Georgia, etc.) intact
    return null;
  }

  const weight = flattened?.fontWeight;
  const isItalic = flattened?.fontStyle === 'italic';

  let fontFamily: string = Fonts.regular;
  if (isItalic) {
    fontFamily = Fonts.italic;
  } else if (weight === 'bold' || weight === '700' || weight === '600') {
    fontFamily = Fonts.bold;
  } else if (weight === '800' || weight === '900') {
    fontFamily = Fonts.black;
  } else if (weight === '300' || weight === '100' || weight === '200') {
    fontFamily = Fonts.light;
  }

  // On Android, combining a custom font family file with fontWeight: 'bold'
  // causes Android to search for synthesized 'Font_bold' files that don't exist.
  // Setting fontWeight: 'normal' ensures correct rendering of the custom font glyphs.
  return {
    fontFamily,
    ...(Platform.OS === 'android' && weight ? { fontWeight: 'normal' } : {}),
  };
}

let isPatched = false;

/**
 * Patches React Native's Text and TextInput globally so that all screens, modals,
 * and components default to Cera Pro without requiring manual refactoring of every file.
 */
export function initGlobalTypography(): void {
  if (isPatched) return;
  isPatched = true;

  try {
    const ReactNative = require('react-native');
    const OriginalText = ReactNative.Text;
    const OriginalTextInput = ReactNative.TextInput;

    if (!OriginalText || !OriginalTextInput) return;

    const CustomText = React.forwardRef<RNText, TextProps>((props, ref) => {
      const fontOverride = resolveCeraFont(props.style);
      if (!fontOverride) {
        return <OriginalText {...props} ref={ref} />;
      }

      return (
        <OriginalText
          {...props}
          ref={ref}
          style={[props.style, fontOverride]}
        />
      );
    });

    (CustomText as any).displayName = 'Text';
    Object.assign(CustomText, OriginalText);

    const CustomTextInput = React.forwardRef<RNTextInput, TextInputProps>((props, ref) => {
      const fontOverride = resolveCeraFont(props.style);
      if (!fontOverride) {
        return <OriginalTextInput {...props} ref={ref} />;
      }

      return (
        <OriginalTextInput
          {...props}
          ref={ref}
          style={[props.style, fontOverride]}
        />
      );
    });

    (CustomTextInput as any).displayName = 'TextInput';
    Object.assign(CustomTextInput, OriginalTextInput);

    Object.defineProperty(ReactNative, 'Text', {
      get() {
        return CustomText;
      },
      configurable: true,
      enumerable: true,
    });

    Object.defineProperty(ReactNative, 'TextInput', {
      get() {
        return CustomTextInput;
      },
      configurable: true,
      enumerable: true,
    });
  } catch (error) {
    console.warn('[Typography] Failed to initialize global typography:', error);
  }
}

// Initialize immediately upon import
initGlobalTypography();
