import React from "react";
import PlayerCard from "./PlayerCard";

import { storeGroups, deleteGroup, deletePlayer, loadInitialData, unassignPlayerFromGroup, storePlayer, updatePlayerGroups } from "@/api/supabase";

export default function RosterManagement() {
  const [editingGroupId, setEditingGroupId] = React.useState(null);
  const [editingGroupPlayers, setEditingGroupPlayers] = React.useState([]);
  const [savingGroupEdit, setSavingGroupEdit] = React.useState(false);
  const [groupEditError, setGroupEditError] = React.useState(null);

  // Start editing a group
  const handleEditGroup = (groupId) => {
    setEditingGroupId(groupId);
    // Find all players currently in this group
    const currentPlayers = players.filter(p => (p.groups || []).includes(groupId)).map(p => p.id);
    setEditingGroupPlayers(currentPlayers);
    setGroupEditError(null);
  };

  // Toggle player selection for editing group
  const handleTogglePlayerInGroup = (playerId) => {
    setEditingGroupPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Save group edits and update backend
  const handleSaveGroupEdit = async () => {
    setSavingGroupEdit(true);
    setGroupEditError(null);
    try {
      // For each player, add/remove group in their groups array
      const updatedPlayers = players.map(player => {
        let newGroups = player.groups || [];
        if (editingGroupPlayers.includes(player.id)) {
          // Add group if not present
          if (!newGroups.includes(editingGroupId)) newGroups = [...newGroups, editingGroupId];
        } else {
          // Remove group if present
          if (newGroups.includes(editingGroupId)) newGroups = newGroups.filter(gid => gid !== editingGroupId);
        }
        return { ...player, groups: newGroups };
      });
      // Only update backend for players whose group membership changed
      const updatePromises = updatedPlayers.map((player, idx) => {
        const prevGroups = players[idx].groups || [];
        const newGroups = player.groups || [];
        const changed =
          prevGroups.length !== newGroups.length ||
          prevGroups.some(g => !newGroups.includes(g)) ||
          newGroups.some(g => !prevGroups.includes(g));
        if (changed) {
          return updatePlayerGroups(player.id, newGroups);
        }
        return null;
      }).filter(Boolean);
      await Promise.all(updatePromises);
      _setPlayers(updatedPlayers);
      setEditingGroupId(null);
      setEditingGroupPlayers([]);
    } catch (err) {
      setGroupEditError("Failed to update group membership. Please try again.");
    } finally {
      setSavingGroupEdit(false);
    }
  };

  // Cancel editing
  const handleCancelGroupEdit = () => {
    setEditingGroupId(null);
    setEditingGroupPlayers([]);
    setGroupEditError(null);
  };
  
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
      {/* Edit Group Modal/Inline UI */}
      {editingGroupId && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 8, minWidth: 340, boxShadow: '0 2px 16px #0002' }}>
            <h3>Edit Group Membership</h3>
            <div style={{ maxHeight: 320, overflowY: 'auto', margin: '16px 0' }}>
              {players.length === 0 && <div>No players available.</div>}
              {[...players].sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={editingGroupPlayers.includes(player.id)}
                    onChange={() => handleTogglePlayerInGroup(player.id)}
                    id={`edit-group-player-${player.id}`}
                    disabled={savingGroupEdit}
                  />
                  <label htmlFor={`edit-group-player-${player.id}`} style={{ marginLeft: 8 }}>{player.name}</label>
                </div>
              ))}
            </div>
            {groupEditError && <div style={{ color: 'red', marginBottom: 8 }}>{groupEditError}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={handleCancelGroupEdit} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#f5f5f5', color: '#555' }} disabled={savingGroupEdit}>Cancel</button>
              <button onClick={handleSaveGroupEdit} style={{ padding: '6px 16px', borderRadius: 4, background: '#6a89a7', color: 'white', border: 'none' }} disabled={savingGroupEdit}>{savingGroupEdit ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

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
                <button
                  style={{ marginLeft: 8, fontSize: 14, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => handleEditGroup(group.id)}
                >
                  ✏️ Edit Group
                </button>
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

