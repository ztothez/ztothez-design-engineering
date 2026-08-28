type DashboardProps = {
  total: number;
  onRefresh: () => void;
};

export function Dashboard({ total, onRefresh }: DashboardProps) {
  return (
    <main>
      <h1>Repository health</h1>
      <p>{total} checks completed</p>
      <button type="button" onClick={onRefresh}>
        Refresh results
      </button>
    </main>
  );
}

export function DisclosedDemoFallback() {
  const result = "mock fallback report";
  return (
    <p
      data-ztothez-design-interface-trust
      data-ztothez-design-data-mode="demo"
      data-ztothez-design-result-origin="simulated"
    >
      Demo fallback: {result}
    </p>
  );
}
