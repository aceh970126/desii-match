import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ImageUploaderProps {
  imageUri?: string;
  onImageSelected: (uri: string) => void;
  title?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUri,
  onImageSelected,
  title = "Upload Image",
}) => {
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "📷 Camera Roll Permission Required",
        "We need access to your photo library to upload images. Please enable this permission in your device settings.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Open Settings",
            style: "default",
            onPress: () => {
              // In a real app, you might want to open device settings
              console.log("Open device settings");
            },
          },
        ]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    console.log("ImageUploader: Starting image picker from library");
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.log("ImageUploader: Permission denied");
      return;
    }

    try {
      console.log("ImageUploader: ImagePicker object:", ImagePicker);

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("ImageUploader: Image picker result:", result);

      if (!result.canceled && result.assets[0]) {
        console.log("ImageUploader: Image selected:", result.assets[0].uri);
        onImageSelected(result.assets[0].uri);
      } else {
        console.log("ImageUploader: Image selection canceled or no assets");
      }
    } catch (error) {
      console.error("ImageUploader: Error picking image:", error);
      Alert.alert(
        "❌ Image Selection Failed",
        "We couldn't load your selected image. Please try again or select a different photo.",
        [
          {
            text: "OK",
            style: "default",
          },
        ]
      );
    }
  };

  const takePhoto = async () => {
    console.log("ImageUploader: Starting camera");
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      console.log("ImageUploader: Camera permission denied");
      Alert.alert(
        "📸 Camera Permission Required",
        "We need access to your camera to take photos. Please enable this permission in your device settings.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Open Settings",
            style: "default",
            onPress: () => {
              // In a real app, you might want to open device settings
              console.log("Open device settings");
            },
          },
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("ImageUploader: Camera result:", result);

      if (!result.canceled && result.assets[0]) {
        console.log("ImageUploader: Photo taken:", result.assets[0].uri);
        onImageSelected(result.assets[0].uri);
      } else {
        console.log("ImageUploader: Photo canceled or no assets");
      }
    } catch (error) {
      console.error("ImageUploader: Error taking photo:", error);
      Alert.alert(
        "❌ Camera Failed",
        "We couldn't take your photo. Please try again or use the photo library instead.",
        [
          {
            text: "OK",
            style: "default",
          },
        ]
      );
    }
  };

  const showImagePicker = () => {
    console.log("ImageUploader: Showing image picker options");
    Alert.alert(
      "📷 Add Your Photo",
      "Choose how you'd like to add your avatar photo",
      [
        {
          text: "📸 Take Photo",
          onPress: takePhoto,
        },
        {
          text: "🖼️ Photo Library",
          onPress: pickImage,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity style={styles.uploadButton} onPress={showImagePicker}>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.overlay}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.overlayText}>Change Photo</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera" size={48} color="#ccc" />
            <Text style={styles.placeholderText}>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  uploadButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  overlayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: "#ccc",
    fontWeight: "500",
  },
});
