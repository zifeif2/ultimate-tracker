import React from "react";

export default function Statistics({
  players,
  groups,
  games,
  getTopScorers,
  getTopAssisters,
  getTopPlayMakers,
}) {
  return (
    <div>
      <h2 style={{ color: "#333", marginBottom: "20px" }}>Statistics</h2>
      <div style={{ marginBottom: "30px" }}>
        <h3>Top Scorers</h3>
        <ol>
          {getTopScorers().map((player) => (
            <li key={player.id}>{player.name} - {player.stats.total.goals} goals</li>
          ))}
        </ol>
      </div>
      <div style={{ marginBottom: "30px" }}>
        <h3>Top Assisters</h3>
        <ol>
          {getTopAssisters().map((player) => (
            <li key={player.id}>{player.name} - {player.stats.total.assists} assists</li>
          ))}
        </ol>
      </div>
      <div style={{ marginBottom: "30px" }}>
        <h3>Top Play Makers</h3>
        <ol>
          {getTopPlayMakers().map((player) => (
            <li key={player.id}>{player.name} - {player.stats.total.plays} plays</li>
          ))}
        </ol>
      </div>
      <div>
        <h3>Game History</h3>
        <ul>
          {games.map((game) => (
            <li key={game.id}>
              vs {game.opponent} | {game.ourScore ?? game.our_score} - {game.opponentScore ?? game.opponent_score}
              {game.endTime || game.end_time ? (
                <span> (Ended: {new Date(game.endTime || game.end_time).toLocaleString()})</span>
              ) : (
                <span> (Ongoing)</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
