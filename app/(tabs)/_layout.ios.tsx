import React from "react";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(graph)">
        <Icon sf="chart.line.uptrend.xyaxis" />
        <Label>Graph</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(track)">
        <Icon sf="plus.circle.fill" />
        <Label>Track</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(chat)">
        <Icon sf="bubble.left.and.bubble.right.fill" />
        <Label>AI Chat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(reports)">
        <Icon sf="doc.text.fill" />
        <Label>Reports</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(allergy)">
        <Icon sf="allergens" />
        <Label>Allergy</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
