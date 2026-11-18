"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CoupleMessage } from "@/types";
import {
  Send,
  Heart,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Loader2,
  Sparkles,
  ChevronDown,
  Trash2,
} from "lucide-react";

const CHAT_BROADCAST_CHANNEL = "room:ourflix-chat";

const QUICK_REPLIES = [
  "Tối nay xem phim với anh nhé ❤️",
  "Biết thế chẳng hạn 🥰",
  "Đang đợi bạn nè 🍿",
  "Chọn phim này nha! ✨",
  "Yêu bạn nhiều 💕",
];

export default function CoupleChatWidget() {
  const { currentProfile } = useAuth();
  const [messages, setMessages] = useState<CoupleMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false); // Mặc định thu gọn góc màn hình để banner rộng đẹp
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const broadcastRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Tải toàn bộ tin nhắn đã lưu trên server từ API /api/chat
  const loadServerMessages = async () => {
    try {
      const res = await fetch("/api/chat", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error("Lỗi gọi /api/chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServerMessages();

    if (isSupabaseConfigured) {
      // Thiết lập WebSocket broadcast
      const broadcastChannel = supabase.channel(CHAT_BROADCAST_CHANNEL, {
        config: { broadcast: { ack: false, self: false } },
      });

      broadcastChannel
        .on("broadcast", { event: "new_chat_message" }, (payload) => {
          const incoming = payload.payload as CoupleMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        })
        .subscribe();

      // Lắng nghe Postgres changes
      const postgresChannel = supabase
        .channel("realtime:couple_messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "couple_messages" },
          (payload) => {
            const newMsg = payload.new as CoupleMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe();

      broadcastRef.current = broadcastChannel;

      return () => {
        supabase.removeChannel(broadcastChannel);
        supabase.removeChannel(postgresChannel);
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Gửi tin nhắn và lưu thật vào server
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !currentProfile || isSending) return;

    setIsSending(true);

    const tempMsg: CoupleMessage = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender_id: currentProfile.id,
      sender_name: currentProfile.name,
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText("");

    try {
      if (broadcastRef.current && isSupabaseConfigured) {
        broadcastRef.current.send({
          type: "broadcast",
          event: "new_chat_message",
          payload: tempMsg,
        });
      }

      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentProfile.id,
          sender_name: currentProfile.name,
          message: text,
        }),
      });
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearAllMessages = async () => {
    if (!confirm("Bạn có chắc muốn xóa sạch toàn bộ lịch sử tin nhắn không?")) return;
    try {
      await fetch("/api/chat", { method: "DELETE" });
      setMessages([]);
    } catch (err) {
      console.error("Lỗi xóa tin nhắn:", err);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const lastMessage = messages[messages.length - 1];
  const partnerName = currentProfile?.id === "tra-my" ? "Thiên Phát" : "Trà My";
  const partnerColor = currentProfile?.id === "tra-my" ? "#2563EB" : "#E50914";

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 select-none">
      {!isOpen ? (
        /* ============================================================== */
        /* TRẠNG THÁI THU GỌN: FLOATING PILL GÓC PHẢI DƯỚI (SIÊU GỌN & ĐẸP) */
        /* ============================================================== */
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-[#181818]/95 hover:bg-[#202020] border border-couple-pink/50 hover:border-couple-pink backdrop-blur-xl px-3.5 py-2 rounded-full shadow-2xl hover:shadow-[0_0_20px_rgba(255,51,102,0.35)] transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          {/* Avatar người yêu có chấm online */}
          <div className="relative">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
              style={{ backgroundColor: partnerColor }}
            >
              {partnerName.charAt(0)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#181818]"></span>
            </span>
          </div>

          {/* Nội dung tin nhắn gần nhất hiển thị thu nhỏ */}
          <div className="text-left max-w-[150px] sm:max-w-[200px]">
            <p className="text-[10px] text-couple-pink font-semibold flex items-center gap-1">
              <span>Hộp thư tình</span>
              <Heart className="w-2.5 h-2.5 fill-couple-pink inline" />
            </p>
            <p className="text-xs text-slate-200 truncate font-medium">
              {lastMessage ? (
                <>
                  <span className="text-neutral-400">{lastMessage.sender_name.split(" ")[0]}: </span>
                  &ldquo;{lastMessage.message}&rdquo;
                </>
              ) : (
                "Nhắn tin cho người ấy..."
              )}
            </p>
          </div>

          {/* Icon Chat phát sáng */}
          <div className="w-7 h-7 rounded-full bg-couple-pink/20 text-couple-pink flex items-center justify-center group-hover:bg-couple-pink group-hover:text-white transition">
            <MessageCircle className="w-4 h-4" />
          </div>
        </button>
      ) : (
        /* ============================================================== */
        /* TRẠNG THÁI MỞ RỘNG: HỘP CHAT NỔI HIỆN ĐẠI (KHÔNG CHIẾM BANNER) */
        /* ============================================================== */
        <div className="w-80 sm:w-96 h-[440px] bg-[#181818]/95 border border-neutral-700/90 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-fade-in text-white">
          {/* Header của Chatbox */}
          <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/80">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                style={{ backgroundColor: partnerColor }}
              >
                {partnerName.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Trò chuyện với {partnerName}</span>
                  <Heart className="w-3 h-3 text-couple-pink fill-couple-pink" />
                </h4>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Đồng bộ máy chủ thời gian thực</span>
                </p>
              </div>
            </div>

            {/* Nút thao tác: Xóa lịch sử & Thu nhỏ */}
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearAllMessages}
                  className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition"
                  title="Xóa sạch lịch sử chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                title="Thu nhỏ góc màn hình"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vùng tin nhắn cuộn */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-couple-pink" />
                <span>Đang tải tin nhắn...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-neutral-500 italic px-4">
                Chưa có tin nhắn nào. Hãy gửi lời nhắn đầu tiên cho {partnerName} nhé 💕
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = currentProfile?.id === msg.sender_id;
                const isTraMy = msg.sender_id === "tra-my";

                return (
                  <div
                    key={msg.id || msg.created_at}
                    className={`flex items-end gap-2 ${
                      isMe ? "flex-row-reverse" : "flex-row"
                    } animate-fade-in`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow"
                      style={{ backgroundColor: isTraMy ? "#E50914" : "#2563EB" }}
                    >
                      {msg.sender_name.charAt(0)}
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-2xl max-w-[80%] text-xs shadow-md ${
                        isMe
                          ? "bg-netflix-red text-white rounded-br-xs"
                          : "bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-bl-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold opacity-80">
                          {isMe ? "Bạn" : msg.sender_name}
                        </span>
                        <span className="text-[9px] opacity-60">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="leading-relaxed break-words">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Các gợi ý phản hồi nhanh */}
          <div className="px-3 py-1.5 border-t border-neutral-800/80 bg-neutral-900/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            {QUICK_REPLIES.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(reply)}
                className="px-2.5 py-0.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60 whitespace-nowrap transition active:scale-95 text-[10px]"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="p-2.5 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Nhắn cho ${partnerName}...`}
              maxLength={140}
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-couple-pink transition"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isSending}
              className="p-2 bg-couple-pink hover:bg-pink-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition active:scale-95 shadow"
            >
              {isSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
