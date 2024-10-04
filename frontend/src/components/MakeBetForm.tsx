import React, { useEffect, useState } from "react";
import { Game } from "../types";
import { getPotentialWinnings } from "../utils/winningsUtils";
import "../assets/styles/MakeBetForm.css";

interface MakeBetFormProps {
  game: Game;
  onSubmit: (betAmount: number, prediction: number) => void;
}

const MakeBetForm: React.FC<MakeBetFormProps> = ({ game, onSubmit }) => {
  const [betAmount, setBetAmount] = useState<number>(0);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [potentialWinnings, setPotentialWinnings] = useState<number>(0);

  useEffect(() => {
    if (betAmount > 0 && prediction !== null) {
      setPotentialWinnings(getPotentialWinnings(game, betAmount, prediction));
    }
  }, [betAmount, prediction, game]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prediction !== null && betAmount > 0) {
      onSubmit(betAmount, prediction);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="make-bet-form-container">
      <div className="form-group prediction-group">
        <label htmlFor="prediction" className="form-label">
          Choose result
        </label>
        <select
          id="prediction"
          className="form-select prediction-select"
          value={prediction === null ? "" : prediction}
          onChange={(e) => setPrediction(parseInt(e.target.value, 10))}
          required
        >
          <option value="" disabled>
            &lt;Result&gt;
          </option>
          <option value="1">{game.homeTeam} Wins</option>
          <option value="0">Draw</option>
          <option value="2">{game.awayTeam} Wins</option>
        </select>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-submit"
        disabled={prediction === null || betAmount <= 0}
      >
        Place Bet
      </button>

      <div className="form-group amount-group">
        <label htmlFor="betAmount" className="form-label">
          Bet Amount (in Lamports)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="form-control bet-amount-input"
          id="betAmount"
          value={betAmount > 0 ? betAmount : ""}
          onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
          required
          maxLength={16}
          onKeyDown={(e) => e.key === "e" && e.preventDefault()}
        />
      </div>

      <div className="form-group amount-group">
        {prediction !== null && betAmount > 0 ? (
          <h5>
            <strong>Potential Winnings:</strong> {potentialWinnings} Lamports
          </h5>
        ) : (
          <h5>&nbsp;</h5>
        )}
      </div>
    </form>
  );
};

export default MakeBetForm;
