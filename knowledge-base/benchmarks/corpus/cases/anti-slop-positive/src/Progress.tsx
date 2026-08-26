type ProgressProps = {
  completedIds: string[];
  requiredIds: string[];
};

export function Progress({ completedIds, requiredIds }: ProgressProps) {
  const completed = requiredIds.filter((id) => completedIds.includes(id)).length;
  return (
    <section aria-labelledby="progress-title">
      <h2 id="progress-title">Release progress</h2>
      <p>{completed} of {requiredIds.length} requirements complete</p>
      <a href="/release/evidence">Inspect evidence</a>
    </section>
  );
}
