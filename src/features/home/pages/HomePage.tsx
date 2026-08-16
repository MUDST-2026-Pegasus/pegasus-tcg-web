import { Link } from "react-router-dom";

import { Button } from "#components/ui/button";

export function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Pegasus TCG</h1>
      <Button render={<Link to="/register" />}>Sign up</Button>
    </div>
  );
}
