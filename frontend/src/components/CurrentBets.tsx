import React from "react";
import { Game } from "../types";
import "../assets/styles/CurrentBets.css";

interface CurrentBetsProps {
  game: Game;
  handleRefresh: () => void;
}

const CurrentBets: React.FC<CurrentBetsProps> = ({ game, handleRefresh }) => {
  const homeBets = game.totalAmountHome;
  const awayBets = game.totalAmountAway;
  const drawBets = game.totalAmountDraw;
  const totalBets = homeBets + awayBets + drawBets;

  const homeBetsPercentage = totalBets > 0 ? (homeBets / totalBets) * 100 : 0;
  const awayBetsPercentage = totalBets > 0 ? (awayBets / totalBets) * 100 : 0;
  const drawBetsPercentage = totalBets > 0 ? (drawBets / totalBets) * 100 : 0;

  return (
    <div className="my-4 current-bets-container">
      <div className="current-bets-header mb-3">
        <h4 className="mb-0">Current bets - all users:</h4>
        <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
      <div className="table-responsive current-bets-table">
        <table className="table table-striped table-bordered">
          <tbody>
            <tr>
              <td>{game.homeTeam}</td>
              <td>{homeBetsPercentage.toFixed(2)}%</td>
              <td className="text-end">{homeBets} Lamports</td>
            </tr>
            <tr>
              <td>Draw</td>
              <td>{drawBetsPercentage.toFixed(2)}%</td>
              <td className="text-end">{drawBets} Lamports</td>
            </tr>
            <tr>
              <td>{game.awayTeam}</td>
              <td>{awayBetsPercentage.toFixed(2)}%</td>
              <td className="text-end">{awayBets} Lamports</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrentBets;
