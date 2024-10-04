import { Game } from "../types";

const houseFee = 0.01;

export const getPotentialWinnings = (
  game: Game,
  betAmount: number,
  prediction: number
) => {
  if (!betAmount || betAmount <= 0) {
    return 0;
  }
  const totalBets =
    game.totalAmountDraw +
    game.totalAmountHome +
    game.totalAmountAway +
    betAmount;

  let potentialWinnings;
  switch (prediction) {
    case 0: // Draw
      potentialWinnings =
        (betAmount / (game.totalAmountDraw + betAmount)) * totalBets;
      break;
    case 1: // Home Team Wins
      potentialWinnings =
        (betAmount / (game.totalAmountHome + betAmount)) * totalBets;
      break;
    case 2: // Away Team Wins
      potentialWinnings =
        (betAmount / (game.totalAmountAway + betAmount)) * totalBets;
      break;
    default:
      potentialWinnings = 0;
  }

  potentialWinnings = potentialWinnings * (1 - houseFee);
  return Math.round(potentialWinnings);
};

export const getPayout = (
  game: Game,
  betAmount: number,
  prediction: number
) => {
  if (!betAmount || betAmount <= 0) {
    return 0;
  }

  // game cancelled
  if (game.result === 6) {
    return betAmount;
  }

  // no winning bets
  if (game.result >= 3 && game.result <= 5) {
    return betAmount;
  }

  if (game.result === prediction) {
    const totalBets =
      game.totalAmountDraw + game.totalAmountHome + game.totalAmountAway;

    let payout;
    switch (prediction) {
      case 0: // Draw
        payout = (betAmount / game.totalAmountDraw) * totalBets;
        break;
      case 1: // Home Team Wins
        payout = (betAmount / game.totalAmountHome) * totalBets;
        break;
      case 2: // Away Team Wins
        payout = (betAmount / game.totalAmountAway) * totalBets;
        break;
      default:
        payout = -1;
    }

    payout = payout * (1 - houseFee);
    return Math.round(payout);
  }

  return 0;
};
