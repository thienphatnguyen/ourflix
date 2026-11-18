import React from "react";
import { notFound } from "next/navigation";
import { getMovieDetail } from "@/lib/movieApi";
import Player from "@/components/Player";

interface WatchEpisodePageProps {
  params: {
    slug: string;
    episodeSlug: string;
  };
}

export default async function WatchEpisodePage({ params }: WatchEpisodePageProps) {
  const { slug, episodeSlug } = params;
  const movie = await getMovieDetail(slug);

  if (!movie) {
    return notFound();
  }

  return <Player movie={movie} initialEpisodeSlug={episodeSlug} />;
}
