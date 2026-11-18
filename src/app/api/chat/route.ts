import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CoupleMessage } from "@/types";

const DATA_FILE = path.join(process.cwd(), "data", "messages.json");

function readServerMessages(): CoupleMessage[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content) || [];
    }
  } catch (err) {
    console.error("Lỗi đọc file server messages.json:", err);
  }
  return [];
}

function writeServerMessages(messages: CoupleMessage[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi file server messages.json:", err);
  }
}

export async function GET() {
  // 1. Thử lấy từ Supabase nếu có bảng
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("couple_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, messages: data, source: "supabase" });
      }
    } catch {
      // Bỏ qua lỗi schema cache
    }
  }

  // 2. Lấy dữ liệu đã lưu từ server local
  const messages = readServerMessages();
  return NextResponse.json({ success: true, messages, source: "server_storage" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sender_id, sender_name, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Nội dung tin nhắn trống" }, { status: 400 });
    }

    const newMessage: CoupleMessage = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender_id: sender_id || "unknown",
      sender_name: sender_name || "Người ấy",
      message: message.trim(),
      created_at: new Date().toISOString(),
    };

    // 1. Lưu ngay lập tức vào ổ đĩa server (Đảm bảo F5 hay mở máy khác cùng server không bao giờ mất)
    const currentList = readServerMessages();
    const updatedList = [...currentList, newMessage];
    writeServerMessages(updatedList);

    // 2. Ghi song song lên Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from("couple_messages").insert({
          id: newMessage.id,
          sender_id: newMessage.sender_id,
          sender_name: newMessage.sender_name,
          message: newMessage.message,
          created_at: newMessage.created_at,
        });
      } catch (err) {
        console.error("Lỗi insert Supabase couple_messages:", err);
      }
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    writeServerMessages([]);
    if (isSupabaseConfigured) {
      try {
        await supabase.from("couple_messages").delete().neq("id", "0");
      } catch {}
    }
    return NextResponse.json({ success: true, message: "Đã xóa sạch toàn bộ lịch sử tin nhắn" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
