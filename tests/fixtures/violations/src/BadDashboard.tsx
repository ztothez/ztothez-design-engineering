function Icon() {
  return <svg aria-hidden="true" />;
}

export default function BadDashboard() {
  function setMockReport() {
    return "mock fallback report";
  }

  async function requestReport() {
    const response = await fetch("/invented-api");
    return response.json();
  }

  const colors = ["#112233", "#445566", "#778899"];

  return (
    <main style={{ background: colors[0] }}>
      <header>
        <h1>Generic dashboard</h1>
        <a href="#">Reports</a>
      </header>
      <section>
        <button type="button">
          <Icon />
        </button>
        <button type="button" onClick={() => void requestReport()}>
          Run report
        </button>
        <pre>{setMockReport()}</pre>
      </section>
      <section>
        <p>Decorative content exists to extend this component.</p>
        <p>It intentionally exceeds the fixture policy threshold.</p>
      </section>
    </main>
  );
}
