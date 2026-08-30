import { useEffect, useState } from "react";
import { TaskWorkspace } from "./components/TaskWorkspace";
import { Workshop } from "./components/Workshop";
import { CoreDemoCraft } from "./components/CoreDemoCraft";
import { Release } from "./components/Release";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (path === "/studio") return <TaskWorkspace />;
  if (path === "/workshop") return <Workshop />;
  if (path === "/learn/core-demo-craft") return <CoreDemoCraft />;
  if (path === "/learn/release") return <Release />;
  if (path === "/learn") {
    let completedCount = 0;
    try {
      const saved = localStorage.getItem('demoCraftCompleted');
      if (saved) completedCount = JSON.parse(saved).length;
    } catch {}
    return (
      <div>
        <a href="/learn/core-demo-craft">Core Demo Craft</a>
        <a href="/learn/release">Release</a>
        <p>{completedCount}/9 DONE</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>SceneStart Pilot</h1>
      <ul>
        <li><a href="/studio">Demo Studio</a></li>
        <li><a href="/workshop">Guided Workshop</a></li>
        <li><a href="/learn">Learn</a></li>
      </ul>
    </div>
  );
}
