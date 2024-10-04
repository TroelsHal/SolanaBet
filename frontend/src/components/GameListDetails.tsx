import React from "react";
import { Game } from "../types";
import { formatDate } from "../utils/dateUtils";
import { Link } from "react-router-dom";
import "../assets/styles/GameListDetails.css";

interface GameListDetailsProps {
  game: Game;
}

const GameListDetails: React.FC<GameListDetailsProps> = ({ game }) => {
  const bettingOpen = game.startTime > Date.now();

  const calculatePercentages = () => {
    const totalBets =
      game.totalAmountDraw + game.totalAmountHome + game.totalAmountAway;
    if (totalBets === 0) {
      return { drawPercentage: 0, homePercentage: 0, awayPercentage: 0 };
    }
    const drawPercentage = (game.totalAmountDraw / totalBets) * 100;
    const homePercentage = (game.totalAmountHome / totalBets) * 100;
    const awayPercentage = (game.totalAmountAway / totalBets) * 100;
    return { drawPercentage, homePercentage, awayPercentage };
  };

  const { drawPercentage, homePercentage, awayPercentage } =
    calculatePercentages();

  const cardContent = (
    <div className="card-body d-flex justify-content-between align-items-start game-card-body ">
      <div className="game-left-section">
        <h4 className="game-card-title">
          {game.homeTeam} vs {game.awayTeam}
        </h4>
        <p className="card-text">{game.tournament}</p>
        <p className="card-text">{formatDate(new Date(game.startTime))}</p>
      </div>
      <div className="game-right-section">
        <table className="table table-sm" style={{ width: "auto" }}>
          <thead>
            <tr>
              <th scope="col" style={{ width: "120px" }}></th>
              <th scope="col" style={{ width: "80px", textAlign: "center" }}>
                1
              </th>
              <th scope="col" style={{ width: "80px", textAlign: "center" }}>
                X
              </th>
              <th scope="col" style={{ width: "80px", textAlign: "center" }}>
                2
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" style={{ width: "120px" }}>
                Current Bets
              </th>
              <td style={{ width: "80px", textAlign: "center" }}>
                {homePercentage.toFixed(2)}%
              </td>
              <td style={{ width: "80px", textAlign: "center" }}>
                {drawPercentage.toFixed(2)}%
              </td>
              <td style={{ width: "80px", textAlign: "center" }}>
                {awayPercentage.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return bettingOpen ? (
    <Link
      to="/make-bet"
      state={{ publicKey: game.publicKey }}
      className="text-decoration-none"
    >
      <div className="card clickable-card" style={{ cursor: "pointer" }}>
        {cardContent}
      </div>
    </Link>
  ) : (
    <div className="card">{cardContent}</div>
  );
};

export default GameListDetails;
