"use client";
import React from "react";
import RosterManagement from "./RosterManagement";
import GameTracking from "./GameTracking";
import Statistics from "./Statistics";

function MainComponent() {
  const [currentView, setCurrentView] = React.useState("roster");

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
              backgroundColor: currentView === "roster" ? "#6a89a7" : "#f8f9fa",
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
              backgroundColor: currentView === "game" ? "#6a89a7" : "#f8f9fa",
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
              backgroundColor: currentView === "stats" ? "#6a89a7" : "#f8f9fa",
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
        <Statistics/>
      )}
    </div>
  );
}

export default MainComponent;