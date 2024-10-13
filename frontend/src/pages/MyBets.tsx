import { useAnchorWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import * as buffer from "buffer";
import { useSolanaService } from "../contexts/SolanaServiceContext";
import { BetExtended, Game } from "../types";
import MyBetsListDetails from "../components/MyBetsListDetails";
import { PublicKey } from "@solana/web3.js";
import { GameState } from "../types";
import { getPayout } from "../utils/winningsUtils";

const MyBets: React.FC = () => {
  window.Buffer = buffer.Buffer;
  const solanaService = useSolanaService();
  const wallet = useAnchorWallet();
  const [betsAll, setBetsAll] = useState<BetExtended[]>([]);
  const [betsToClaim, setBetsToClaim] = useState<BetExtended[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [feeAmount, setFeeAmount] = useState<number>(0);

  useEffect(() => {
    const triggerUpdateBets = async () => {
      await updateBets();
    };
    triggerUpdateBets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solanaService, wallet]);

  const updateBets = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setTransactionId(null);
    setPayoutAmount(0);
    setFeeAmount(0);

    if (!wallet) {
      setError("Please connect your wallet to see your bets.");
      setLoading(false);
      return;
    }

    if (!solanaService) {
      setError("Error connecting to Solana network");
      setLoading(false);
      return;
    }

    try {
      const betsResult = await solanaService.getBets(wallet.publicKey);

      if (!Array.isArray(betsResult)) {
        setError("Error loading bets from Solana network");
        setLoading(false);
        return;
      }

      const gamePublicKeys = betsResult.map((bet) => bet.gamePublicKey);
      const gamesResult = await solanaService.getGames(gamePublicKeys);

      if (!Array.isArray(gamesResult)) {
        setError("Error loading games from Solana network");
        setLoading(false);
        return;
      }

      const betsExtended = await Promise.all(
        betsResult.map(async (bet) => {
          const game = gamesResult.find(
            (game) => game && game.publicKey === bet.gamePublicKey
          );

          // Skip bets with no associated game
          if (!game) {
            console.warn(
              `Skipping bet with gamePublicKey: ${bet.gamePublicKey}, game not found.`
            );
            return null; // Return null for bets with missing games
          }

          const balance = await solanaService.getBalance(
            new PublicKey(bet.betPublicKey)
          );

          if (balance instanceof Error) {
            throw balance;
          }

          const payout = getPayout(game, bet.amount, bet.prediction);
          const gameState = getGameState(game);

          if (gameState < 3) {
            setPayoutAmount((prevAmount) => prevAmount + payout);
            setFeeAmount((prevAmount) => prevAmount + balance);
          }

          return {
            ...bet,
            game,
            balance,
            winnings: payout,
            gameState,
          } as BetExtended;
        })
      );

      const validBets = betsExtended.filter((bet) => bet !== null);
      const sortedBets = sortBets(validBets as BetExtended[]);
      setBetsAll(sortedBets);

      const canBeClaimed = sortedBets.filter((bet) => bet.gameState <= 2);
      setBetsToClaim(canBeClaimed);
    } catch (err) {
      console.error(err);
      setError("Error loading bets from Solana network");
    } finally {
      setLoading(false);
    }
  };

  const getGameState = (game: Game) => {
    if (game.result === 255) {
      if (game.startTime > Date.now()) {
        return GameState.Open;
      } else {
        return GameState.Closed;
      }
    } else if (game.result <= 2) {
      return GameState.Declared;
    } else if (game.result <= 5) {
      return GameState.NoWinner;
    } else {
      return GameState.Cancelled;
    }
  };

  const sortBets = (bets: BetExtended[]) => {
    return bets.sort((a, b) => {
      return a.game.startTime - b.game.startTime;
    });
  };

  const handleClaimPayouts = async () => {
    setSuccessMessage(null);
    setTransactionId(null);
    setError(null);
    if (!wallet || !solanaService || betsToClaim.length === 0) {
      setError("No bets available or wallet not connected");
      return;
    }
    setClaiming(true);
    try {
      const txId = await solanaService.claimWinnings(betsToClaim);

      if (txId instanceof Error) {
        setError(txId.message);
      } else {
        await updateBets();
        setTransactionId(txId);
        setSuccessMessage("Success... Payout is sent to your wallet.");
      }
    } catch (err) {
      setError("Error claiming winnings from Solana network");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div>
      <h1>My bets</h1>
      {loading && <p className="text-black">Loading...</p>}
      {!loading && error && <div className="alert alert-danger">{error}</div>}
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      {transactionId && (
        <div className="alert alert-secondary mt-3">
          <a
            href={`https://explorer.solana.com/tx/${transactionId}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="solana-explorer-link"
          >
            Click to view your payout transaction on Solana Explorer
          </a>
        </div>
      )}
      {!loading &&
        !error &&
        !successMessage &&
        !claiming &&
        payoutAmount + feeAmount > 0 && (
          <div className="alert alert-success">
            <strong>Winnings:</strong> {payoutAmount} lamports
            <br />
            <strong>Unused Solana fees</strong>: {feeAmount} lamports
          </div>
        )}
      {claiming && (
        <div className="alert alert-info" role="alert">
          Getting your payout... Please, confirm transaction in your wallet and
          wait for transaction to finish.
        </div>
      )}
      {!loading &&
        !error &&
        (betsAll.length > 0 ? (
          <>
            {" "}
            {(betsToClaim.length > 0 || betsToClaim.length > 0) && (
              <button
                onClick={handleClaimPayouts}
                className="btn btn-success mt-3 mb-3"
                disabled={claiming}
              >
                {claiming
                  ? "Claiming..."
                  : "Get my winnings and unused Solana fees"}
              </button>
            )}
            {betsAll.map((betExtended, index) => (
              <MyBetsListDetails key={index} betExtended={betExtended} />
            ))}
            {(betsToClaim.length > 0 || betsToClaim.length > 0) && (
              <button
                onClick={handleClaimPayouts}
                className="btn btn-success mt-3"
                disabled={claiming}
              >
                {claiming
                  ? "Claiming..."
                  : "Get my winnings and unused Solana fees"}
              </button>
            )}
          </>
        ) : (
          <div className="alert alert-info">You have no active bets.</div>
        ))}
    </div>
  );
};

export default MyBets;
