// In-app update: checks the latest GitHub release of this app and, when it is newer than the
// installed version, shows a card that downloads the new APK. Releases are published by
// .github/workflows/android-release.yml on every push to master.
import { Button, Card, IconTile, T } from "@/components/kit/core";
import { C } from "@/constants/theme";
import Constants from "expo-constants";
import React, { useEffect, useState } from "react";
import { Linking, Platform, View } from "react-native";

const REPO = "shakib-mehrab/TuitionTrack";
const LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`;
export const LATEST_APK_URL = `https://github.com/${REPO}/releases/latest/download/TuitionTrack.apk`;

type Latest = { version: string; apkUrl: string; notes: string };

/** "2.0.10" > "2.0.9" */
export function isNewer(remote: string, local: string): boolean {
  const a = remote.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const b = local.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

let cached: Latest | null | undefined; // undefined = not checked yet this session
let dismissedFor: string | null = null;

async function fetchLatest(): Promise<Latest | null> {
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(LATEST_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return (cached = null);
    const json = await res.json();
    const asset = (json.assets as { name: string; browser_download_url: string }[] | undefined)?.find((a) => a.name.endsWith(".apk"));
    cached = asset ? { version: String(json.tag_name), apkUrl: asset.browser_download_url, notes: String(json.name ?? "") } : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function UpdateCard() {
  const [latest, setLatest] = useState<Latest | null>(null);
  const installed = Constants.expoConfig?.version ?? "0.0.0";

  useEffect(() => {
    if (Platform.OS !== "android") return;
    let alive = true;
    fetchLatest().then((l) => {
      if (alive && l && isNewer(l.version, installed) && dismissedFor !== l.version) setLatest(l);
    });
    return () => {
      alive = false;
    };
  }, [installed]);

  if (!latest) return null;

  return (
    <Card style={{ padding: 16, gap: 12, borderWidth: 2, borderColor: C.primaryLine }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <IconTile icon="download" bg={C.primarySoft} fg={C.primary} />
        <View style={{ flex: 1, gap: 2 }}>
          <T w="bold" size={15}>
            Update available · {latest.version.replace(/^v?/, "v")}
          </T>
          <T size={13} color={C.muted}>
            You have v{installed}. Download the new version and tap it to install.
          </T>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button title="Download update" icon="download" style={{ flex: 1 }} onPress={() => Linking.openURL(latest.apkUrl).catch(() => {})} />
        <Button
          title="Later"
          variant="ghost"
          onPress={() => {
            dismissedFor = latest.version;
            setLatest(null);
          }}
        />
      </View>
    </Card>
  );
}
