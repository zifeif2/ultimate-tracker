import React from "react";

export default function Statistics() {
  const [players, _setPlayers] = React.useState([]);
  const [games, _setGames] = React.useState([]);

  React.useEffect( () => {
  
    const setInitialData = async () => {
    const {playersData, groupsData, gamesData} = await loadInitialData();
    _setPlayers(playersData || []);
    _setGroups(groupsData || []);
    _setGames(gamesData || []);
    }
    setInitialData();
  }, []);

  // Get player stats
  const getTopScorers = () => {
    return [...players]
      .sort((a, b) => b.stats.total.goals - a.stats.total.goals)
      .slice(0, 5);
  };

  const getTopAssisters = () => {
    return [...players]
      .sort((a, b) => b.stats.total.assists - a.stats.total.assists)
      .slice(0, 5);
  };

  // New function to get top play makers
  const getTopPlayMakers = () => {
    return [...players]
      .sort((a, b) => b.stats.total.plays - a.stats.total.plays)
      .slice(0, 5);
  };

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
