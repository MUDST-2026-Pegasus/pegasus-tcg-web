import { useEffect } from "react";

export function InitialRouteReady() {
  useEffect(() => {
    window.dispatchEvent(new Event("pegasus:route-ready"));
  }, []);
  return null;
}
