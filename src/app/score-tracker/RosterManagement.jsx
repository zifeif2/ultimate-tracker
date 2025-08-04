import React from "react";
import PlayerCard from "./PlayerCard";

import { storeGroups, deleteGroup, deletePlayer, loadInitialData, unassignPlayerFromGroup, storePlayer } from "@/api/supabase";

export default function RosterManagement() {
  
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
  
    const onUpdatePlayerGroups = (playerId, newGroups) => {
      _setPlayers((prev) => prev.map(p => p.id === playerId ? { ...p, groups: newGroups } : p));
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
  
    const [players, _setPlayers] = React.useState([]);
    const [groups, _setGroups] = React.useState([]);
    const [newPlayerName, setNewPlayerName] = React.useState("");
    const [newGroupName, setNewGroupName] = React.useState("");
    const [selectedGroups, setSelectedGroups] = React.useState([]);

    React.useEffect( () => {
    
      const setInitialData = async () => {
      const {playersData, groupsData, gamesData} = await loadInitialData();
      _setPlayers(playersData || []);
      _setGroups(groupsData || []);
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

    const setGroups = async (groupName) => {
      const newGroup = await storeGroups(groupName)
      _setGroups([...groups, newGroup]);
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
        await storePlayer(newPlayer); // Persist to backend
        setNewPlayerName("");
        _setPlayers([...players, newPlayer]);
      }
    };
  
    // Add group
    const addGroup = () => {
      if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
        setGroups(newGroupName.trim());
        setNewGroupName("");
      }
    };

  return (
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
              backgroundColor: "#6a89a7",
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
            <div key={group.id} className="px-3 py-1 rounded-full bg-blue-200 text-slate-700 text-sm flex items-center">
              <span>{group.name}</span>
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
              </button>
            </div>
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
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 border ${selectedGroups.includes(group.id) ? 'bg-purple-100 border-purple-200 text-slate-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
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
              backgroundColor: "#6a89a7",
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
                    key={`${group.id}-${player.id}`}
                    player={player}
                    groups={groups}
                    onDelete={removePlayer}
                    onUnassign={(playerId) => handleUnassignPlayerFromGroup(playerId, group.id)}
                    onUpdateGroups={(playerId, newGroups) => _setPlayers((prev) => prev.map(p => p.id === playerId ? { ...p, groups: newGroups } : p))}
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
                    key={`nogroup-${player.id}`}
                    player={player}
                    groups={groups}
                    onDelete={removePlayer}
                    onUpdateGroups={onUpdatePlayerGroups}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

