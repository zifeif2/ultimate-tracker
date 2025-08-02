import React from "react";
import { storePlayer, loadInitialData, createGame, updatePlayerStat, storeGame } from "@/api/supabase";

export default function GameTracking() {
  const [selectedGroups, setSelectedGroups] = React.useState(new Set());
  const [editingPointIndex, setEditingPointIndex] = React.useState(null);

  const [opponentTeam, setOpponentTeam] = React.useState("");
  const [selectedPlayers, setSelectedPlayers] = React.useState([]);
  const [ourScore, setOurScore] = React.useState(0);
  const [currentGame, setCurrentGame] = React.useState(null);
  const [opponentScore, setOpponentScore] = React.useState(0);
  const [currentPoint, setCurrentPoint] = React.useState({
    scorer: "",
    assister: "",
    mistakes: [],
    plays: [],
    strategy: "",
    winner: "",
  });

  const [newMistake, setNewMistake] = React.useState({ player: "", type: "" });
  const [newPlay, setNewPlay] = React.useState({ player: "", type: "" });
  const [games, _setGames] = React.useState([]);
  const [players, _setPlayers] = React.useState([]);
  const [groups, _setGroups] = React.useState([]);
  const playerIdToGroup = React.useMemo(() => {
    return players.reduce((acc, player) => {
      acc[player.id] = player.groups;
      return acc;
    }, {});
  }, [players]);
  // Start new game

  const updatePlayerStat = (playerId, gameId, key, delta = 1) => {
    const p = players.find(player => player.id === playerId);
    const totalStats = { ...p.stats.total };
    totalStats[key] += delta;

    const perGame = { ...p.stats.perGame };
    if (!perGame[gameId]) {
      perGame[gameId] = { goals: 0, assists: 0, mistakes: 0, plays: 0 };
    }
    perGame[gameId][key] += delta;

    return {
      ...p,
      stats: {
        total: totalStats,
        perGame: perGame,
      },
    };
  };


  const startNewGame = async () => {
    if (opponentTeam.trim()) {
      const newGame = await createGame(opponentTeam.trim());
      setCurrentGame(newGame);
      setOurScore(0);
      setOpponentScore(0);
      setOpponentTeam("");
    }
  };

    // Select players for point
  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const recordPoint = (winner) => {

    const pointData = {
      ...currentPoint,
      winner,
      playersOnField: selectedPlayers,
      timestamp: new Date(),
    };



    let newPlayerStats;

    // Update player stats
    if (winner === "us") {
      if (currentPoint.scorer) {
        newPlayerStats = updatePlayerStat(parseInt(currentPoint.scorer), currentGame.id, "goals")
        setPlayers(newPlayerStats);

      }
      if (currentPoint.assister) {
        newPlayerStats = updatePlayerStat(parseInt(currentPoint.assister), currentGame.id, "assists")
        setPlayers(newPlayerStats);
      }
      setOurScore((prev) => prev + 1);
    } else {
      setOpponentScore((prev) => prev + 1);
    }

    // Update mistake stats for all players who made mistakes
    currentPoint.mistakes.forEach((mistake) => {
      newPlayerStats = updatePlayerStat(parseInt(mistake.player), currentGame.id, "mistakes")
      setPlayers(newPlayerStats);
    });


    // Update play stats for all players who made plays
    currentPoint.plays.forEach((play) => {
      if (play.player) {
        newPlayerStats = updatePlayerStat(parseInt(play.player), currentGame.id, "plays")
        setPlayers(newPlayerStats);
      }
    });

    const ourNewScore = winner === "us" ? ourScore + 1 : ourScore;
    const opponentNewScore = winner === "opponent" ? opponentScore + 1 : opponentScore;
    let updatedPoints = [...currentGame.points];

    if (editingPointIndex !== null) {
      // Replace the last point with the edited version
      updatedPoints[editingPointIndex] = pointData;
      setEditingPointIndex(null); // Exit edit mode
    } else {
      updatedPoints.push(pointData);
    }

    storeGame(currentGame.id, ourNewScore, opponentNewScore, updatedPoints, null)

    // Add point to current game
    setCurrentGame((prev) => ({
      ...prev,
      points: updatedPoints,
      ourScore: ourNewScore,
      opponentScore: opponentNewScore,
    }));

    // Reset point data
    setCurrentPoint({
      scorer: "",
      assister: "",
      mistakes: [],
      plays: [],
      strategy: "",
      winner: "",
    });
    setSelectedPlayers([]);
    setSelectedGroups(new Set());
    setNewMistake({ player: "", type: "" });
    setNewPlay({ player: "", type: "" });
  };

  // End game
  const endGame = () => {
    const finishedGame = {
      ...currentGame,
      endTime: new Date(),
      ourScore,
      opponentScore,
    };
    _setGames([...games, finishedGame]);
    storeGame(currentGame.id, ourScore, opponentScore, finishedGame.points, new Date())
    setCurrentGame(null);
  };

  const saveState = () => {
    // downloadJSON({ players, groups, games, currentPoint, ourScore, opponentScore });
  };

  React.useEffect(() => {
    const setInitialData = async () => {
      const { gamesData, groupsData, playersData } = await loadInitialData();
      _setGames(gamesData || []);
      _setGroups(groupsData || []);
      _setPlayers(playersData || []);
    }
    setInitialData();
  }, []);

    const setPlayers = async (value) => {
      const newPlayer = await storePlayer(value);
  
      const updatedPlayers = players.map(player => player.id === newPlayer.id ? newPlayer : player);
      _setPlayers(updatedPlayers);
    };
  // Add mistake to current point
  const addMistake = () => {
    if (newMistake.player && newMistake.type.trim()) {
      setCurrentPoint((prev) => ({
        ...prev,
        mistakes: [...prev.mistakes, { ...newMistake, id: Date.now() }],
      }));
      setNewMistake({ player: "", type: "" });
    }
  };

  // Remove mistake from current point
  const removeMistake = (mistakeId) => {
    setCurrentPoint((prev) => ({
      ...prev,
      mistakes: prev.mistakes.filter((m) => m.id !== mistakeId),
    }));
  };

  // Add play to current point
  const addPlay = () => {
    if (newPlay.player && newPlay.type.trim()) {
      setCurrentPoint((prev) => ({
        ...prev,
        plays: [...prev.plays, { ...newPlay, id: Date.now() }],
      }));
      setNewPlay({ player: "", type: "" });
    }
  };

  // Select group for point
  const selectGroup = (group_id) => {
    const groupPlayers = players
      .filter((p) => p.groups.includes(group_id))
      .map((p) => p.id);
    setSelectedPlayers((prev) => {
      const newSet = new Set([...prev, ...groupPlayers])
      return [...newSet];
    });
    setSelectedGroups((prev) => new Set([...prev, group_id]));
  };

  const unselectGroup = (group_id) => {
    setSelectedGroups((prev) => new Set([...prev].filter((g) => g !== group_id)));
    setSelectedPlayers((prev) => prev.filter((p) => !playerIdToGroup[p].includes(group_id)));
  };


  // Remove play from current point
  const removePlay = (playId) => {
    setCurrentPoint((prev) => ({
      ...prev,
      plays: prev.plays.filter((p) => p.id !== playId),
    }));
  };

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
            <div style={{ marginTop: '30px', background: '#fff3cd', borderRadius: '8px', padding: '20px', border: '1px solid #ffeeba' }}>
              <h3 style={{ marginBottom: '15px', color: '#856404' }}>Resume Existing Game</h3>
              {games.filter(g => !g.end_time).map(game => (
                <div key={game.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', background: '#fffbe6', borderRadius: '5px' }}>
                  <div>
                    <strong>vs {game.opponent}</strong> <span style={{ fontSize: '12px', color: '#888' }}>Started: {game.start_time ? (new Date(game.start_time)).toLocaleString() : ''}</span>
                  </div>
                  <button
                    style={{ padding: '6px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
          {/* Game History */}
          {games.length > 0 && (
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginBottom: "15px" }}>Game History</h3>
              {games.map((game) => (
                <div
                  key={game.id}
                  style={{
                    padding: "15px",
                    backgroundColor: "white",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <strong>vs {game.opponent}</strong>
                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: "15px",
                        fontSize: "14px",
                        backgroundColor: game.end_time ?(
                          game.our_score > game.opponent_score
                            ? "#28a745"
                            : "#dc3545") : "#6c757d",
                        color: "white",
                      }}
                    >
                      {game.end_time ? (game.our_score > game.opponent_score ? "WIN" : "LOSS") : "ONGOING"}
                    </span>
                  </div>
                  <div>
                    Final Score: {game.our_score} - {game.opponent_score}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "5px",
                    }}
                  >
                    {game.start_time.toLocaleString()} | {JSON.parse(game.points).length}{" "}
                    points played
                  </div>
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
                    onClick={() => selectedGroups.has(group.id) ? unselectGroup(group.id) : selectGroup(group.id)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: selectedGroups.has(group.id) ? "#dc3545" : "#6c757d",
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "10px",
              }}
            >
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => togglePlayerSelection(player.id)}
                  style={{
                    padding: "8px",
                    backgroundColor: selectedPlayers.includes(player.id)
                      ? "#28a745"
                      : "white",
                    color: selectedPlayers.includes(player.id)
                      ? "white"
                      : "#333",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  {player.name}
                </button>
              ))}
            </div>

            <div
              style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}
            >
              Selected: {selectedPlayers.length} players
            </div>
          </div>

          {/* Point Details */}
          <div
            style={{
              marginBottom: "20px",
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>Point Details</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              {/* Scorer */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Who scored?
                </label>
                <select
                  value={currentPoint.scorer}
                  onChange={(e) =>
                    setCurrentPoint((prev) => ({
                      ...prev,
                      scorer: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="">Select scorer</option>
                  {players
                    .filter((p) => selectedPlayers.includes(p.id))
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Assister */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Who assisted?
                </label>
                <select
                  value={currentPoint.assister}
                  onChange={(e) =>
                    setCurrentPoint((prev) => ({
                      ...prev,
                      assister: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="">Select assister</option>
                  {players
                    .filter((p) => selectedPlayers.includes(p.id))
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Multiple Mistakes Section */}
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            >
              <h4 style={{ marginBottom: "15px", color: "#dc3545" }}>
                Mistakes
              </h4>

              {/* Add New Mistake */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "15px",
                  flexWrap: "wrap",
                }}
              >
                <select
                  value={newMistake.player}
                  onChange={(e) =>
                    setNewMistake((prev) => ({
                      ...prev,
                      player: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    minWidth: "150px",
                  }}
                >
                  <option value="">Select player</option>
                  {players
                    .filter((p) => selectedPlayers.includes(p.id))
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                </select>
                <input
                  type="text"
                  value={newMistake.type}
                  onChange={(e) =>
                    setNewMistake((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  placeholder="Type of mistake (e.g., drop, turnover)"
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    flex: "1",
                    minWidth: "200px",
                  }}
                />
                <button
                  onClick={addMistake}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Add Mistake
                </button>
              </div>

              {/* List of Mistakes */}
              {currentPoint.mistakes.length > 0 && (
                <div>
                  <strong>Recorded Mistakes:</strong>
                  {currentPoint.mistakes.map((mistake) => {
                    const player = players.find(
                      (p) => p.id === parseInt(mistake.player)
                    );
                    return (
                      <div
                        key={mistake.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "4px",
                          marginTop: "5px",
                        }}
                      >
                        <span>
                          {player?.name}: {mistake.type}
                        </span>
                        <button
                          onClick={() => removeMistake(mistake.id)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Multiple Plays Section */}
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            >
              <h4 style={{ marginBottom: "15px", color: "#28a745" }}>
                Good Plays
              </h4>

              {/* Add New Play */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "15px",
                  flexWrap: "wrap",
                }}
              >
                <select
                  value={newPlay.player}
                  onChange={(e) =>
                    setNewPlay((prev) => ({
                      ...prev,
                      player: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    minWidth: "150px",
                  }}
                >
                  <option value="">Select player</option>
                  {players
                    .filter((p) => selectedPlayers.includes(p.id))
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                </select>
                <input
                  type="text"
                  value={newPlay.type}
                  onChange={(e) =>
                    setNewPlay((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  placeholder="Type of play (e.g., great catch, good defense, layout)"
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    flex: "1",
                    minWidth: "200px",
                  }}
                />
                <button
                  onClick={addPlay}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Add Play
                </button>
              </div>

              {/* List of Plays */}
              {currentPoint.plays.length > 0 && (
                <div>
                  <strong>Recorded Plays:</strong>
                  {currentPoint.plays.map((play) => {
                    const player = players.find(
                      (p) => p.id === parseInt(play.player)
                    );
                    return (
                      <div
                        key={play.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "4px",
                          marginTop: "5px",
                        }}
                      >
                        <span>
                          {player?.name}: {play.type}
                        </span>
                        <button
                          onClick={() => removePlay(play.id)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Strategy */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Offensive Strategy Notes
              </label>
              <textarea
                value={currentPoint.strategy}
                onChange={(e) =>
                  setCurrentPoint((prev) => ({
                    ...prev,
                    strategy: e.target.value,
                  }))
                }
                placeholder="What strategy did the team use? (e.g., vertical stack, horizontal stack, zone offense)"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  minHeight: "60px",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Record Point */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => recordPoint("us")}
              style={{
                padding: "15px 30px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              We Scored!
            </button>
            <button
              onClick={() => recordPoint("opponent")}
              style={{
                padding: "15px 30px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              They Scored
            </button>
          </div>

          {/* End Game */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={endGame}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              End Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
