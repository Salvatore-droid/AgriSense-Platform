import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import NotificationsScreen from "@/screens/NotificationsScreen";
import FieldDetailScreen from "@/screens/FieldDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  Notifications: undefined;
  FieldDetail: { fieldId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const opaqueScreenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          ...opaqueScreenOptions,
          presentation: "modal",
          headerTitle: "Notifications",
        }}
      />
      <Stack.Screen
        name="FieldDetail"
        component={FieldDetailScreen}
        options={{
          ...opaqueScreenOptions,
          headerTitle: "Field Details",
        }}
      />
    </Stack.Navigator>
  );
}
