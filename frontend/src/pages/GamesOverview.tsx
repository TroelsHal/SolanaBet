import React, { useEffect, useState } from "react";
import * as buffer from "buffer";
import GameListDetails from "../components/GameListDetails";
import { useGames } from "../contexts/GamesContext";
import { Game } from "../types";

const GamesOverview: React.FC = () => {
  window.Buffer = buffer.Buffer;
  const [futureGames, setFutureGames] = useState<Game[]>([]);
  const [pastGames, setPastGames] = useState<Game[]>([]);
  const [showOpenGames, setShowOpenGames] = useState<boolean>(true);

  const { games, fetchGames, loading, error } = useGames();

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    if (games) {
      setFutureGames(
        games.filter((game) => game.startTime > Date.now() && game.result !== 6)
      );
      setPastGames(
        games.filter(
          (game) => game.startTime <= Date.now() || game.result === 6
        )
      );
    }
  }, [games]);

  const handleShowOpenGames = () => {
    setShowOpenGames(true);
    fetchGames();
  };

  const handleShowClosedGames = () => {
    setShowOpenGames(false);
    fetchGames();
  };

  return (
    <div>
      <h1>Games</h1>
      {/* Buttons to toggle between open and closed games */}
      <div className="button-group" style={{ marginBottom: "20px" }}>
        <button
          onClick={handleShowOpenGames}
          className={
            showOpenGames
              ? "btn btn-primary ms-2"
              : "btn btn-outline-secondary ms-2"
          }
        >
          Show open games
        </button>
        <button
          onClick={handleShowClosedGames}
          className={
            !showOpenGames
              ? "btn btn-primary ms-2"
              : "btn btn-outline-secondary ms-2"
          }
        >
          Show closed games
        </button>
      </div>
      {loading ? (
        <div className="d-flex justify-content-center my-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading games...</span>
          </div>
        </div>
      ) : error ? (
        <p>Error: {error}</p>
      ) : showOpenGames ? (
        futureGames && futureGames.length > 0 ? (
          futureGames.map((game, index) => (
            <GameListDetails key={index} game={game} />
          ))
        ) : (
          <p>No open games available</p>
        )
      ) : pastGames && pastGames.length > 0 ? (
        pastGames.map((game, index) => (
          <GameListDetails key={index} game={game} />
        ))
      ) : (
        <p>No closed games available</p>
      )}
    </div>
  );
};

export default GamesOverview;
