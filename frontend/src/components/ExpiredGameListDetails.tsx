import React from "react";
import { ExpiredGame } from "../types";
import { formatDate } from "../utils/dateUtils";
import { EXPIRATION_TIME_MILLISECONDS } from "../config/constants";

interface ExpiredGameListDetailsProps {
  game: ExpiredGame;
  onCloseGame: (gamePublicKey: string) => void;
}

const ExpiredGameListDetails: React.FC<ExpiredGameListDetailsProps> = ({
  game,
  onCloseGame,
}) => {
  const handleCardClick = () => {
    onCloseGame(game.publicKey);
  };

  return (
    <div
      className="card mb-4 shadow-sm w-100 clickable clickable-card"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <div className="card-body">
        <div className="row">
          {/* Left Column */}
          <div className="col-md-6">
            <h5 className="card-title">
              {game.homeTeam} vs {game.awayTeam}
            </h5>
            <p className="card-text">
              <strong>Game Start:</strong>{" "}
              {formatDate(new Date(game.startTime))}
            </p>
            <p className="card-text">
              <strong>Result Declared:</strong>{" "}
              {formatDate(new Date(game.resultDeclaredTime))}
            </p>
            <p className="card-text">
              <strong>Earliest Closing:</strong>{" "}
              {formatDate(
                new Date(game.resultDeclaredTime + EXPIRATION_TIME_MILLISECONDS)
              )}
            </p>
          </div>

          {/* Right Column */}
          <div className="col-md-6">
            <p className="card-text">
              <strong>Tournament:</strong> {game.tournament}
            </p>

            <p className="card-text">
              <strong>Game Balance:</strong> {game.balance / 1e9} SOL
            </p>
            <p className="card-text">
              <strong>Public Key:</strong> {game.publicKey}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiredGameListDetails;
