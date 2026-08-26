import "./theme.css";

type DashboardProps = {
  completed: number;
  total: number;
  onRefresh: () => void;
};

export function Dashboard({ completed, total, onRefresh }: DashboardProps) {
  return (
    <main>
      <h1>Validation overview</h1>
      <p>{completed} of {total} checks completed</p>
      <button type="button" onClick={onRefresh}>Refresh validation</button>
    </main>
  );
}
