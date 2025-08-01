"use client";
import React from "react";
import { storePlayer, storeGroups, storeGame, loadInitialData, createGame, unassignPlayerFromGroup, deletePlayer, deleteGroup } from "@/api/supabase";
import PlayerCard from "./PlayerCard";
function MainComponent() {
  // ...
  // Remove group
  const removeGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    try {
      await deleteGroup(groupId);
      _setGroups((prev) => prev.filter((g) => g.id !== groupId));
      // Optionally, also update players to remove this group from their groups array
      _setPlayers((prev) => prev.map((p) => ({
        ...p,
        groups: (p.groups || []).filter((gid) => gid !== groupId)
      })));
    } catch (error) {
      alert('Failed to delete group.');
    }
  };

  // ...
  // Remove player
  const removePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    try {
      await deletePlayer(playerId);
      _setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } catch (error) {
      alert('Failed to delete player.');
    }
  };

  const [currentView, setCurrentView] = React.useState("roster");
  const [players, _setPlayers] = React.useState([]);
  const [groups, _setGroups] = React.useState([]);
  const [games, _setGames] = React.useState([]);
  const [currentGame, setCurrentGame] = React.useState(null);

  const [newPlayerName, setNewPlayerName] = React.useState("");
  const [newGroupName, setNewGroupName] = React.useState("");
  const [selectedGroups, setSelectedGroups] = React.useState([]);
  const [editingPointIndex, setEditingPointIndex] = React.useState(null);

  const [opponentTeam, setOpponentTeam] = React.useState("");
  const [selectedPlayers, setSelectedPlayers] = React.useState([]);
  const [ourScore, _setOurScore] = React.useState(0);
  const [opponentScore, _setOpponentScore] = React.useState(0);
  const [currentPoint, _setCurrentPoint] = React.useState({
    scorer: "",
    assister: "",
    mistakes: [],
    plays: [],
    strategy: "",
    winner: "",
  });

  const [newMistake, setNewMistake] = React.useState({ player: "", type: "" });
  const [newPlay, setNewPlay] = React.useState({ player: "", type: "" });

  React.useEffect( () => {
  
    const setInitialData = async () => {
    const {playersData, groupsData, gamesData} = await loadInitialData();
    _setPlayers(playersData || []);
    _setGroups(groupsData || []);
    _setGames(gamesData || []);
    }
    setInitialData();
  }, []);
  // Handler to unassign a player from a group
  const handleUnassignPlayerFromGroup = async (playerId, groupId) => {
    try {
      await unassignPlayerFromGroup(playerId, groupId);
      // Update local state
      _setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === playerId
            ? { ...player, groups: player.groups.filter((g) => g !== groupId) }
            : player
        )
      );
    } catch (error) {
      alert("Failed to unassign player from group.");
    }
  };

  // Add player
  const addPlayer = async () => {
    if (newPlayerName.trim()) {
      const newPlayer = {
        id: Date.now(),
        name: newPlayerName.trim(),
        groups: selectedGroups || [],
        stats: {
          total: { goals: 0, assists: 0, mistakes: 0, plays: 0 },
          perGame: {} // gameId -> { goals, assists, mistakes, plays }
        }
      };
      await setPlayers(newPlayer); // Persist to backend
      setNewPlayerName("");
      await setInitialData(); // Reload all players, groups, etc.
    }
  };

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


  // Add group
  const addGroup = () => {
    if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
      setGroups(newGroupName.trim());
      setNewGroupName("");
    }
  };

  // Start new game
  const startNewGame = async () => {
    if (opponentTeam.trim()) {
      const newGame = await createGame(opponentTeam.trim());
      setCurrentGame(newGame);
      setOurScore(0);
      setOpponentScore(0);
      setCurrentView("game");
      setOpponentTeam("");
    }
  };


  const saveState = () => {
    // downloadJSON({ players, groups, games, currentPoint, ourScore, opponentScore });
  };

  // --- Wrapped setters ---
  const setPlayers = async (value) => {
    const newPlayer = await storePlayer(value);

    const updatedPlayers = players.map(player => player.id === newPlayer.id ? newPlayer : player);
    _setPlayers(updatedPlayers);
  };

  const setGroups = async (groupName) => {
    const newGroup = await storeGroups(groupName)
    _setGroups([...groups, newGroup]);
  };

  const setGames = (value) => {
    _setGames(value);
  };

  const setCurrentPoint = (value) => {
    _setCurrentPoint(value);
  };

  const setOurScore = (value) => {
    _setOurScore(value);
  };

  const setOpponentScore = (value) => {
    _setOpponentScore(value);
  };

  // Select players for point
  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Select group for point
  const selectGroup = (group_id) => {
    const groupPlayers = players
      .filter((p) => p.groups.includes(group_id))
      .map((p) => p.id);
    setSelectedPlayers(groupPlayers);
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

  // Remove play from current point
  const removePlay = (playId) => {
    setCurrentPoint((prev) => ({
      ...prev,
      plays: prev.plays.filter((p) => p.id !== playId),
    }));
  };

  // Record point
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
        newPlayerStats = updatePlayerStat( parseInt(currentPoint.scorer), currentGame.id, "goals")
        setPlayers(newPlayerStats);

      }
      if (currentPoint.assister) {
        newPlayerStats = updatePlayerStat( parseInt(currentPoint.assister), currentGame.id, "assists")
        setPlayers(newPlayerStats);
      }
      setOurScore((prev) => prev + 1);
    } else {
      setOpponentScore((prev) => prev + 1);
    }

    // Update mistake stats for all players who made mistakes
    currentPoint.mistakes.forEach((mistake) => {
        newPlayerStats = updatePlayerStat( parseInt(mistake.player), currentGame.id, "mistakes")
        setPlayers(newPlayerStats);
    });


    // Update play stats for all players who made plays
    currentPoint.plays.forEach((play) => {
      if (play.player) {
        newPlayerStats = updatePlayerStat( parseInt(play.player), currentGame.id, "plays")
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
    
    storeGame(currentGame.id, ourNewScore, opponentNewScore,  updatedPoints, null)

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
    setGames([...games, finishedGame]);
    storeGame(currentGame.id, ourScore, opponentScore, finishedGame.points, new Date())
    setCurrentGame(null);
    setCurrentView("stats");
  };

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
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Navigation */}
      <div
        style={{
          marginBottom: "30px",
          borderBottom: "2px solid #ddd",
          paddingBottom: "10px",
        }}
      >
        <h1 style={{ color: "#333", marginBottom: "20px" }}>
          Ultimate Frisbee Score Tracker
        </h1>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setCurrentView("roster")}
            style={{
              padding: "10px 20px",
              backgroundColor: currentView === "roster" ? "#007bff" : "#f8f9fa",
              color: currentView === "roster" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Roster Management
          </button>
          <button
            onClick={() => setCurrentView("game")}
            style={{
              padding: "10px 20px",
              backgroundColor: currentView === "game" ? "#007bff" : "#f8f9fa",
              color: currentView === "game" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Game Tracking
          </button>
          <button
            onClick={() => setCurrentView("stats")}
            style={{
              padding: "10px 20px",
              backgroundColor: currentView === "stats" ? "#007bff" : "#f8f9fa",
              color: currentView === "stats" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Roster Management View */}
      {currentView === "roster" && (
        <div>
          <h2 style={{ color: "#333", marginBottom: "20px" }}>
            Roster Management
          </h2>

          {/* Add Group */}
          <div
            style={{
              marginBottom: "30px",
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>Create Groups</h3>
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
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name (e.g., Offense, Defense)"
                style={{
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  flex: "1",
                  minWidth: "200px",
                }}
              />
              <button
                onClick={addGroup}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Add Group
              </button>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {groups.map((group) => (
                <div style={{
                  padding: "5px 10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  borderRadius: "15px",
                  fontSize: "14px",
                }}>
                <span
                  key={group.id}
                  
                >
                  {group.name}
                </span>
                  <button
    title="Delete group"
    onClick={() => removeGroup(group.id)}
    style={{
      background: 'none',
      border: 'none',
      color: '#dc3545',
      fontSize: '18px',
      cursor: 'pointer',
      marginLeft: '8px',
    }}
    aria-label={`Delete group ${group.name}`}
  >
    🗑️
  </button></div>
              ))}
            </div>
          </div>

          {/* Add Player */}
          <div
            style={{
              marginBottom: "30px",
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>Add Players</h3>
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
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name"
                style={{
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  flex: "1",
                  minWidth: "150px",
                }}
              />
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
                        onClick={() => selectedGroups.includes(group.id) ? setSelectedGroups(selectedGroups.filter((g) => g !== group.id)) : setSelectedGroups([...selectedGroups, group.id])}
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
              <button
                onClick={addPlayer}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Add Player
              </button>
            </div>
          </div>

          {/* Players List */}
          <div>
            <h3 style={{ marginBottom: "15px" }}>
              Current Roster ({players.length} players)
            </h3>
            {groups.map((group) => {
  const groupPlayers = players.filter((p) => p.groups && p.groups.includes(group.id));
  if (groupPlayers.length === 0) return null;
  return (
    <div key={group.id} style={{ marginBottom: "20px" }}>
      <h4 style={{ color: "#007bff", marginBottom: "10px", display: 'flex', alignItems: 'center' }}>
  <span style={{ flex: 1 }}>{group.name}</span>
</h4>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "10px",
        }}
      >
        {groupPlayers.map((player) => (
  <PlayerCard
    key={player.id}
    player={player}
    groups={groups}
    onDelete={removePlayer}
    onUnassign={(playerId) => handleUnassignPlayerFromGroup(playerId, group.id)}
    onUpdateGroups={(playerId, newGroups) => {
      _setPlayers((prev) => prev.map(p => p.id === playerId ? { ...p, groups: newGroups } : p));
      // Optionally, persist to backend here
    }}
  />
))}
      </div>
    </div>
  );
})}

{/* Players with no group */}
{players.filter((p) => !p.groups || p.groups.length === 0).length > 0 && (
  <div>
    <h4 style={{ color: "#666", marginBottom: "10px" }}>No Group</h4>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "10px",
      }}
    >
      {players
  .filter((p) => !p.groups || p.groups.length === 0)
  .map((player) => (
    <PlayerCard
      key={player.id}
      player={player}
      groups={groups}
      onDelete={removePlayer}
      onUpdateGroups={(playerId, newGroups) => {
        _setPlayers((prev) => prev.map(p => p.id === playerId ? { ...p, groups: newGroups } : p));
        // Optionally, persist to backend here
      }}
    />
  ))}
    </div>
  </div>
)}
          </div>
        </div>
      )}

      {/* Game Tracking View */}
      {currentView === "game" && (
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
                          setCurrentView('game');
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
                          backgroundColor: "#6c757d",
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
                      <div style={{ fontSize: "12px", opacity: 0.8 }}>
                        ({player.group})
                      </div>
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
      )}

      {/* Statistics View */}
      {currentView === "stats" && (
        <div>
          <h2 style={{ color: "#333", marginBottom: "20px" }}>Statistics</h2>

          {/* Top Performers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            {/* Top Scorers */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginBottom: "15px", color: "#28a745" }}>
                Top Scorers
              </h3>
              {getTopScorers().map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <span>
                    {index + 1}. {player.name}
                  </span>
                  <span style={{ fontWeight: "bold", color: "#28a745" }}>
                    {player.stats.total.goals} goals
                  </span>
                </div>
              ))}
            </div>

            {/* Top Assisters */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginBottom: "15px", color: "#007bff" }}>
                Top Assisters
              </h3>
              {getTopAssisters().map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <span>
                  {index + 1}. {player.name}
                  </span>
                  <span style={{ fontWeight: "bold", color: "#007bff" }}>
                    {player.stats.total.assists} assists
                  </span>
                </div>
              ))}
            </div>

            {/* Top Play Makers */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginBottom: "15px", color: "#ffc107" }}>
                Top Play Makers
              </h3>
              {getTopPlayMakers().map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <span>
                    {index + 1}. {player.name}  
                  </span>
                  <span style={{ fontWeight: "bold", color: "#ffc107" }}>
                    {player.stats.total.plays} plays
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* All Player Stats */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>All Player Statistics</h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  backgroundColor: "white",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#007bff", color: "white" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        border: "1px solid #ddd",
                      }}
                    >
                      Player
                    </th>

                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        border: "1px solid #ddd",
                      }}
                    >
                      Goals
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        border: "1px solid #ddd",
                      }}
                    >
                      Assists
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        border: "1px solid #ddd",
                      }}
                    >
                      Good Plays
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        border: "1px solid #ddd",
                      }}
                    >
                      Mistakes
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        border: "1px solid #ddd",
                      }}
                    >
                      Total Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                        }}
                      >
                        {player.name}
                      </td>
           
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        {player.stats.total.goals}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        {player.stats.total.assists}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        {player.stats.total.plays}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        {player.stats.total.mistakes}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {player.stats.total.goals + player.stats.total.assists}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
      )}
    </div>
  );
}

export default MainComponent;