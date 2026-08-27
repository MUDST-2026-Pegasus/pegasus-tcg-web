import { useEffect, useState } from "react";

import { HomeContent } from "@/features/home/components/HomeContent";
import { HomePageSkeleton } from "@/features/home/components/HomePageSkeleton";
import { HOME_FIGMA_FIXTURE } from "@/features/home/home.fixture";

const INITIAL_SKELETON_DURATION_MS = 800;

export function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setIsLoading(false),
      INITIAL_SKELETON_DURATION_MS,
    );

    return () => window.clearTimeout(timeout);
  }, []);

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  return <HomeContent data={HOME_FIGMA_FIXTURE} />;
}
