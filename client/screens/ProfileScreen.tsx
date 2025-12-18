import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { mockKPIs } from "@/lib/mockData";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [useMetric, setUseMetric] = useState(true);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => {} },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "Type DELETE to confirm account deletion. This is irreversible.",
              [{ text: "Cancel", style: "cancel" }]
            );
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    toggle,
    toggleValue,
    onToggle,
    danger,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    toggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
    danger?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: theme.border }]}
      disabled={toggle}
    >
      <View style={styles.settingLeft}>
        <Feather
          name={icon}
          size={20}
          color={danger ? (isDark ? Colors.dark.critical : Colors.light.critical) : theme.text}
        />
        <ThemedText
          style={[
            styles.settingLabel,
            danger && { color: isDark ? Colors.dark.critical : Colors.light.critical },
          ]}
        >
          {label}
        </ThemedText>
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{
            false: theme.backgroundTertiary,
            true: isDark ? Colors.dark.primary : Colors.light.primary,
          }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <View style={styles.settingRight}>
          {value ? (
            <ThemedText style={[styles.settingValue, { color: theme.textSecondary }]}>
              {value}
            </ThemedText>
          ) : null}
          <Feather name="chevron-right" size={18} color={theme.textSecondary} />
        </View>
      )}
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h2" style={styles.title}>
          Profile
        </ThemedText>

        <View style={styles.profileCard}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary },
            ]}
          >
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="h3">Green Valley Farms</ThemedText>
            <ThemedText style={[styles.profileRole, { color: theme.textSecondary }]}>
              Farm Manager
            </ThemedText>
            <View style={styles.profileMeta}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.profileLocation, { color: theme.textSecondary }]}>
                Central Valley, CA
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Impact Dashboard
          </ThemedText>
          <View
            style={[
              styles.impactGrid,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.impactItem}>
              <View
                style={[
                  styles.impactIcon,
                  { backgroundColor: `${isDark ? Colors.dark.accent : Colors.light.accent}15` },
                ]}
              >
                <Feather
                  name="droplet"
                  size={20}
                  color={isDark ? Colors.dark.accent : Colors.light.accent}
                />
              </View>
              <ThemedText type="h3" style={styles.impactValue}>
                {(mockKPIs.totalWaterSaved / 1000).toFixed(0)}K
              </ThemedText>
              <ThemedText style={[styles.impactLabel, { color: theme.textSecondary }]}>
                Liters Saved
              </ThemedText>
            </View>

            <View style={[styles.impactDivider, { backgroundColor: theme.border }]} />

            <View style={styles.impactItem}>
              <View
                style={[
                  styles.impactIcon,
                  { backgroundColor: `${isDark ? Colors.dark.success : Colors.light.success}15` },
                ]}
              >
                <Feather
                  name="trending-up"
                  size={20}
                  color={isDark ? Colors.dark.success : Colors.light.success}
                />
              </View>
              <ThemedText type="h3" style={styles.impactValue}>
                {mockKPIs.yieldImprovement}%
              </ThemedText>
              <ThemedText style={[styles.impactLabel, { color: theme.textSecondary }]}>
                Yield Increase
              </ThemedText>
            </View>

            <View style={[styles.impactDivider, { backgroundColor: theme.border }]} />

            <View style={styles.impactItem}>
              <View
                style={[
                  styles.impactIcon,
                  { backgroundColor: `${isDark ? Colors.dark.primary : Colors.light.primary}15` },
                ]}
              >
                <Feather
                  name="wind"
                  size={20}
                  color={isDark ? Colors.dark.primary : Colors.light.primary}
                />
              </View>
              <ThemedText type="h3" style={styles.impactValue}>
                {mockKPIs.co2Reduced}
              </ThemedText>
              <ThemedText style={[styles.impactLabel, { color: theme.textSecondary }]}>
                kg CO2 Reduced
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Farm Portfolio
          </ThemedText>
          <View
            style={[
              styles.farmCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.farmRow}>
              <View>
                <ThemedText style={styles.farmName}>Green Valley Farms</ThemedText>
                <ThemedText style={[styles.farmDetails, { color: theme.textSecondary }]}>
                  4 fields | 180 acres
                </ThemedText>
              </View>
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: `${isDark ? Colors.dark.success : Colors.light.success}15` },
                ]}
              >
                <ThemedText
                  style={[
                    styles.activeBadgeText,
                    { color: isDark ? Colors.dark.success : Colors.light.success },
                  ]}
                >
                  ACTIVE
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Settings
          </ThemedText>
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <SettingRow
              icon="bell"
              label="Notifications"
              toggle
              toggleValue={notificationsEnabled}
              onToggle={setNotificationsEnabled}
            />
            <SettingRow
              icon="sliders"
              label="Units"
              value={useMetric ? "Metric" : "Imperial"}
              toggle
              toggleValue={useMetric}
              onToggle={setUseMetric}
            />
            <SettingRow icon="globe" label="Language" value="English" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <SettingRow icon="shield" label="Privacy Policy" onPress={() => {}} />
            <SettingRow icon="file-text" label="Terms of Service" onPress={() => {}} />
            <SettingRow icon="help-circle" label="Help & Support" onPress={() => {}} />
            <SettingRow icon="log-out" label="Log Out" onPress={handleLogout} />
            <SettingRow
              icon="trash-2"
              label="Delete Account"
              onPress={handleDeleteAccount}
              danger
            />
          </View>
        </View>

        <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
          AgriSense v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xl,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    gap: Spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 72,
    height: 72,
  },
  profileInfo: {
    flex: 1,
  },
  profileRole: {
    fontSize: 14,
    marginTop: 2,
  },
  profileMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  profileLocation: {
    fontSize: 13,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  impactGrid: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  impactItem: {
    flex: 1,
    alignItems: "center",
  },
  impactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  impactValue: {
    marginBottom: 2,
  },
  impactLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  impactDivider: {
    width: 1,
    marginHorizontal: Spacing.md,
  },
  farmCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  farmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  farmName: {
    fontSize: 16,
    fontWeight: "500",
  },
  farmDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  settingsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingValue: {
    fontSize: 14,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: Spacing.lg,
  },
});
