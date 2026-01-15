export default function LiveResults({ choices, results }) {
  const total = Object.values(results).reduce((a, b) => a + b, 0);

  return (
    <div className="results-container">
      {choices.map((choice) => {
        const count = results[choice.id] || 0;
        const percent = total ? (count / total) * 100 : 0;

        return (
          <div key={choice.id} className="result-item">
            <div className="result-header">
              <span className="result-label">{choice.text}</span>
              <span className="result-count">{count} votes</span>
            </div>
            <div className="result-bar">
              <div
                className="result-bar-fill"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="result-percent">{percent.toFixed(1)}%</div>
          </div>
        );
      })}
      <div className="result-total">
        <strong>Total Votes: {total}</strong>
      </div>
    </div>
  );
}