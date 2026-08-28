import { DashboardApp } from "../components/DashboardApp";
import { normalizeScenario } from "../domain/data";

interface PageProps {
  searchParams: Promise<{ state?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <DashboardApp initialScenario={normalizeScenario(params.state)} />;
}
