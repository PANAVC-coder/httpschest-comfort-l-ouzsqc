import React from "react";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(log)">
        <Icon sf="plus.circle.fill" />
        <Label>Log</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(history)">
        <Icon sf="list.bullet" />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(insights)">
        <Icon sf="chart.bar.fill" />
        <Label>Insights</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
