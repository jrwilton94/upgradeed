import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ia")({
  beforeLoad: () => {
    throw redirect({ to: "/plataforma", hash: "ia" });
  },
});