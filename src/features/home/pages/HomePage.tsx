import { HomeContent } from "@/features/home/components/HomeContent";
import { HOME_FIGMA_FIXTURE } from "@/features/home/home.fixture";

export function HomePage() {
  return <HomeContent data={HOME_FIGMA_FIXTURE} />;
}
