#!/usr/bin/env node

import os from "node:os";
import { execSync } from "node:child_process";
import QRCode from "qrcode";

export function getAllIPv4Interfaces() {
  const interfaces = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        const isWifi =
          name.startsWith("wl") || name.toLowerCase().includes("wifi");
        results.push({
          name,
          address: iface.address,
          isWifi,
        });
      }
    }
  }

  // Sort Wi-Fi interfaces first, then Ethernet
  results.sort((a, b) => {
    if (a.isWifi && !b.isWifi) return -1;
    if (!a.isWifi && b.isWifi) return 1;
    return a.name.localeCompare(b.name);
  });

  return results;
}

export function getLocalIP() {
  const list = getAllIPv4Interfaces();
  if (list.length > 0) {
    return list[0].address;
  }
  return "127.0.0.1";
}

function checkAdbReverse(port) {
  try {
    const devicesOutput = execSync("adb devices", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const lines = devicesOutput.trim().split("\n").slice(1);
    const hasDevice = lines.some((l) => l.includes("\tdevice"));
    if (hasDevice) {
      execSync(`adb reverse tcp:${port} tcp:${port}`, { stdio: "ignore" });
      execSync(`adb reverse tcp:8080 tcp:8080`, { stdio: "ignore" });
      return true;
    }
  } catch {
    // adb not installed or failed
  }
  return false;
}

function checkLinuxFirewall() {
  if (process.platform !== "linux") return null;
  try {
    const status = execSync("systemctl is-active ufw", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    if (status === "active") {
      return "ufw";
    }
  } catch {
    // not active
  }
  return null;
}

async function main() {
  const port = process.env.EXPO_PORT || "8081";
  const allInterfaces = getAllIPv4Interfaces();
  const primaryIp = getLocalIP();
  const expoUrl = `exp://${primaryIp}:${port}`;
  const webUrl = `http://${primaryIp}:${port}`;
  const hasAdb = checkAdbReverse(port);
  const activeFirewall = checkLinuxFirewall();

  console.log("========================================================");
  console.log("  📱 NovWrite Mobile Studio (Expo Go Scanner)");
  console.log("========================================================");
  console.log(`  🔗 Primary Metro URL:  ${expoUrl}`);
  console.log(`  🌐 LAN Web URL:        ${webUrl}`);

  if (allInterfaces.length > 1) {
    console.log("  📡 Available Network Interfaces:");
    for (const iface of allInterfaces) {
      const tag = iface.isWifi ? "(Wi-Fi - Recommended)" : "(Ethernet/LAN)";
      console.log(
        `     • ${iface.name} ${tag}: exp://${iface.address}:${port}`,
      );
    }
  }

  if (hasAdb) {
    console.log(
      "  🔌 USB ADB Reverse: Active (exp://localhost:8081 available over USB)",
    );
  }

  console.log("  📷 Scan the QR code below with the Expo Go app:");
  console.log("--------------------------------------------------------\n");

  try {
    const qrString = await QRCode.toString(expoUrl, {
      type: "terminal",
      small: true,
    });
    console.log(qrString);
  } catch (err) {
    console.error("  ❌ Failed to render terminal QR code:", err);
  }

  console.log("--------------------------------------------------------");
  if (activeFirewall === "ufw") {
    console.log(
      "  ⚠️  Linux UFW Firewall is active! If your phone cannot connect, run:",
    );
    console.log("     👉 sudo ufw allow 8081/tcp && sudo ufw allow 8080/tcp");
    console.log(
      "     (Or allow LAN subnet: sudo ufw allow from 192.168.1.0/24)",
    );
    console.log("--------------------------------------------------------");
  }
  console.log(
    "  💡 Tip: Ensure your phone and PC are on the same Wi-Fi network.",
  );
  console.log(
    "     If your router blocks LAN connections, launch with: ./dev.sh --tunnel",
  );
  console.log("========================================================\n");
}

main();
