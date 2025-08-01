import React, { useState } from "react";
import { updatePlayerGroups } from "@/api/supabase";

export default function PlayerCard({ player, groups, onDelete, onUnassign, onUpdateGroups }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState(player.groups || []);

  const handleOpenModal = () => {
    setSelectedGroups(player.groups || []);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSave = async () => {
    await updatePlayerGroups(player.id, selectedGroups);
    onUpdateGroups(player.id, selectedGroups);
    setModalOpen(false);
  };

  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "5px",
        position: "relative",
        cursor: "pointer",
      }}
      onClick={handleOpenModal}
    >
      <strong>{player.name}</strong>
      <button
        title="Delete player"
        onClick={(e) => { e.stopPropagation(); onDelete(player.id); }}
        style={{
          position: "absolute",
          top: 8,
          right: 36,
          background: "none",
          border: "none",
          color: "#dc3545",
          fontSize: "18px",
          cursor: "pointer",
        }}
        aria-label={`Delete ${player.name}`}
      >
        🗑️
      </button>
      {onUnassign && (
        <button
          title="Unassign from group"
          onClick={(e) => { e.stopPropagation(); onUnassign(player.id); }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "none",
            border: "none",
            color: "#dc3545",
            fontSize: "18px",
            cursor: "pointer",
          }}
          aria-label={`Unassign ${player.name} from group`}
        >
          ✖
        </button>
      )}
      <div
        style={{
          fontSize: "12px",
          color: "#666",
          marginTop: "5px",
        }}
      >
        Goals: {player.stats?.total?.goals ?? 0} | Assists: {player.stats?.total?.assists ?? 0} | Plays: {player.stats?.total?.plays ?? 0} | Mistakes: {player.stats?.total?.mistakes ?? 0}
      </div>
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "white",
              padding: "24px 32px",
              borderRadius: "8px",
              minWidth: "300px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
              position: "relative",
            }}
            onClick={e => e.stopPropagation()}
          >
            <h4 style={{ marginBottom: "16px" }}>Edit Groups for {player.name}</h4>
            <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "16px" }}>
              {groups.map(group => (
                <label key={group.id} style={{ display: "block", marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group.id)}
                    onChange={() => handleGroupChange(group.id)}
                  />
                  <span style={{ marginLeft: 8 }}>{group.name}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={handleCloseModal} style={{ padding: "6px 16px" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "6px 16px", background: "#007bff", color: "white", border: "none", borderRadius: 4 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
