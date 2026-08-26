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
