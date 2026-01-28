import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  Pressable, 
  Alert,
  TextInput,
  Modal,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  ref, 
  get, 
  set, 
  update, 
  push, 
  onValue, 
  off 
} from "firebase/database";
import { getDatabase } from "firebase/database";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";

// Define your navigation types
type RootStackParamList = {
  Control: undefined;
  Farms: undefined;
  AddFarm: undefined;
  FieldDetail: { fieldId: string };
  // Add other screens as needed
};

// Types for irrigation settings
interface IrrigationSettings {
  autoMode: boolean;
  scheduleTime: string;
  duration: number;
  selectedFieldId: string;
  lastUpdated: string;
}

// Types for Farm/Field
interface Farm {
  id: string;
  name: string;
  location: string;
  totalAcres: number;
  cropTypes: string[];
  soilType: string;
  irrigationType: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'healthy' | 'attention' | 'critical';
  sensorData?: {
    soilMoisture: number;
    pH: number;
    temperature: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    lastUpdated: string;
  };
}

// Storage key
const IRRIGATION_SETTINGS_KEY = '@agrisense_irrigation_settings';

export default function ControlScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();

  // State for farms/fields
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  
  // Irrigation control state
  const [autoMode, setAutoMode] = useState(true);
  const [scheduleTime, setScheduleTime] = useState("06:00");
  const [duration, setDuration] = useState(45);
  
  // UI state
  const [showFarmPicker, setShowFarmPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState("06:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isIrrigating, setIsIrrigating] = useState(false);
  const [nextIrrigationTime, setNextIrrigationTime] = useState("No schedule set");
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickFarmName, setQuickFarmName] = useState("");
  const [quickAddError, setQuickAddError] = useState("");
  const [realTimeSensorData, setRealTimeSensorData] = useState({
    soilMoisture: 0,
    pH: 0,
    temperature: 0
  });

  // Initialize Firebase Database
  const db = getDatabase();

  // Load saved settings and farms
  useEffect(() => {
    loadSettings();
    loadFarmsFromDatabase();
    return () => {
      // Clean up listeners if any
    };
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (!isLoading && selectedFarm) {
      saveSettings();
    }
  }, [autoMode, scheduleTime, duration, selectedFarm?.id]);

  // Listen to real-time sensor data if a farm is selected
  useEffect(() => {
    if (selectedFarm) {
      const sensorRef = ref(db, `farms/${selectedFarm.id}/sensorData`);
      
      const unsubscribe = onValue(sensorRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRealTimeSensorData({
            soilMoisture: data.soilMoisture || 0,
            pH: data.pH || 0,
            temperature: data.temperature || 0
          });
          
          // Update the farm in the list
          setFarms(prevFarms => 
            prevFarms.map(farm => 
              farm.id === selectedFarm.id 
                ? { 
                    ...farm, 
                    sensorData: {
                      soilMoisture: data.soilMoisture || 0,
                      pH: data.pH || 0,
                      temperature: data.temperature || 0,
                      nitrogen: data.nitrogen || 0,
                      phosphorus: data.phosphorus || 0,
                      potassium: data.potassium || 0,
                      lastUpdated: new Date().toISOString()
                    }
                  } 
                : farm
            )
          );
        }
      }, (error) => {
        console.error('Error listening to sensor data:', error);
      });

      return () => {
        off(sensorRef);
      };
    }
  }, [selectedFarm?.id, db]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(IRRIGATION_SETTINGS_KEY);
      if (savedSettings) {
        const settings: IrrigationSettings = JSON.parse(savedSettings);
        setAutoMode(settings.autoMode);
        setScheduleTime(settings.scheduleTime);
        setDuration(settings.duration);
      }
    } catch (error) {
      console.error('Failed to load irrigation settings:', error);
    }
  };

  const loadFarmsFromDatabase = async () => {
    try {
      setIsLoading(true);
      const farmsRef = ref(db, 'farms');
      const snapshot = await get(farmsRef);
      
      if (snapshot.exists()) {
        const farmsData = snapshot.val();
        const farmsArray: Farm[] = Object.keys(farmsData).map(key => ({
          id: key,
          ...farmsData[key]
        }));
        
        setFarms(farmsArray);
        
        // Set first farm as selected if no farm is selected
        if (farmsArray.length > 0 && !selectedFarm) {
          setSelectedFarm(farmsArray[0]);
          
          // Load default sensor data if available
          const sensorRef = ref(db, `farms/${farmsArray[0].id}/sensorData`);
          const sensorSnapshot = await get(sensorRef);
          if (sensorSnapshot.exists()) {
            const sensorData = sensorSnapshot.val();
            setRealTimeSensorData({
              soilMoisture: sensorData.soilMoisture || 0,
              pH: sensorData.pH || 0,
              temperature: sensorData.temperature || 0
            });
          }
        }
      } else {
        // No farms in database
        setFarms([]);
        setSelectedFarm(null);
      }
    } catch (error) {
      console.error('Error loading farms from database:', error);
      Alert.alert("Error", "Failed to load farms. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!selectedFarm) return;
    
    try {
      const settings: IrrigationSettings = {
        autoMode,
        scheduleTime,
        duration,
        selectedFieldId: selectedFarm.id,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(IRRIGATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save irrigation settings:', error);
    }
  };

  const handleToggleMode = (value: boolean) => {
    if (!value) {
      Alert.alert(
        "Switch to Manual Mode",
        "Manual mode disables AI-optimized irrigation. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: () => {
              setAutoMode(false);
              triggerHaptic('warning');
              Alert.alert("Manual Mode Enabled", "You're now in full control of irrigation.");
            },
          },
        ]
      );
    } else {
      setAutoMode(true);
      triggerHaptic('success');
      Alert.alert("Auto Mode Enabled", "AI-optimized irrigation is now active.");
    }
  };

  const triggerHaptic = (type: 'success' | 'warning' | 'impact') => {
    if (Platform.OS === "web") return;
    
    try {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'impact':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedFarm) {
      Alert.alert("No Farm Selected", "Please select a farm first.");
      return;
    }

    try {
      triggerHaptic('success');
      
      // Save schedule to Firebase
      const scheduleRef = ref(db, `farms/${selectedFarm.id}/irrigationSchedule`);
      await set(scheduleRef, {
        autoMode,
        scheduleTime,
        duration,
        lastUpdated: new Date().toISOString(),
        nextIrrigation: scheduleTime
      });
      
      setNextIrrigationTime(`Scheduled for ${scheduleTime}`);
      
      Alert.alert(
        "✅ Schedule Saved",
        `Irrigation scheduled for ${selectedFarm.name} at ${scheduleTime} for ${duration} minutes.`,
        [{ text: "OK", style: "default" }]
      );

    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert("Error", "Failed to save schedule. Please try again.");
    }
  };

  const handleStartNow = async () => {
    if (!selectedFarm) {
      Alert.alert("No Farm Selected", "Please select a farm first.");
      return;
    }

    Alert.alert(
      "🚀 Start Irrigation Now?",
      `This will start manual irrigation for ${selectedFarm.name} for ${duration} minutes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          style: "destructive",
          onPress: async () => {
            try {
              triggerHaptic('impact');
              setIsIrrigating(true);
              
              // Save irrigation log to Firebase
              const irrigationLogRef = push(ref(db, `farms/${selectedFarm.id}/irrigationLogs`));
              await set(irrigationLogRef, {
                mode: 'manual',
                duration,
                startTime: new Date().toISOString(),
                status: 'in_progress',
                estimatedWaterUsage: duration * 100 // liters per minute
              });
              
              // Update farm status
              const farmRef = ref(db, `farms/${selectedFarm.id}`);
              await update(farmRef, {
                status: 'attention', // Change status during irrigation
                updatedAt: new Date().toISOString()
              });
              
              setNextIrrigationTime("Now - In Progress");
              
              Alert.alert(
                "✅ Irrigation Started",
                `Manual irrigation started for ${selectedFarm.name}. Duration: ${duration} minutes.\n\nEstimated water usage: ${duration * 100} liters`,
                [{ text: "OK", style: "default" }]
              );
              
              // Simulate irrigation completion after duration
              setTimeout(async () => {
                setIsIrrigating(false);
                
                // Update irrigation log
                await update(irrigationLogRef, {
                  status: 'completed',
                  endTime: new Date().toISOString()
                });
                
                // Update farm status back
                await update(farmRef, {
                  status: 'healthy',
                  updatedAt: new Date().toISOString()
                });
                
                Alert.alert(
                  "✅ Irrigation Completed",
                  `Irrigation for ${selectedFarm.name} has been completed successfully.`
                );
                
              }, duration * 1000); // Convert minutes to milliseconds for simulation
              
            } catch (error) {
              console.error('Error starting irrigation:', error);
              Alert.alert("Error", "Failed to start irrigation. Please check your connection.");
              setIsIrrigating(false);
            }
          },
        },
      ]
    );
  };

  const handleCustomTimeSelect = () => {
    if (customTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(customTime)) {
      setScheduleTime(customTime);
      setShowTimePicker(false);
      triggerHaptic('success');
    } else {
      Alert.alert("Invalid Time", "Please enter a valid time in HH:MM format.");
    }
  };

  const handleQuickAddFarm = async () => {
    if (!quickFarmName.trim()) {
      setQuickAddError("Farm name is required");
      return;
    }

    try {
      setIsLoading(true);
      
      // Create new farm object
      const newFarm: Omit<Farm, 'id'> = {
        name: quickFarmName.trim(),
        location: "Location to be added",
        totalAcres: 0,
        cropTypes: ["Other"],
        soilType: "Other",
        irrigationType: "Manual Irrigation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'healthy'
      };
      
      // Save to Firebase Realtime Database
      const farmsRef = ref(db, 'farms');
      const newFarmRef = push(farmsRef);
      await set(newFarmRef, newFarm);
      
      const newFarmWithId: Farm = {
        id: newFarmRef.key!,
        ...newFarm
      };
      
      // Update local state
      setFarms(prev => [...prev, newFarmWithId]);
      setSelectedFarm(newFarmWithId);
      
      triggerHaptic('success');
      setShowQuickAddModal(false);
      
      Alert.alert(
        "✅ Farm Added Successfully",
        `Farm "${quickFarmName}" has been added.\n\nYou can now add more details in the Farms screen.`,
        [
          {
            text: "View Farms",
            onPress: () => {
              try {
                navigation.navigate('Farms');
              } catch (error) {
                console.error('Navigation to Farms failed:', error);
              }
            }
          },
          {
            text: "Add Details",
            onPress: () => {
              try {
                navigation.navigate('AddFarm');
              } catch (error) {
                console.error('Navigation to AddFarm failed:', error);
              }
            }
          },
          {
            text: "OK",
            style: "default",
          }
        ]
      );
      
      setQuickFarmName("");
      setQuickAddError("");
      
    } catch (error) {
      console.error("Error adding farm:", error);
      Alert.alert("❌ Error", "Failed to add farm. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const TimeButton = ({ time, selected }: { time: string; selected: boolean }) => (
    <Pressable
      onPress={() => {
        setScheduleTime(time);
        triggerHaptic('impact');
      }}
      style={[
        styles.timeButton,
        selected && styles.timeButtonSelected,
        {
          backgroundColor: selected
            ? theme.primary
            : theme.backgroundSecondary,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[styles.timeText, selected && styles.timeTextSelected]}
      >
        {time}
      </ThemedText>
    </Pressable>
  );

  const DurationButton = ({ mins, selected }: { mins: number; selected: boolean }) => (
    <Pressable
      onPress={() => {
        setDuration(mins);
        triggerHaptic('impact');
      }}
      style={[
        styles.durationButton,
        selected && styles.durationButtonSelected,
        {
          backgroundColor: selected
            ? theme.primary
            : theme.backgroundSecondary,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[styles.durationText, selected && styles.durationTextSelected]}
      >
        {mins}m
      </ThemedText>
      {selected && (
        <View style={styles.durationBadge}>
          <Feather name="check" size={12} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );

  const FieldStatusIndicator = ({ status }: { status: string }) => {
    let color = theme.success;
    if (status === 'attention') color = theme.warning;
    if (status === 'critical') color = theme.critical;

    return (
      <View style={[styles.statusDot, { backgroundColor: color }]} />
    );
  };

  // Add Farm Modal Component
  const AddFarmModal = () => (
    <Modal
      visible={showAddFarmModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddFarmModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowAddFarmModal(false)}
      >
        <Pressable 
          style={[
            styles.modalContent,
            { backgroundColor: theme.cardBackground }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="h4">Add New Farm</ThemedText>
            <Pressable onPress={() => setShowAddFarmModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          
          <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
            Choose how you want to add a farm
          </ThemedText>
          
          <View style={styles.modalOptions}>
            <Pressable
              onPress={() => {
                setShowAddFarmModal(false);
                setTimeout(() => setShowQuickAddModal(true), 100);
              }}
              style={[
                styles.modalOption,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }
              ]}
            >
              <View style={styles.optionIconContainer}>
                <Feather name="plus-circle" size={24} color={theme.primary} />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={styles.optionTitle}>Quick Add</ThemedText>
                <ThemedText style={[styles.optionDescription, { color: theme.textSecondary }]}>
                  Add a farm with just a name for now
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
            
            <Pressable
              onPress={() => {
                setShowAddFarmModal(false);
                try {
                  navigation.navigate('AddFarm');
                } catch (error) {
                  Alert.alert("Navigation Error", "Please check your navigation setup.");
                }
              }}
              style={[
                styles.modalOption,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }
              ]}
            >
              <View style={styles.optionIconContainer}>
                <Feather name="edit" size={24} color={theme.primary} />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={styles.optionTitle}>Full Details</ThemedText>
                <ThemedText style={[styles.optionDescription, { color: theme.textSecondary }]}>
                  Add all farm details including location, crops, etc.
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
          
          <View style={styles.modalButtons}>
            <Button
              onPress={() => setShowAddFarmModal(false)}
              variant="outline"
              style={styles.modalButton}
            >
              Cancel
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // Quick Add Modal Component
  const QuickAddModal = () => (
    <Modal
      visible={showQuickAddModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isLoading) {
          setShowQuickAddModal(false);
        }
      }}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => {
          if (!isLoading) {
            setShowQuickAddModal(false);
          }
        }}
      >
        <Pressable 
          style={[
            styles.modalContent,
            { backgroundColor: theme.cardBackground }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="h4">Quick Add Farm</ThemedText>
            {!isLoading && (
              <Pressable onPress={() => setShowQuickAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            )}
          </View>
          
          <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
            Enter a name for your new farm
          </ThemedText>
          
          <TextInput
            style={[
              styles.quickAddInput,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: quickAddError ? theme.critical : theme.border,
              }
            ]}
            value={quickFarmName}
            onChangeText={(text) => {
              setQuickFarmName(text);
              if (quickAddError) setQuickAddError("");
            }}
            placeholder="e.g., North Field, Main Farm, etc."
            placeholderTextColor={theme.textSecondary}
            autoFocus
            onSubmitEditing={handleQuickAddFarm}
            editable={!isLoading}
          />
          
          {quickAddError && (
            <ThemedText style={[styles.errorText, { color: theme.critical }]}>
              {quickAddError}
            </ThemedText>
          )}
          
          <View style={styles.modalButtons}>
            <Button
              onPress={() => {
                if (!isLoading) {
                  setShowQuickAddModal(false);
                }
              }}
              variant="outline"
              style={styles.modalButton}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onPress={handleQuickAddFarm}
              variant="primary"
              style={styles.modalButton}
              disabled={!quickFarmName.trim() || isLoading}
              loading={isLoading}
            >
              Add Farm
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (isLoading && !showQuickAddModal) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading farms and settings...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Add Farm Button */}
        <View style={styles.header}>
          <ThemedText type="h2" style={styles.title}>
            Irrigation Control
          </ThemedText>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowAddFarmModal(true)}
              style={[styles.addFarmButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="plus" size={18} color={theme.primary} />
              <ThemedText style={[styles.addFarmText, { color: theme.primary }]}>
                Add Farm
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert("Help", "Adjust irrigation settings for your farms.")}
              style={styles.helpButton}
            >
              <Feather name="help-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Farm Selection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Select Farm
            </ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              {farms.length} farm{farms.length !== 1 ? 's' : ''} available
            </ThemedText>
          </View>
          
          {farms.length === 0 ? (
            <Pressable
              onPress={() => setShowAddFarmModal(true)}
              style={[
                styles.noFarmsCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
                Shadows.small,
              ]}
            >
              <View style={styles.noFarmsContent}>
                <View style={[styles.noFarmsIcon, { backgroundColor: `${theme.primary}15` }]}>
                  <Feather name="map" size={28} color={theme.primary} />
                </View>
                <View style={styles.noFarmsText}>
                  <ThemedText style={styles.noFarmsTitle}>No Farms Added</ThemedText>
                  <ThemedText style={[styles.noFarmsDescription, { color: theme.textSecondary }]}>
                    Add your first farm to start controlling irrigation
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </View>
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={() => {
                  setShowFarmPicker(!showFarmPicker);
                  triggerHaptic('impact');
                }}
                style={[
                  styles.farmSelector,
                  { backgroundColor: theme.cardBackground, borderColor: theme.border },
                  Shadows.small,
                ]}
              >
                <View style={styles.farmInfo}>
                  <View style={styles.farmHeader}>
                    <ThemedText style={styles.farmName}>
                      {selectedFarm?.name || "Select a Farm"}
                    </ThemedText>
                    {selectedFarm && (
                      <FieldStatusIndicator status={selectedFarm.status} />
                    )}
                  </View>
                  {selectedFarm && (
                    <View style={styles.farmDetails}>
                      <View style={styles.farmDetail}>
                        <Feather name="map" size={12} color={theme.textSecondary} />
                        <ThemedText style={[styles.farmDetailText, { color: theme.textSecondary }]}>
                          {selectedFarm.totalAcres} acres
                        </ThemedText>
                      </View>
                      <View style={styles.farmDetail}>
                        <Feather name="droplet" size={12} color={theme.textSecondary} />
                        <ThemedText style={[styles.farmDetailText, { color: theme.textSecondary }]}>
                          {realTimeSensorData.soilMoisture}% moisture
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
                <Feather
                  name={showFarmPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>

              {showFarmPicker && (
                <View
                  style={[
                    styles.farmList,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                    Shadows.small,
                  ]}
                >
                  {farms.map((farm) => (
                    <Pressable
                      key={farm.id}
                      onPress={() => {
                        setSelectedFarm(farm);
                        setShowFarmPicker(false);
                        triggerHaptic('impact');
                      }}
                      style={[
                        styles.farmOption,
                        farm.id === selectedFarm?.id && styles.farmOptionSelected,
                      ]}
                    >
                      <View style={styles.farmOptionContent}>
                        <FieldStatusIndicator status={farm.status} />
                        <View style={styles.farmOptionInfo}>
                          <ThemedText style={styles.farmOptionName}>{farm.name}</ThemedText>
                          <ThemedText style={[styles.farmOptionDetails, { color: theme.textSecondary }]}>
                            {farm.cropTypes[0]} • {farm.totalAcres} acres
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.farmOptionRight}>
                        <ThemedText style={[styles.farmMoisture, { color: theme.textSecondary }]}>
                          {farm.sensorData?.soilMoisture || 0}%
                        </ThemedText>
                        {farm.id === selectedFarm?.id && (
                          <Feather
                            name="check"
                            size={18}
                            color={theme.primary}
                          />
                        )}
                      </View>
                    </Pressable>
                  ))}
                  
                  {/* Add New Farm Option */}
                  <Pressable
                    onPress={() => {
                      setShowFarmPicker(false);
                      setShowAddFarmModal(true);
                    }}
                    style={[
                      styles.addNewFarmOption,
                      { borderTopColor: theme.border }
                    ]}
                  >
                    <View style={styles.addNewFarmContent}>
                      <View style={[styles.addNewFarmIcon, { backgroundColor: `${theme.primary}15` }]}>
                        <Feather name="plus" size={16} color={theme.primary} />
                      </View>
                      <ThemedText style={[styles.addNewFarmText, { color: theme.primary }]}>
                        Add New Farm
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>

        {/* Real-time Sensor Data Display */}
        {selectedFarm && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Real-time Sensor Data
            </ThemedText>
            <View style={[
              styles.sensorCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
              Shadows.small,
            ]}>
              <View style={styles.sensorRow}>
                <View style={styles.sensorItem}>
                  <View style={[styles.sensorIcon, { backgroundColor: `${theme.accent}15` }]}>
                    <Feather name="droplet" size={20} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.sensorValue}>
                    {realTimeSensorData.soilMoisture}%
                  </ThemedText>
                  <ThemedText style={[styles.sensorLabel, { color: theme.textSecondary }]}>
                    Soil Moisture
                  </ThemedText>
                </View>
                <View style={styles.sensorItem}>
                  <View style={[styles.sensorIcon, { backgroundColor: `${theme.primary}15` }]}>
                    <Feather name="activity" size={20} color={theme.primary} />
                  </View>
                  <ThemedText style={styles.sensorValue}>
                    {realTimeSensorData.pH}
                  </ThemedText>
                  <ThemedText style={[styles.sensorLabel, { color: theme.textSecondary }]}>
                    pH Level
                  </ThemedText>
                </View>
                <View style={styles.sensorItem}>
                  <View style={[styles.sensorIcon, { backgroundColor: `${theme.warning}15` }]}>
                    <Feather name="thermometer" size={20} color={theme.warning} />
                  </View>
                  <ThemedText style={styles.sensorValue}>
                    {realTimeSensorData.temperature}°C
                  </ThemedText>
                  <ThemedText style={[styles.sensorLabel, { color: theme.textSecondary }]}>
                    Temperature
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.sensorNote, { color: theme.textSecondary }]}>
                Data updates in real-time from your sensors
              </ThemedText>
            </View>
          </View>
        )}

        {/* Irrigation Mode Section */}
        {selectedFarm && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Irrigation Mode
              </ThemedText>
              <View style={styles.modeBadge}>
                <ThemedText style={[
                  styles.modeBadgeText,
                  { color: autoMode ? theme.success : theme.warning }
                ]}>
                  {autoMode ? "AI OPTIMIZED" : "MANUAL"}
                </ThemedText>
              </View>
            </View>
            
            <View style={[
              styles.modeCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
              Shadows.small,
            ]}>
              <View style={styles.modeContent}>
                <View style={styles.modeInfo}>
                  <Feather 
                    name={autoMode ? "cpu" : "sliders"} 
                    size={24} 
                    color={autoMode ? theme.success : theme.warning} 
                  />
                  <View style={styles.modeText}>
                    <ThemedText style={styles.modeTitle}>
                      {autoMode ? "AI-Optimized Mode" : "Manual Control"}
                    </ThemedText>
                    <ThemedText style={[styles.modeDescription, { color: theme.textSecondary }]}>
                      {autoMode 
                        ? "AI automatically adjusts based on weather and soil data" 
                        : "You control all irrigation settings manually"}
                    </ThemedText>
                  </View>
                </View>
                
                <Switch
                  value={autoMode}
                  onValueChange={handleToggleMode}
                  trackColor={{
                    false: theme.backgroundTertiary,
                    true: theme.primary,
                  }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={theme.backgroundTertiary}
                  disabled={!selectedFarm}
                />
              </View>
            </View>
          </View>
        )}

        {/* Schedule Time Section */}
        {selectedFarm && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Schedule Time
              </ThemedText>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={styles.customTimeButton}
              >
                <Feather name="clock" size={14} color={theme.textSecondary} />
                <ThemedText style={[styles.customTimeText, { color: theme.textSecondary }]}>
                  Custom
                </ThemedText>
              </Pressable>
            </View>
            
            <View style={styles.timeGrid}>
              {["05:00", "06:00", "07:00", "18:00", "19:00", "20:00"].map((time) => (
                <TimeButton key={time} time={time} selected={scheduleTime === time} />
              ))}
            </View>
          </View>
        )}

        {/* Duration Section */}
        {selectedFarm && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Duration
            </ThemedText>
            <View style={styles.durationGrid}>
              {[15, 30, 45, 60, 90].map((mins) => (
                <DurationButton key={mins} mins={mins} selected={duration === mins} />
              ))}
            </View>
            <ThemedText style={[styles.durationHint, { color: theme.textSecondary }]}>
              Estimated water usage: ~{Math.round(duration * 100)} liters
            </ThemedText>
          </View>
        )}

        {/* Status Card */}
        {selectedFarm && (
          <View style={styles.section}>
            <View style={[
              styles.statusCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
              Shadows.small,
            ]}>
              <View style={styles.statusIcon}>
                <Feather
                  name={isIrrigating ? "play-circle" : "clock"}
                  size={28}
                  color={isIrrigating ? theme.success : theme.primary}
                />
              </View>
              <View style={styles.statusInfo}>
                <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>
                  {isIrrigating ? "Currently Irrigating" : "Next Scheduled Irrigation"}
                </ThemedText>
                <ThemedText type="h3">{nextIrrigationTime}</ThemedText>
                <ThemedText style={[styles.statusField, { color: theme.textSecondary }]}>
                  for {selectedFarm.name}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Floating Action Buttons */}
      {selectedFarm && (
        <View
          style={[
            styles.floatingActions,
            {
              backgroundColor: theme.backgroundRoot,
              borderTopColor: theme.border,
            },
          ]}
        >
          <Button
            onPress={handleStartNow}
            variant="outline"
            icon={isIrrigating ? "pause" : "play"}
            style={styles.secondaryButton}
            disabled={isIrrigating}
          >
            {isIrrigating ? "Stop" : "Start Now"}
          </Button>
          <Button
            onPress={handleSaveSchedule}
            variant="primary"
            icon="save"
            style={styles.primaryButton}
            disabled={isIrrigating}
          >
            Save Schedule
          </Button>
        </View>
      )}

      {/* Custom Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable 
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Custom Time</ThemedText>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            
            <TextInput
              style={[
                styles.timeInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              value={customTime}
              onChangeText={setCustomTime}
              placeholder="HH:MM"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            
            <View style={styles.modalButtons}>
              <Button
                onPress={() => setShowTimePicker(false)}
                variant="outline"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleCustomTimeSelect}
                variant="primary"
                style={styles.modalButton}
              >
                Set Time
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Farm Modal */}
      <AddFarmModal />
      
      {/* Quick Add Modal */}
      <QuickAddModal />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    marginTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    flex: 1,
  },
  addFarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addFarmText: {
    fontSize: 13,
    fontWeight: '600',
  },
  helpButton: {
    padding: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    // Style handled by ThemedText
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  noFarmsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noFarmsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  noFarmsIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noFarmsText: {
    flex: 1,
  },
  noFarmsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noFarmsDescription: {
    fontSize: 13,
  },
  farmSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  farmInfo: {
    flex: 1,
  },
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
  },
  farmDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  farmDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  farmDetailText: {
    fontSize: 12,
  },
  farmList: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  farmOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  farmOptionSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  farmOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  farmOptionInfo: {
    flex: 1,
  },
  farmOptionName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  farmOptionDetails: {
    fontSize: 12,
  },
  farmOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  farmMoisture: {
    fontSize: 13,
    fontWeight: '600',
  },
  addNewFarmOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  addNewFarmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  addNewFarmIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewFarmText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sensorCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sensorItem: {
    alignItems: 'center',
    flex: 1,
  },
  sensorIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  sensorLabel: {
    fontSize: 12,
  },
  sensorNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  modeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  modeText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 13,
  },
  customTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.xs,
  },
  customTimeText: {
    fontSize: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  timeButtonSelected: {
    ...Shadows.small,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeTextSelected: {
    color: '#FFFFFF',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  durationButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
    position: 'relative',
  },
  durationButtonSelected: {
    ...Shadows.small,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationTextSelected: {
    color: '#FFFFFF',
  },
  durationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  durationHint: {
    fontSize: 12,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusField: {
    fontSize: 13,
    marginTop: 2,
  },
  floatingActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  secondaryButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  modalOptions: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  quickAddInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});