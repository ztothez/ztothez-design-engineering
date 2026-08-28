function Icon() {
  return <svg aria-hidden="true" />;
}

export default function BadDashboard() {
  const apiKey = "your-api-key";
  function setMockReport() {
    return "mock fallback report";
  }

  async function requestReport() {
    const response = await fetch("/invented-api");
    return response.json();
  }

  const colors = ["#112233", "#445566", "#778899"];

  return (
    <main
      style={{
        background: colors[0],
        padding: "24px",
        minHeight: "100vh",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      <header>
        <h1>Generic dashboard</h1>
        <a href="#">Reports</a>
        <p>Status: operational</p>
      </header>
      <section>
        <button type="button">
          <Icon />
        </button>
        <div role="button">View details</div>
        <button type="button" onClick={() => void requestReport()}>
          Run report
        </button>
        <pre>{setMockReport()}</pre>
        <p>{apiKey.length} credential characters configured</p>
      </section>
      <section>
        <p>Decorative content exists to extend this component.</p>
        <p>It intentionally exceeds the fixture policy threshold.</p>
      </section>
    </main>
  );
}
