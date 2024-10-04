import React, { useEffect, useState } from "react";
import * as buffer from "buffer";
import DeclareResultListDetails from "../components/DeclareResultListDetails";
import { useGames } from "../contexts/GamesContext";
import { Game } from "../types";
import { useSolanaService } from "../contexts/SolanaServiceContext";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

const DeclareResult: React.FC = () => {
  window.Buffer = buffer.Buffer;
  const { games, fetchGames, loading, error } = useGames();
  const wallet = useAnchorWallet();
  const solanaService = useSolanaService();
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showList, setShowList] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      setAuthLoading(true);
      setAuthError(null);
      setMessage(null);
      setShowList(false);

      if (!wallet) {
        setMessage("Please connect your wallet to declare results.");
        setAuthLoading(false);
        return;
      }

      if (!solanaService) {
        setAuthError("Error connecting to Solana network");
        setAuthLoading(false);
        return;
      }

      const programManager = await solanaService?.getProgramManager();
      if (!programManager) {
        setAuthError("Error connecting to Solana network");
        setAuthLoading(false);
        return;
      }

      const userPublicKey = wallet.publicKey;
      if (!userPublicKey) {
        setAuthError("Wallet public key is not available.");
        setAuthLoading(false);
        return;
      }

      if (userPublicKey.toString() !== programManager.toString()) {
        setMessage("Only the program manager can declare results.");
        setAuthLoading(false);
        return;
      }
      setShowList(true);
      setAuthLoading(false);
      await fetchGames();
    };
    checkAuthorization();
  }, [solanaService, wallet, fetchGames]);

  const gamesBettingEnded = games?.filter((game: Game) => {
    return game.startTime <= Math.floor(Date.now()) && game.result === 255;
  });

  return (
    <div>
      <h1>Games</h1>
      {(loading || authLoading) && <p>Loading...</p>}
      {message && <p>{message}</p>}
      {(error || authError) && <p>Error: {error}</p>}
      {showList &&
        (gamesBettingEnded && gamesBettingEnded.length > 0 ? (
          gamesBettingEnded.map((game, index) => (
            <DeclareResultListDetails key={index} game={game} />
          ))
        ) : (
          <p>No games available</p>
        ))}
    </div>
  );
};

export default DeclareResult;
