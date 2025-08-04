import React from "react";

// Props: { game, players, onClose }
export default function GameDetail({ game, players, onClose }) {
  if (!game || !players) return null;

  // Helper: map player ID to name
  const idToName = React.useMemo(() => {
    const map = {};
    players.forEach(p => { map[p.id] = p.name; });
    return map;
  }, [players]);

  return (
    <div style={{ background: '#f8f9fa', padding: 24, borderRadius: 12, maxWidth: 800, margin: '0 auto', boxShadow: '0 2px 12px #0001', position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 24, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>&times;</button>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Game Details</h2>
      <div style={{ marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>
        vs {game.opponent} | {game.tournament} <br />
        <span style={{ color: '#888', fontWeight: 400 }}>Started: {game.start_time ? new Date(game.start_time).toLocaleString() : ''}</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Score:</strong> {game.our_score} - {game.opponent_score}
      </div>
      <div>
        {game.points && game.points.length > 0 ? game.points.map((pt, idx) => {
          const isUs = pt.winner === 'us';
          return (
            <div key={idx} style={{
              background: isUs ? '#e6ffe6' : '#ffeaea',
              border: `2px solid ${isUs ? '#28a745' : '#dc3545'}`,
              borderRadius: 8,
              marginBottom: 18,
              padding: 16,
              boxShadow: '0 1px 4px #0001',
            }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                Point {idx + 1} {isUs ? <span style={{ color: '#28a745' }}>(We Scored)</span> : <span style={{ color: '#dc3545' }}>(Opponent Scored)</span>}
                <span style={{ float: 'right', color: '#888', fontWeight: 400, fontSize: 13 }}>{pt.timestamp ? new Date(pt.timestamp).toLocaleString() : ''}</span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Scorer:</strong> {pt.scorer ? (idToName[pt.scorer] || pt.scorer) : '-'}
                {pt.assister && (
                  <span style={{ marginLeft: 18 }}><strong>Assister:</strong> {idToName[pt.assister] || pt.assister}</span>
                )}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Strategy/Notes:</strong> {pt.strategy || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Players on Field:</strong> {pt.playersOnField && pt.playersOnField.length > 0
                  ? pt.playersOnField.map(pid => idToName[pid] || pid).join(', ')
                  : '-'}
              </div>
              {pt.plays && pt.plays.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <strong>Plays:</strong> {pt.plays.map((play, i) => (
                    <span key={i} style={{ marginRight: 10 }}>{idToName[play.player] || play.player}: {play.type}</span>
                  ))}
                </div>
              )}
              {pt.mistakes && pt.mistakes.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <strong>Mistakes:</strong> {pt.mistakes.map((m, i) => (
                    <span key={i} style={{ marginRight: 10 }}>{idToName[m.player] || m.player}: {m.type}</span>
                  ))}
                </div>
              )}
            </div>
          );
        }) : <div style={{ textAlign: 'center', color: '#888' }}>No points recorded for this game.</div>}
      </div>
    </div>
  );
}
