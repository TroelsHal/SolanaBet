import React, { useEffect, useState } from "react";
import CreateGameForm from "../components/CreateGameForm";
import { useSolanaService } from "../contexts/SolanaServiceContext";
import * as buffer from "buffer";
import { GameToCreate } from "../types";
import { InvalidTimeError } from "../types/errors";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

const CreateGame: React.FC = () => {
  window.Buffer = buffer.Buffer;
  const solanaService = useSolanaService();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);
      setShowForm(false);

      if (!wallet) {
        setMessage("Please connect your wallet to create new game.");
        setLoading(false);
        return;
      }

      if (!solanaService) {
        setError("Error connecting to Solana network");
        setLoading(false);
        return;
      }

      const programManager = await solanaService?.getProgramManager();
      if (!programManager) {
        setError("Error connecting to Solana network");
        setLoading(false);
        return;
      }

      const userPublicKey = wallet.publicKey;
      if (!userPublicKey) {
        setError("Wallet public key is not available.");
        setLoading(false);
        return;
      }

      if (userPublicKey.toString() !== programManager.toString()) {
        setLoading(false);
        setMessage(
          "Only the program manager can create games. Current program manager: " +
            programManager.toString()
        );
        return;
      }
      setShowForm(true);
      setLoading(false);
    };
    checkAuthorization();
  }, [solanaService, wallet]);

  const handleFormSubmit = async (
    formData: GameToCreate,
    resetForm: () => void
  ) => {
    setMessage(null);
    setLoading(true);
    setError(null);
    setPublicKey(null);
    if (!wallet) {
      setError("Please connect your wallet to create new game.");
      setLoading(false);
      return;
    }

    if (!solanaService) {
      setError("Error connecting to Solana network");
      setLoading(false);
      return;
    }

    try {
      const gamePublicKey = await solanaService.createGame(formData);
      if (gamePublicKey instanceof Error) {
        if (gamePublicKey instanceof InvalidTimeError) {
          setError("Invalid time");
        } else {
          setError(gamePublicKey.message);
        }
      } else {
        setMessage("Game created successfully.");
        setPublicKey(gamePublicKey);
        resetForm();
      }
    } catch (error) {
      setError((error as Error).message || "Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Create Game</h1>
      {showForm && <CreateGameForm onSubmit={handleFormSubmit} />}
      {error && <p>Error: {error}</p>}
      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}
      {publicKey && <p>Game public key: {publicKey}</p>}
    </div>
  );
};

export default CreateGame;
