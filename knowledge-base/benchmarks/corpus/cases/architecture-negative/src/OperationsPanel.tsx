import { useEffect, useState } from "react";

export function OperationsPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("operation-result");
    if (stored) setResult(stored);
  }, []);

  async function runOperation() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/run", { method: "POST" });
      if (!response.ok) throw new Error("Request failed");
      const body = await response.text();
      localStorage.setItem("operation-result", body);
      setResult(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ background: "#ffffff", color: "#111827", borderColor: "#0f766e" }}>
      <h1>Operations</h1>
      <p>{loading ? "Running" : "Ready"}</p>
      {error ? <p role="alert">{error}</p> : null}
      {result ? <pre>{result}</pre> : <p>No result yet</p>}
      <button type="button" onClick={runOperation} disabled={loading}>
        Run operation
      </button>
    </main>
  );
}
