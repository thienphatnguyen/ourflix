import { redirect, notFound } from "next/navigation";
import { getMovieDetail } from "@/lib/movieApi";

interface WatchPageProps {
  params: {
    slug: string;
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = params;
  const movie = await getMovieDetail(slug);

  if (!movie) {
    return notFound();
  }

  // Lấy tập đầu tiên từ server 1
  const firstEpisodeSlug =
    movie.episodes?.[0]?.server_data?.[0]?.slug || "tap-01";

  redirect(`/watch/${slug}/${firstEpisodeSlug}`);
}
