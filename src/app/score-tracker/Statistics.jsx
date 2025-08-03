import React from "react";
import { loadInitialData } from "@/api/supabase";

export default function Statistics() {
  const [players, _setPlayers] = React.useState([]);
  const [games, _setGames] = React.useState([]);

  React.useEffect( () => {
  
    const setInitialData = async () => {
    const {playersData, gamesData} = await loadInitialData();
    _setPlayers(playersData || []);
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
  );
}


