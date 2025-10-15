import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UserDetailScreenProps {
  navigation: any;
  route: any;
}

export const UserDetailScreen: React.FC<UserDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { profile, userProfile } = route.params;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Avatar */}
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={80} color="#ccc" />
          </View>
        )}

        {/* Profile Info */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>
            {profile.full_name}, {profile.age}
          </Text>
          <Text style={styles.gender}>
            {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
          </Text>

          {/* Bio */}
          <View style={styles.bioSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>

          {/* Interests */}
          <View style={styles.interestsSection}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest: string, index: number) => {
                const isCommon = userProfile?.interests?.includes(interest);
                return (
                  <View
                    key={index}
                    style={[
                      styles.interestChip,
                      isCommon && styles.interestChipCommon,
                    ]}
                  >
                    <Text
                      style={[
                        styles.interestText,
                        { color: isCommon ? "#fff" : "#FF6B6B" },
                      ]}
                    >
                      {interest}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  avatar: {
    width: "100%",
    height: 400,
  },
  avatarPlaceholder: {
    width: "100%",
    height: 400,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    padding: 24,
    backgroundColor: "#fafafa",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  gender: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    fontWeight: "400",
  },
  bioSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  bio: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    fontWeight: "400",
  },
  interestsSection: {
    marginBottom: 32,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  interestChipCommon: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  interestText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
});
