import React from "react";
import { BetExtended, GameState } from "../types";
import "../assets/styles/MyBetsListDetails.css"; // Import the new CSS file

interface MyBetsListDetailsProps {
  betExtended: BetExtended;
}

const MyBetsListDetails: React.FC<MyBetsListDetailsProps> = ({
  betExtended,
}) => {
  const getGameStateLabel = (gameState: GameState) => {
    switch (gameState) {
      case GameState.Open:
        return "Betting Open";
      case GameState.Declared:
        return "Result ready";
      case GameState.NoWinner:
        return "No winning betters, all bets refunded";
      case GameState.Cancelled:
        return "Cancelled, all bets refunded";
      case GameState.Closed:
        return "Waiting for result";
      default:
        return "Unknown";
    }
  };

  const getLabelClass = (gameState: GameState) => {
    switch (gameState) {
      case GameState.NoWinner:
        return "badge bg-primary text-light"; // Blue background, white text
      case GameState.Open:
        return "badge bg-danger text-light"; // Red background, white text
      case GameState.Closed:
        return "badge bg-warning text-dark"; // Yellow background, dark text
      case GameState.Declared:
        return "badge bg-success text-light"; // Green background, white text
      case GameState.Cancelled:
        return "badge bg-secondary text-light"; // Gray background, white text
      default:
        return "badge bg-dark text-light"; // Dark background, white text for unknown states
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp); // Convert seconds to milliseconds
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  const getPredictionText = (prediction: number) => {
    switch (prediction) {
      case 0:
        return "Draw";
      case 1:
        return betExtended.game.homeTeam + " to win";
      case 2:
        return betExtended.game.awayTeam + " to win";
      default:
        return "Unknown";
    }
  };

  const getResultText = (result: number) => {
    if (result >= 3 && result <= 5) {
      result -= 3;
    }
    switch (result) {
      case 0:
        return "Draw";
      case 1:
        return betExtended.game.homeTeam + " won";
      case 2:
        return betExtended.game.awayTeam + " won";
      case 6:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">
          {betExtended.game.homeTeam} vs {betExtended.game.awayTeam}
        </h5>
        <h6 className="card-subtitle mb-2 text-muted">
          {betExtended.game.tournament} -{" "}
          {formatDate(betExtended.game.startTime)}
        </h6>
        <span className={getLabelClass(betExtended.gameState)}>
          {getGameStateLabel(betExtended.gameState)}
        </span>

        <div className="bet-details">
          <p className="card-text bet-details-prediction">
            <strong>My Bet:</strong> {getPredictionText(betExtended.prediction)}
          </p>
          <p className="card-text bet-details-amount">
            <strong>Bet Amount:</strong> {betExtended.amount} lamports
          </p>
        </div>

        {(betExtended.gameState === GameState.Declared ||
          betExtended.gameState === GameState.NoWinner ||
          betExtended.gameState === GameState.Cancelled) && (
          <>
            <p className="card-text">
              <strong>Result:</strong>
              {"\u00A0"}
              {"\u00A0"}
              {getResultText(betExtended.game.result)}
            </p>
            {betExtended.winnings > 0 && (
              <p className="card-text mt-2 mb-0">
                <strong>
                  {betExtended.gameState === GameState.Declared ? (
                    <>Winnings</>
                  ) : (
                    <>Refund</>
                  )}
                  :
                </strong>{" "}
                <span style={{ color: "green", fontWeight: "bold" }}>
                  {betExtended.winnings} lamports
                </span>
              </p>
            )}
            <p className="card-text mb-0">
              <strong>Unused Solana fee:</strong>{" "}
              <span style={{ color: "green", fontWeight: "bold" }}>
                {betExtended.balance} lamports
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default MyBetsListDetails;
