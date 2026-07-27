import { createFileRoute } from "@tanstack/react-router";
import { WiiMenu } from "@/components/wii/WiiMenu";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <WiiMenu />;
}
