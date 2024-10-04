import React, { useEffect, useState } from "react";
import * as buffer from "buffer";
import { useLocation } from "react-router-dom";
import { Game } from "../types";
import MakeBetForm from "../components/MakeBetForm";
import CurrentBets from "../components/CurrentBets";
import { formatDate } from "../utils/dateUtils";
import { useSolanaService } from "../contexts/SolanaServiceContext";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useGames } from "../contexts/GamesContext";
import "../assets/styles/MakeBet.css";
import { InsufficientFundsError } from "../types/errors";

const MakeBet: React.FC = () => {
  window.Buffer = buffer.Buffer;
  const solanaService = useSolanaService();
  const wallet = useAnchorWallet();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [makingBet, setMakingBet] = useState<boolean>(false);
  const location = useLocation();
  const { games, fetchGames } = useGames();
  const [game, setGame] = useState<Game | null>(null);

  const publicKey = (location.state as { publicKey: string })?.publicKey;

  useEffect(() => {
    if (publicKey && games) {
      const foundGame = games.find((g) => g.publicKey === publicKey);
      if (foundGame) {
        setGame(foundGame);
      } else {
        setError("Game not found.");
      }
    }
  }, [publicKey, games]);

  const handleRefresh = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setTransactionId(null);
    await fetchGames();
    const updatedGame = games?.find((g) => g.publicKey === game?.publicKey);
    if (updatedGame) {
      setGame(updatedGame);
    } else {
      setError("Game data not found after refresh.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkWalletAndData = async () => {
      setLoading(true);
      setError(null);
      setShowForm(false);

      if (!game) {
        setError("Game data not found.");
        setLoading(false);
        setSuccessMessage(null);
        setTransactionId(null);
        return;
      }

      if (!wallet) {
        setError("Please connect your wallet to make a bet.");
        setLoading(false);
        setSuccessMessage(null);
        setTransactionId(null);
        return;
      }

      if (!solanaService) {
        setError("Error connecting to Solana network");
        setLoading(false);
        setSuccessMessage(null);
        setTransactionId(null);
        return;
      }
      setShowForm(true);
      setLoading(false);
    };
    checkWalletAndData();
  }, [solanaService, wallet, game]);

  const handleFormSubmit = async (betAmount: number, prediction: number) => {
    setSuccessMessage(null);
    setMakingBet(true);
    setError(null);
    setTransactionId(null);
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

    try {
      const txId = await solanaService.makeBet(
        game!.publicKey,
        betAmount,
        prediction
      );
      if (txId instanceof InsufficientFundsError) {
        setError(
          "Error: Your account does not have enough funds for bet + Solana fees."
        );
      } else if (txId instanceof Error) {
        setError(txId.message);
      } else {
        setSuccessMessage("Bet placed successfully!");
        setTransactionId(txId);
        fetchGames();
      }
    } catch (err) {
      setError((err as Error).message || "Failed to place bet");
    } finally {
      setMakingBet(false);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Make Bet</h1>
      {loading && (
        <div className="d-flex justify-content-center my-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {game && (
        <>
          <div className="mb-4">
            <h4 className="card-title">
              {game.homeTeam} vs {game.awayTeam}
            </h4>
            <p className="card-text">{game.tournament}</p>
            <p className="card-text">{formatDate(new Date(game.startTime))}</p>
          </div>
          <CurrentBets game={game} handleRefresh={handleRefresh} />

          {showForm && <MakeBetForm game={game} onSubmit={handleFormSubmit} />}
        </>
      )}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}
      {makingBet && (
        <div className="alert alert-info" role="alert">
          Placing your bet... Please, confirm transaction in your wallet and
          wait for transaction to finish.
        </div>
      )}
      {transactionId && (
        <div className="alert alert-secondary mt-3">
          <a
            href={`https://explorer.solana.com/tx/${transactionId}?cluster=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="solana-explorer-link"
          >
            Click to view your bet transaction on Solana Explorer
          </a>
        </div>
      )}
      <br />
      {game && <p>This game - Solana address: {game.publicKey}</p>}
    </div>
  );
};

export default MakeBet;
