import { Tabs } from "expo-router";
import React from "react";
import { useWindowDimensions } from "react-native";
import { BookOpen, Globe2, FolderGit2, LayoutTemplate } from "lucide-react-native";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isTabletOrWide = width >= 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#7c3aed",
        tabBarInactiveTintColor: "#a1a1aa",
        tabBarStyle: {
          backgroundColor: "#121215",
          borderTopColor: "#27272a",
          height: isTabletOrWide ? 64 : 56,
          paddingBottom: isTabletOrWide ? 8 : 4,
          paddingTop: 4,
        },
        headerStyle: {
          backgroundColor: "#121215",
          borderBottomColor: "#27272a",
          borderBottomWidth: 1,
        },
        headerTintColor: "#fafafa",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Projects",
          tabBarIcon: ({ color, size }) => <FolderGit2 color={color} size={size} />,
          headerTitle: "NovWrite Mobile Studio",
        }}
      />
      <Tabs.Screen
        name="novel"
        options={{
          title: "Prose Studio",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          headerTitle: "Prose Canvas & Scenes",
        }}
      />
      <Tabs.Screen
        name="world"
        options={{
          title: "Entities",
          tabBarIcon: ({ color, size }) => <Globe2 color={color} size={size} />,
          headerTitle: "Universe Entities Registry",
        }}
      />
      <Tabs.Screen
        name="schemas"
        options={{
          title: "Blueprints",
          tabBarIcon: ({ color, size }) => <LayoutTemplate color={color} size={size} />,
          headerTitle: "Blueprints & Schemas",
        }}
      />
    </Tabs>
  );
}
