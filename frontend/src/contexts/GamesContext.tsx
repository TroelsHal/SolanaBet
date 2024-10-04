import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Game } from "../types";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { SolanaError } from "../types/errors";
import { useSolanaService } from "../contexts/SolanaServiceContext";

interface GamesContextType {
  games: Game[] | null;
  fetchGames: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export const GamesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [games, setGames] = useState<Game[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const solanaService = useSolanaService();

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!solanaService) {
      setError("Error connecting to Solana network");
      setLoading(false);
      return;
    }

    const gamesResult = await solanaService.getAllGames();
    if (gamesResult instanceof Error) {
      switch (true) {
        case gamesResult instanceof WalletNotConnectedError:
          setError("Wallet not connected");
          break;
        case gamesResult instanceof SolanaError:
          setError(gamesResult.message);
          break;
        default:
          setError("Unknown error");
      }
    } else {
      // sort games by betting end time
      gamesResult.sort((a, b) => a.startTime - b.startTime);
      setGames(gamesResult);
    }
    setLoading(false);
  }, [solanaService]);
  useEffect(() => {
    // Fetch games on initial load
    fetchGames();
  }, [fetchGames]);

  return (
    <GamesContext.Provider value={{ games, fetchGames, loading, error }}>
      {children}
    </GamesContext.Provider>
  );
};

export const useGames = (): GamesContextType => {
  const context = useContext(GamesContext);
  if (!context) {
    throw new Error("useGames must be used within a GamesProvider");
  }
  return context;
};
