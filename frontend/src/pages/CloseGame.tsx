import React, { useEffect, useState } from "react";
import { useSolanaService } from "../contexts/SolanaServiceContext";
import * as buffer from "buffer";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useGames } from "../contexts/GamesContext";
import { ExpiredGame } from "../types";
import ExpiredGameListDetails from "../components/ExpiredGameListDetails";
import { EXPIRATION_TIME_MILLISECONDS } from "../config/constants";
import { PublicKey } from "@solana/web3.js";
import "bootstrap/dist/css/bootstrap.min.css";

const CloseGame: React.FC = () => {
  window.Buffer = buffer.Buffer;
  const solanaService = useSolanaService();
  const wallet = useAnchorWallet();
  const [componentLoading, setComponentLoading] = useState<boolean>(false);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [expiredGamesWithBalance, setExpiredGamesWithBalance] = useState<
    ExpiredGame[]
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [showList, setShowList] = useState<boolean>(false);

  const { games, fetchGames, loading, error } = useGames();

  useEffect(() => {
    const checkAuthorization = async () => {
      setComponentLoading(true);
      setComponentError(null);
      setMessage(null);
      setShowList(false);

      if (!wallet) {
        setComponentError("Please connect your wallet to close games.");
        setComponentLoading(false);
        return;
      }

      if (!solanaService) {
        setComponentError("Error connecting to Solana network");
        setComponentLoading(false);
        return;
      }

      const programManager = await solanaService.getProgramManager();
      if (!programManager) {
        setComponentError("Error connecting to Solana network");
        setComponentLoading(false);
        return;
      }

      const userPublicKey = wallet.publicKey;
      if (!userPublicKey) {
        setComponentError("Wallet public key is not available.");
        setComponentLoading(false);
        return;
      }

      if (userPublicKey.toString() !== programManager.toString()) {
        setComponentLoading(false);
        setComponentError("Only the program manager can close games.");
        return;
      }
      setShowList(true);
      setComponentLoading(false);
    };
    checkAuthorization();
  }, [solanaService, wallet]);

  // Fetch games every time the component mounts
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    const fetchExpiredGamesWithBalance = async () => {
      if (games && solanaService) {
        const expiredGames = games.filter(
          (game) =>
            game.result !== 255 &&
            game.resultDeclaredTime + EXPIRATION_TIME_MILLISECONDS < Date.now()
        );

        if (expiredGames.length === 0) {
          setExpiredGamesWithBalance([]);
          return;
        }

        try {
          const expiredGamesWithBalancePromises = expiredGames.map(
            async (game) => {
              const balance = await solanaService.getBalance(
                new PublicKey(game.publicKey)
              );
              if (balance instanceof Error) {
                throw new Error("Error fetching game balance.");
              }

              return {
                ...game,
                balance: balance,
              } as ExpiredGame;
            }
          );

          const results = await Promise.all(expiredGamesWithBalancePromises);
          setExpiredGamesWithBalance(results);
        } catch (err) {
          console.error("Error fetching game balances:", err);
          setComponentError("Error fetching game balances.");
        }
      }
    };

    fetchExpiredGamesWithBalance();
  }, [games, solanaService]);

  const handleCloseGame = async (gamePublicKey: string) => {
    setComponentLoading(true);

    if (!solanaService) {
      setComponentError("Error connecting to Solana network");
      setComponentLoading(false);
      return;
    }
    if (!wallet) {
      setComponentError("Please connect your wallet to close games.");
      setComponentLoading(false);
      return;
    }
    try {
      const txID = await solanaService.closeGame(gamePublicKey);
      if (txID instanceof Error) {
        throw txID;
      }
      setMessage(
        `Game with PublicKey ${gamePublicKey} has been closed successfully.`
      );
    } catch (error) {
      console.error("Error closing the game:", error);
      setComponentError(`Error closing game with PublicKey ${gamePublicKey}`);
    } finally {
      setComponentLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Close Game</h1>
      {error && <div className="alert alert-danger">Error: {error}</div>}
      {componentError && (
        <div className="alert alert-danger">Error: {componentError}</div>
      )}
      {loading && <div className="alert alert-info">Loading games...</div>}
      {componentLoading && (
        <div className="alert alert-info">Loading authorization...</div>
      )}
      {message && <div className="alert alert-success">{message}</div>}
      {showList && (
        <div>
          {expiredGamesWithBalance.length === 0 ? (
            <div className="alert alert-secondary">No games to close</div>
          ) : (
            <div className="d-flex flex-column w-100">
              {expiredGamesWithBalance.map((game) => (
                <ExpiredGameListDetails
                  key={game.publicKey}
                  game={game}
                  onCloseGame={handleCloseGame}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CloseGame;
