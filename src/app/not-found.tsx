import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-netflix-red/10 border border-netflix-red/30 flex items-center justify-center mb-6 text-netflix-red">
        <Film className="w-10 h-10" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
        Không tìm thấy phim này rồi!
      </h1>
      <p className="text-neutral-400 text-sm max-w-md mb-8">
        Có vẻ như đường dẫn tập phim bị thay đổi hoặc phim chưa cập nhật trên hệ thống. Hãy quay về trang chủ để chọn phim khác nhé.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-netflix-red hover:bg-red-700 font-semibold text-sm transition shadow-lg shadow-netflix-red/20 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Về trang chủ Ourflix</span>
      </Link>
    </div>
  );
}
