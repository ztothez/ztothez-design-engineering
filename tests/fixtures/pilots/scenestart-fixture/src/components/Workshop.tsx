import { useState } from "react";

export function Workshop() {
  const [handle, setHandle] = useState("");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [storageStatus, setStorageStatus] = useState("");

  const steps = [
    "Build your first production",
    "Create depth",
    "Build interference",
    "Aim for the ending",
    "Watch the whole arc"
  ];

  const handleNext = () => {
    setError("");
    setStep(s => s + 1);
  };

  const persistHandle = (value: string) => {
    setHandle(value);
    setStorageStatus("");
    try {
      localStorage.setItem("workshopHandle", value);
      setError("");
    } catch {
      setError("Storage unavailable. Project retained in memory.");
    }
  };

  const retryStorage = () => {
    try {
      localStorage.setItem("workshopHandle", handle);
      setError("");
      setStorageStatus("Storage available. In-memory project saved locally.");
    } catch {
      setError("Storage unavailable. Project retained in memory.");
    }
  };

  if (step === 0) {
    return (
      <div>
        <h1>Build your first production</h1>
        {error && <div role="alert">{error}</div>}
        {storageStatus && <div role="status">{storageStatus}</div>}
        <label>
          YOUR HANDLE
          <input
            value={handle}
            aria-label="Your Handle"
            onChange={e => persistHandle(e.target.value)}
          />
        </label>
        {error && <button onClick={retryStorage}>RETRY STORAGE</button>}
        <button onClick={handleNext}>NEXT STEP</button>
      </div>
    );
  }

  if (step > 0 && step < 4) {
    return (
      <div>
        <h2>{steps[step]}</h2>
        <button onClick={handleNext}>NEXT STEP</button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div>
        <h2>{steps[step]}</h2>
        <button onClick={() => setStep(5)}>PLAY THE 20-SECOND PRODUCTION</button>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div>
        <h2>{steps[4]}</h2>
        <button onClick={() => setStep(6)}>PAUSE</button>
      </div>
    );
  }

  if (step === 6) {
    return (
      <div>
        <button onClick={() => setStep(7)}>FINISH WORKSHOP</button>
      </div>
    );
  }

  if (step === 7) {
    return (
      <div>
        <p>You built a timed opening, escalation and ending.</p>
        <button onClick={() => {
          const blob = new Blob(["test html"], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "my-production.html";
          a.click();
        }}>EXPORT OFFLINE HTML</button>
        <a href="/studio">CONTINUE IN DEMO STUDIO</a>
      </div>
    );
  }

  return null;
}
