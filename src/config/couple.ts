import { Profile } from "@/types";

export const PIN_CODES: Record<string, string> = {
  "tra-my": "2409",
  "thien-phat": "3009",
};

export const PROFILES: Profile[] = [
  {
    id: "tra-my",
    name: "Trà My",
    avatarColor: "#E50914",
    pin: "2409",
  },
  {
    id: "thien-phat",
    name: "Thiên Phát",
    avatarColor: "#2563EB",
    pin: "3009",
  },
];

export const DEFAULT_ANNIVERSARY_DATE = "2025-07-25";

/**
 * Tính số ngày yêu nhau dựa vào ngày kỷ niệm (tính từ 25/07/2025)
 * Chế độ "Đếm sau 1 ngày": Sau ngày bắt đầu 24h (tròn 1 ngày) thì tính là ngày 1
 */
export function calculateLoveDays(
  anniversaryDateStr: string = DEFAULT_ANNIVERSARY_DATE,
  includeDayOne: boolean = false
): number {
  try {
    const start = new Date(anniversaryDateStr);
    const now = new Date();
    // Đặt về cùng mốc 0h để tính chính xác số ngày trôi qua theo múi giờ địa phương
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffMs = now.getTime() - start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Nếu includeDayOne = true thì tính cả ngày đầu tiên (+1 ngày)
    // Nếu đếm sau 1 ngày (mặc định) thì tính tròn số ngày đã trải qua
    const totalDays = includeDayOne ? days + 1 : days;
    return totalDays >= 0 ? totalDays : Math.abs(totalDays);
  } catch (err) {
    console.error("Lỗi tính ngày kỷ niệm:", err);
    return 481;
  }
}
