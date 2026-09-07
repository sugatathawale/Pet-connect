import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';
import { Alert } from 'react-native';

/** Picks images from the library, returning local URIs the app can store. */
export function useImagePicker() {
  const pickImages = useCallback(async (limit = 1): Promise<string[]> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Enable photo permission in Settings to add pictures of your pet.',
      );
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: limit > 1,
      selectionLimit: limit,
      quality: 0.7,
    });

    if (result.canceled) return [];
    return result.assets.map((asset) => asset.uri);
  }, []);

  return { pickImages };
}
