import React from "react";
import { loadInitialData } from "@/api/supabase";
import ReactMarkdown from 'react-markdown';

// Remove fs and readFile. Use useEffect to fetch the static file from /chatgpt/NOTE_SYSTEM_MESSAGE.txt

export default function Statistics() {
  const [noteSystemMessage, setNoteSystemMessage] = React.useState("");

  React.useEffect(() => {
    fetch("/chatgpt/NOTE_SYSTEM_MESSAGE.txt")
      .then(res => res.text())
      .then(setNoteSystemMessage)
      .catch(() => setNoteSystemMessage(""));
  }, []);

  const [players, _setPlayers] = React.useState([]);
  const [games, _setGames] = React.useState([]);
  const [selectedTournament, setSelectedTournament] = React.useState('');
  const [selectedGame, setSelectedGame] = React.useState('');
  const playerPerGameStats = [];

  // Get all unique tournaments from games
  const tournaments = React.useMemo(() => {
    return Array.from(new Set((games || []).map(g => g.tournament).filter(Boolean)));
  }, [games]);

  // Get all games in the selected tournament
  const gamesInTournament = React.useMemo(() => {
    if (!selectedTournament) return [];
    return games.filter(g => g.tournament === selectedTournament);
  }, [games, selectedTournament]);

  // Get all game IDs in the selected tournament or selected game
  const gameIdsForStats = React.useMemo(() => {
    if (!selectedTournament) return [];
    if (selectedGame) return [selectedGame];
    return gamesInTournament.map(g => String(g.id));
  }, [selectedTournament, selectedGame, gamesInTournament]);

  // Helper to aggregate stats for a player over selected tournament only
  function getTournamentStats(player) {
    // If no tournament selected, fallback to total
    // If no tournament selected, fallback to total
    if (!selectedTournament) return player.stats.total;
    const agg = { goals: 0, assists: 0, plays: 0, mistakes: 0 };

    // Gather all points from the relevant games
    let relevantGames = [];
    if (selectedGame) {
      relevantGames = games.filter(g => String(g.id) === selectedGame);
    } else {
      relevantGames = games.filter(g => g.tournament === selectedTournament);
    }

    for (const game of relevantGames) {
     const tmp_agg = playerPerGameStats[game.id]?.[player.id] || { goals: 0, assists: 0, plays: 0, mistakes: 0 };
     if (!playerPerGameStats[game.id] || !playerPerGameStats[game.id][player.id]) {
        game.points.forEach(pt => {
          if (pt.scorer && String(pt.scorer) === String(player.id)) tmp_agg.goals += 1;
          if (pt.assister && String(pt.assister) === String(player.id)) tmp_agg.assists += 1;
          if (Array.isArray(pt.mistakes)) {
            tmp_agg.mistakes += pt.mistakes.filter(m => String(m.player) === String(player.id)).length;
          }
          if (Array.isArray(pt.plays)) {
            tmp_agg.plays += pt.plays.filter(p => String(p.player) === String(player.id)).length;
          }
        });
      }
      playerPerGameStats[game.id] = playerPerGameStats[game.id] || {};
      playerPerGameStats[game.id][player.id] = tmp_agg;
      agg.goals += tmp_agg.goals;
      agg.assists += tmp_agg.assists;
      agg.plays += tmp_agg.plays;
      agg.mistakes += tmp_agg.mistakes;
    }
    return agg;
  }

  const [summaryNote, setSummaryNote] = React.useState("");
  const [loadingSummary, setLoadingSummary] = React.useState(false);

  async function handleSummarizeNote() {
    setLoadingSummary(true);
    setSummaryNote("");
    let notes = [];
    try {
      if (selectedGame) {
        // Here we use '==' instead of '===' because the id is a number but selectedGame is a string
        let points = gamesInTournament.find(g => g.id == selectedGame)?.points || [];
        for (const point of points) {
          const note_per_point = { winner: point.winner, strategy: point.strategy, good: point.plays, bad: point.mistakes };
          notes.push(note_per_point);
        }
      } else if (selectedTournament) {
        for (const game of gamesInTournament) {
          for (const point of game.points) {
            const note_per_point = { winner: point.winner, strategy: point.strategy, good: point.plays, bad: point.mistakes };
            notes.push(note_per_point);
          }
        }
      } else {
        setSummaryNote("Please select a game or tournament to summarize notes.");
        setLoadingSummary(false);
        return;
      }
      if (notes.length === 0) {
        setSummaryNote("No notes to summarize.");
        setLoadingSummary(false);
        return;
      }
      const response = await fetch('http://localhost:8000/summarizeNotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
        mode: 'cors', // <--- add this to avoid OPTIONS request
      });
      const j = await response.json()
      const msg = j["summary"]

      setSummaryNote(msg);
    } catch (err) {
      console.log(err);
      setSummaryNote("Error generating summary note.");
    } finally {
      setLoadingSummary(false);
    }
  }

  React.useEffect(() => {
    const setInitialData = async () => {
      const { playersData, gamesData } = await loadInitialData();
      _setPlayers(playersData || []);
      _setGames(gamesData || []);
    }
    setInitialData();
  }, []);

  // Get player stats for selected tournament
  const getTopScorers = () => {
    return [...players]
      .map(p => ({ ...p, _tStats: getTournamentStats(p) }))
      .sort((a, b) => b._tStats.goals - a._tStats.goals)
      .slice(0, 5);
  };

  const getTopAssisters = () => {
    return [...players]
      .map(p => ({ ...p, _tStats: getTournamentStats(p) }))
      .sort((a, b) => b._tStats.assists - a._tStats.assists)
      .slice(0, 5);
  };

  // New function to get top play makers
  const getTopPlayMakers = () => {
    return [...players]
      .map(p => ({ ...p, _tStats: getTournamentStats(p) }))
      .sort((a, b) => b._tStats.plays - a._tStats.plays)
      .slice(0, 5);
  };

  return (
    <div>
      <h2 style={{ color: "#333", marginBottom: "20px" }}>Statistics</h2>
      {/* Tournament Dropdown */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 10, fontWeight: 600 }}>Tournament:</label>
        <select
          value={selectedTournament}
          onChange={e => {
            setSelectedTournament(e.target.value);
            setSelectedGame(''); // Reset game selection when tournament changes
          }}
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', minWidth: 180 }}
        >
          <option value="">All Tournaments</option>
          {tournaments.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      {/* Game Dropdown Panel */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ marginRight: 10, fontWeight: 600, color: selectedTournament ? undefined : '#aaa' }}>Game:</label>
        <select
          value={selectedGame}
          onChange={e => setSelectedGame(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', minWidth: 180 }}
          disabled={!selectedTournament}
        >
          <option value="">All Games</option>
          {gamesInTournament.map(g => (
            <option key={g.id} value={g.id}>{g.name || `${g.opponent} - ${new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(g.created_at))}`}</option>
          ))}
        </select>
      </div>
      {/* Summarize Note Button and Display */}
      {selectedTournament && <div style={{ marginBottom: 24 }}>
        <button
          onClick={handleSummarizeNote}
          disabled={loadingSummary}
          style={{
            padding: '8px 18px',
            fontWeight: 600,
            background: loadingSummary ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loadingSummary ? 'not-allowed' : 'pointer',
            marginRight: 16
          }}
        >
          {loadingSummary ? 'Summarizing...' : 'Summarize Note'}
        </button>
        {summaryNote && (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Summary Note</summary>
            <div style={{ padding: '12px', background: '#f1f1f1', borderRadius: 6, maxWidth: 800 }}>
              <ReactMarkdown>{summaryNote}</ReactMarkdown>
            </div>
          </details>
        )}
      </div>}

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
                {player._tStats.goals} goals
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
                {player._tStats.assists} assists
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
                {player._tStats.plays} plays
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
              {players.map((player) => {
                const tStats = getTournamentStats(player);
                return (
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
                      {tStats.goals}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        textAlign: "center",
                      }}
                    >
                      {tStats.assists}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        textAlign: "center",
                      }}
                    >
                      {tStats.plays}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        textAlign: "center",
                      }}
                    >
                      {tStats.mistakes}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {tStats.goals + tStats.assists}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


