"use client";

import { useState } from "react";
import { GameSettings as SettingsType } from "@doronuma/shared";
import { useAuth } from "../../contexts/AuthContext";

interface Props {
  roomId: string;
  settings: SettingsType;
}

export default function GameSettings({ roomId, settings }: Props) {
  const [currentSettings, setCurrentSettings] = useState<SettingsType>(settings);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const isModified = 
    currentSettings.maxPlayers !== settings.maxPlayers ||
    currentSettings.turnTimeLimit !== settings.turnTimeLimit ||
    currentSettings.interruptTimeLimit !== settings.interruptTimeLimit;

  const handleSave = async () => {
    if (!user || !isModified) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ settings: currentSettings }),
      });
      if (!response.ok) {
        throw new Error("Failed to save settings");
      }
      alert("設定を保存しました");
    } catch (error) {
      console.error(error);
      alert("設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold mb-1">募集人数</label>
        <select 
          className="w-full p-2 border rounded dark:bg-black dark:border-zinc-700"
          value={currentSettings.maxPlayers}
          onChange={(e) => setCurrentSettings({...currentSettings, maxPlayers: Number(e.target.value)})}
        >
          <option value="3">3人</option>
          <option value="4">4人</option>
          <option value="5">5人</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">自身のターン時間 (秒)</label>
        <input 
          type="number" 
          min="5" max="300"
          className="w-full p-2 border rounded dark:bg-black dark:border-zinc-700"
          value={currentSettings.turnTimeLimit}
          onChange={(e) => setCurrentSettings({...currentSettings, turnTimeLimit: Number(e.target.value)})}
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">割り込みの選択時間 (秒)</label>
        <input 
          type="number" 
          min="5" max="300"
          className="w-full p-2 border rounded dark:bg-black dark:border-zinc-700"
          value={currentSettings.interruptTimeLimit}
          onChange={(e) => setCurrentSettings({...currentSettings, interruptTimeLimit: Number(e.target.value)})}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !isModified}
        className={`w-full py-2 font-bold rounded transition-colors ${
          saving 
            ? "bg-zinc-600 text-white cursor-wait"
            : !isModified
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {saving ? "適用中..." : !isModified ? "設定は適用済みです" : "設定を適用"}
      </button>
    </div>
  );
}
