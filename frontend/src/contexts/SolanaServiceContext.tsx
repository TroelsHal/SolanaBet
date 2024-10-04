import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import SolanaService from "../services/solana-service";

const SolanaServiceContext = createContext<SolanaService | null>(null);

export const SolanaServiceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const solanaService = useMemo(
    () => new SolanaService(connection, wallet),
    [connection, wallet]
  );

  return (
    <SolanaServiceContext.Provider value={solanaService}>
      {children}
    </SolanaServiceContext.Provider>
  );
};

export const useSolanaService = (): SolanaService | null => {
  return useContext(SolanaServiceContext);
};
