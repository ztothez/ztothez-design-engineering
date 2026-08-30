import { useState } from "react";

export function CoreDemoCraft() {
  const [completed, setCompleted] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('demoCraftCompleted');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const checkAndComplete = (lesson: number) => {
    if (!completed.includes(lesson)) {
      const newCompleted = [...completed, lesson];
      setCompleted(newCompleted);
      localStorage.setItem('demoCraftCompleted', JSON.stringify(newCompleted));
    }
  };

  return (
    <div>
      <div role="status">
        {completed.length}/9 LESSONS COMPLETE{completed.length === 9 ? " · PATH COMPLETE" : ""}
      </div>
      <button onClick={() => checkAndComplete(1)}>I understand what a demo is</button>
      <button onClick={() => checkAndComplete(2)}>I understand scene time</button>

      <section>
        <div id="lesson-waves"></div>
        <input id="remix-plasma-waveScale" type="range" aria-label="Wave scale" />
        <input id="remix-plasma-colorSpeed" type="range" aria-label="Color speed" />
        <button onClick={() => checkAndComplete(3)}>CHECK GOAL AND COMPLETE</button>
      </section>

      <section>
        <div id="lesson-one-effect"></div>
        <input id="remix-starfield-fieldOfView" type="range" aria-label="Field of view" />
        <button onClick={() => checkAndComplete(4)}>CHECK GOAL AND COMPLETE</button>
      </section>

      <button onClick={() => checkAndComplete(5)}>I know how to save a variation</button>

      <section>
        <div id="lesson-combining-effects"></div>
        <input id="remix-tunnel-ringSpacing" type="range" aria-label="Ring spacing" />
        <input id="remix-tunnel-travelSpeed" type="range" aria-label="Travel speed" />
        <button onClick={() => checkAndComplete(6)}>CHECK GOAL AND COMPLETE</button>
      </section>

      <button onClick={() => checkAndComplete(7)}>I understand sync in principle</button>
      <button onClick={() => checkAndComplete(8)}>I understand pacing and flow</button>
      <button onClick={() => checkAndComplete(9)}>I understand what a release needs</button>
    </div>
  );
}
