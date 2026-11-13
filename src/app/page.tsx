import catalog from "../../public/data/catalog.json";
import TeduhApp from "@/components/teduh-app";
import type { Catalog } from "@/lib/types";
export default function Page() {
  const data: Catalog = {
    ...catalog,
    areas: catalog.areas.map((area) => ({
      ...area,
      center: [area.center[0], area.center[1]],
    })),
  };
  return <TeduhApp catalog={data} />;
}
