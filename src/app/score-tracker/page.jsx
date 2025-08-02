"use client";
import React from "react";
import { storePlayer, storeGroups, storeGame, loadInitialData, createGame, unassignPlayerFromGroup, deletePlayer, deleteGroup, updatePlayerGroups } from "@/api/supabase";
import RosterManagement from "./RosterManagement";
import GameTracking from "./GameTracking";
import Statistics from "./Statistics";

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
      _setPlayers([...players, newPlayer]);
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
      {currentView === "roster" && <RosterManagement />}

      {/* Game Tracking View */}
      {currentView === "game" && <GameTracking/>}

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
        </div>
      )}
    </div>
  );
}

export default MainComponent;