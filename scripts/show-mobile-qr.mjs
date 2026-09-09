#!/usr/bin/env node

import os from "node:os";
import QRCode from "qrcode";

export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

async function main() {
  const ip = getLocalIP();
  const port = process.env.EXPO_PORT || "8081";
  const expoUrl = `exp://${ip}:${port}`;
  const webUrl = `http://${ip}:${port}`;

  console.log("========================================================");
  console.log("  📱 NovWrite Mobile Studio (Expo Go Scanner)");
  console.log("========================================================");
  console.log(`  🔗 Metro URL:  ${expoUrl}`);
  console.log(`  🌐 LAN Web:    ${webUrl}`);
  console.log("  📷 Scan the QR code below with the Expo Go app:");
  console.log("--------------------------------------------------------\n");

  try {
    const qrString = await QRCode.toString(expoUrl, { type: "terminal", small: true });
    console.log(qrString);
  } catch (err) {
    console.error("  ❌ Failed to render terminal QR code:", err);
  }

  console.log("--------------------------------------------------------");
  console.log("  💡 Tip: Open Expo Go on iOS/Android and scan the QR.");
  console.log("========================================================\n");
}

main();
