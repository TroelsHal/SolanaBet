import React, { useState } from "react";
import { Game } from "../types";
import { formatDate } from "../utils/dateUtils";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useSolanaService } from "../contexts/SolanaServiceContext";

interface DeclareResultListDetailsProps {
  game: Game;
}

const DeclareResultListDetails: React.FC<DeclareResultListDetailsProps> = ({
  game,
}) => {
  const wallet = useAnchorWallet();
  const solanaService = useSolanaService();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultDeclaredmessage, setResultDeclaredMessage] = useState<
    string | null
  >(null);

  const handleDeclareClick = () => {
    setShowForm(true);
  };

  const handleCancelClick = () => {
    setShowForm(false);
    setResult(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResultDeclaredMessage(null);
    setLoading(true);
    setError(null);
    if (!wallet) {
      setError("Please connect your wallet to make a bet.");
      setLoading(false);
      return;
    }

    if (!solanaService) {
      setError("Error connecting to Solana network");
      setLoading(false);
      return;
    }

    if (result === null) {
      setError("Error declaring result without setting result");
      setLoading(false);
      return;
    }

    try {
      const txId = await solanaService.declareResult(game.publicKey, result);
      if (txId instanceof Error) {
        setError(txId.message);
      } else {
        setResultDeclaredMessage("Result declared: " + result);
        setShowForm(false);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to declare result");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-card">
      <h2>
        {game.homeTeam} vs {game.awayTeam}
      </h2>
      <p>Tournament: {game.tournament}</p>
      {resultDeclaredmessage ? (
        <p>{resultDeclaredmessage}</p>
      ) : (
        <p>Betting ends: {formatDate(new Date(game.startTime))}</p>
      )}
      {showForm ? (
        <form onSubmit={handleSubmit}>
          <select
            id="result"
            value={result !== null ? result : ""}
            onChange={(e) => setResult(parseInt(e.target.value, 10))}
            required
          >
            <option value="" disabled>
              Select result
            </option>
            <option value={1}>Home Team - {game.homeTeam} - Won</option>
            <option value={0}>Draw</option>
            <option value={2}>Away Team - {game.awayTeam} - Won</option>
            <option value={6}>Cancelled</option>
          </select>
          <div>
            <button type="submit" disabled={result === null || loading}>
              Send
            </button>
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        !resultDeclaredmessage && (
          <button onClick={handleDeclareClick}>Declare Result</button>
        )
      )}
      {error && <p>Error: {error}</p>}
      {loading && <p>Loading...</p>}
    </div>
  );
};

export default DeclareResultListDetails;
