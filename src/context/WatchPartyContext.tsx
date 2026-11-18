"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface WatchPartyEvent {
  type: "play" | "pause" | "seek" | "change_episode";
  sender: string;
  senderId: string;
  time: number;
  episodeSlug?: string;
  movieSlug?: string;
  timestamp: number;
}

interface ToastMessage {
  id: string;
  text: string;
  sender: string;
}

interface WatchPartyContextType {
  isWatchPartyActive: boolean;
  toggleWatchParty: () => void;
  sendBroadcast: (data: Omit<WatchPartyEvent, "sender" | "senderId" | "timestamp">) => void;
  lastRemoteEvent: WatchPartyEvent | null;
  toasts: ToastMessage[];
  clearToast: (id: string) => void;
}

const WatchPartyContext = createContext<WatchPartyContextType | undefined>(undefined);

const CHANNEL_NAME = "room:ourflix-watch-party";

export function WatchPartyProvider({ children }: { children: ReactNode }) {
  const { currentProfile } = useAuth();
  const [isWatchPartyActive, setIsWatchPartyActive] = useState<boolean>(true);
  const [lastRemoteEvent, setLastRemoteEvent] = useState<WatchPartyEvent | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addToast = (text: string, sender: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, text, sender }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const clearToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Khởi tạo Supabase Broadcast Channel
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel(CHANNEL_NAME, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    channel
      .on("broadcast", { event: "player_sync" }, (payload) => {
        const eventData = payload.payload as WatchPartyEvent;
        // Bỏ qua sự kiện nếu Watch Party đang tắt hoặc người gửi là chính mình
        if (!isWatchPartyActive) return;
        if (currentProfile && eventData.senderId === currentProfile.id) return;

        // Xử lý tạo thông báo tương ứng cho người xem
        let message = "";
        const senderName = eventData.sender || "Người ấy";

        switch (eventData.type) {
          case "play":
            message = `${senderName} vừa bấm tiếp tục phát video ▶`;
            break;
          case "pause":
            message = `${senderName} vừa tạm dừng video ⏸`;
            break;
          case "seek": {
            const minutes = Math.floor(eventData.time / 60);
            const seconds = Math.floor(eventData.time % 60);
            const formatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
            message = `${senderName} đã tua đến ${formatted} ⏩`;
            break;
          }
          case "change_episode":
            message = `${senderName} vừa chuyển sang tập mới ⏭`;
            break;
        }

        if (message) {
          addToast(message, senderName);
        }

        setLastRemoteEvent(eventData);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Channel đã kết nối realtime
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isWatchPartyActive, currentProfile]);

  const toggleWatchParty = () => {
    setIsWatchPartyActive((prev) => !prev);
  };

  const sendBroadcast = (data: Omit<WatchPartyEvent, "sender" | "senderId" | "timestamp">) => {
    if (!isWatchPartyActive || !isSupabaseConfigured || !channelRef.current || !currentProfile) {
      return;
    }

    const payload: WatchPartyEvent = {
      ...data,
      sender: currentProfile.name,
      senderId: currentProfile.id,
      timestamp: Date.now(),
    };

    channelRef.current.send({
      type: "broadcast",
      event: "player_sync",
      payload,
    });
  };

  return (
    <WatchPartyContext.Provider
      value={{
        isWatchPartyActive,
        toggleWatchParty,
        sendBroadcast,
        lastRemoteEvent,
        toasts,
        clearToast,
      }}
    >
      {children}

      {/* Hiển thị toast thông báo đồng bộ realtime góc trên bên phải */}
      <div className="fixed top-20 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-netflix-card/95 border border-couple-pink/40 text-white px-4 py-2.5 rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in text-sm"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-couple-pink opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-couple-pink"></span>
            </span>
            <span className="font-medium text-slate-100">{toast.text}</span>
          </div>
        ))}
      </div>
    </WatchPartyContext.Provider>
  );
}

export function useWatchParty() {
  const context = useContext(WatchPartyContext);
  if (!context) {
    throw new Error("useWatchParty phải được dùng trong WatchPartyProvider");
  }
  return context;
}
