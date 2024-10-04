import React, { useEffect, useState } from "react";
import { useSolanaService } from "../contexts/SolanaServiceContext";
import * as buffer from "buffer";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { SolanaError } from "../types/errors";
import "bootstrap/dist/css/bootstrap.min.css";

const MyAccount: React.FC = () => {
  window.Buffer = buffer.Buffer;
  const solanaService = useSolanaService();
  const wallet = useAnchorWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      if (!wallet) {
        setError("Please connect your wallet to see account information");
        setLoading(false);
        return;
      }

      if (!solanaService) {
        setError("Error connecting to Solana network");
        setLoading(false);
        return;
      }

      try {
        const balanceResult = await solanaService.getUserBalance();
        if (balanceResult instanceof Error) {
          if (balanceResult instanceof WalletNotConnectedError) {
            setError("Wallet not connected");
          } else if (balanceResult instanceof SolanaError) {
            setError("Error connecting to Solana network");
          } else {
            setError(balanceResult.message);
          }
        } else {
          setBalance(balanceResult);
          setError(null);
        }
      } catch (err) {
        setError("Failed to fetch balance");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [solanaService, wallet]);

  return (
    <div>
      <h1>My Solana Account</h1>
      {wallet && (
        <div>
          <br />
          <h5>You have connected a wallet with this account</h5>
          <div className="alert alert-secondary">
            <strong>Public Key:</strong> {wallet.publicKey.toString()}
          </div>
        </div>
      )}
      {wallet && balance !== null && (
        <div className="alert alert-info">
          <strong>Balance:</strong> {balance} lamports
        </div>
      )}
      {loading && <p className="text-black">Loading...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default MyAccount;
