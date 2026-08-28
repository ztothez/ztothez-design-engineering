import { healthSeries } from "../domain/data";

export function HealthChart() {
  return (
    <section
      className="health-chart"
      aria-labelledby="health-heading"
      data-ztothez-design-chart
      data-ztothez-design-chart-values="visible"
      data-ztothez-design-chart-alternative="#health-data"
      data-ztothez-design-chart-series="1"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Seven-day benchmark window</p>
          <h2 id="health-heading">Infrastructure health trend</h2>
        </div>
        <span className="count-label">Current: 86 / 100</span>
      </div>
      <div className="bar-chart" aria-hidden="true">
        {healthSeries.map((point) => (
          <div className="bar-column" key={point.date}>
            <span data-ztothez-design-chart-value>{point.score}</span>
            <i style={{ "--score": `${point.score}%` } as React.CSSProperties} />
            <small>{point.date.replace("May ", "")}</small>
          </div>
        ))}
      </div>
      <details className="chart-alternative" id="health-data">
        <summary>View exact health values</summary>
        <div className="chart-table-wrap">
          <table>
            <caption>Infrastructure health score by date</caption>
            <thead><tr><th>Date</th><th>Score</th></tr></thead>
            <tbody>{healthSeries.map((point) => <tr key={point.date}><td>{point.date}</td><td>{point.score}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
