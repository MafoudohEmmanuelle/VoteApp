export default function LiveResults({ choices, results }) {
  const total = Object.values(results).reduce((a, b) => a + b, 0);

  return (
    <div>
      {choices.map((choice) => {
        const count = results[choice.id] || 0;
        const percent = total ? (count / total) * 100 : 0;

        return (
          <div key={choice.id}>
            <small>{choice.text} — {count} votes</small>
            <div className="result-bar">
              <div
                className="result-bar-fill"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}