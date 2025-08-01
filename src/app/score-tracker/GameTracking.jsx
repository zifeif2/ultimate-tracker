import React from "react";

export default function GameTracking({
  players,
  groups,
  games,
  currentGame,
  setCurrentGame,
  ourScore,
  opponentScore,
  setOurScore,
  setOpponentScore,
  selectedPlayers,
  setSelectedPlayers,
  selectedGroups,
  setSelectedGroups,
  currentPoint,
  setCurrentPoint,
  editingPointIndex,
  setEditingPointIndex,
  opponentTeam,
  setOpponentTeam,
  startNewGame,
  selectGroup,
  togglePlayerSelection,
  recordPoint,
  endGame,
  addMistake,
  removeMistake,
  addPlay,
  removePlay,
  newMistake,
  setNewMistake,
  newPlay,
  setNewPlay,
}) {
  return (
    <div>
      <h2 style={{ color: "#333", marginBottom: "20px" }}>Game Tracking</h2>
      {!currentGame ? (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Start New Game</h3>
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "15px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              value={opponentTeam}
              onChange={(e) => setOpponentTeam(e.target.value)}
              placeholder="Opponent team name"
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                flex: "1",
                minWidth: "200px",
              }}
            />
            <button
              onClick={startNewGame}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Start Game
            </button>
          </div>
          {/* Existing Games (Resume) */}
          {games && games.filter(g => !g.end_time).length > 0 && (
            <div style={{marginTop: '30px', background: '#fff3cd', borderRadius: '8px', padding: '20px', border: '1px solid #ffeeba'}}>
              <h3 style={{marginBottom: '15px', color: '#856404'}}>Resume Existing Game</h3>
              {games.filter(g => !g.end_time).map(game => (
                <div key={game.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', background: '#fffbe6', borderRadius: '5px'}}>
                  <div>
                    <strong>vs {game.opponent}</strong> <span style={{fontSize: '12px', color: '#888'}}>Started: {game.start_time ? (new Date(game.start_time)).toLocaleString() : ''}</span>
                  </div>
                  <button
                    style={{padding: '6px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                    onClick={() => {
                      setCurrentGame({
                        ...game,
                        points: game.points ? (typeof game.points === 'string' ? JSON.parse(game.points) : game.points) : [],
                      });
                      setOurScore(game.our_score ?? 0);
                      setOpponentScore(game.opponent_score ?? 0);
                    }}
                  >
                    Resume
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Current Score */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Current Score</h3>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              Our Team: {ourScore} - {opponentScore} :{currentGame.opponent}
            </div>
          </div>
          {/* Edit Last Point Button */}
          {currentGame?.points?.length > 0 && (
            <button
              disabled={editingPointIndex !== null}
              onClick={() => {
                const lastIndex = currentGame.points.length - 1;
                const lastPoint = currentGame.points[lastIndex];
                setCurrentPoint(lastPoint);
                setSelectedPlayers(lastPoint.playersOnField || []);
                setEditingPointIndex(lastIndex);
                if (lastPoint.winner === "us") {
                  setOurScore(prev => prev - 1);
                } else {
                  setOpponentScore(prev => prev - 1);
                }
              }}
              style={{
                marginTop: 10,
                backgroundColor: "#ffc107",
                padding: "10px 20px",
                borderRadius: "5px",
                color: "black",
                border: "none",
                cursor: "pointer",
                visibility: editingPointIndex !== null ? 'hidden' : 'visible',
              }}
            >
              Edit Last Point
            </button>
          )}
          {/* Player Selection */}
          <div
            style={{
              marginBottom: "20px",
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>
              Select Players for This Point
            </h3>
            {/* Quick Group Selection */}
            <div style={{ marginBottom: "15px" }}>
              <strong>Quick Select by Group:</strong>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                  flexWrap: "wrap",
                }}
              >
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => selectGroup(group.id)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: selectedGroups.includes(group.id) ? "#007bff" : "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "15px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Individual Player Selection */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => togglePlayerSelection(player.id)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: selectedPlayers.includes(player.id) ? "#007bff" : "#f8f9fa",
                    color: selectedPlayers.includes(player.id) ? "white" : "#333",
                    border: "1px solid #007bff",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
          {/* Point Form (Scorer, Assister, Mistakes, Plays, etc.) */}
          {/* ... (your existing point form UI goes here) ... */}
          {/* Record/End Point Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={() => recordPoint("us")}>Record Point (Us)</button>
            <button onClick={() => recordPoint("opponent")}>Record Point (Opponent)</button>
            <button onClick={endGame}>End Game</button>
          </div>
        </div>
      )}
    </div>
  );
}
