export interface Game {
  publicKey: string;
  homeTeam: string;
  awayTeam: string;
  tournament: string;
  startTime: number;
  resultDeclaredTime: number;
  totalAmountDraw: number;
  totalAmountHome: number;
  totalAmountAway: number;
  result: number;
}

export interface ExpiredGame extends Game {
  balance: number;
}

export interface Bet {
  betPublicKey: string;
  gamePublicKey: string;
  amount: number;
  prediction: number;
}

export interface BetExtended extends Bet {
  game: Game;
  balance: number;
  winnings: number;
  gameState: GameState;
}

export interface GameToCreate {
  homeTeam: string;
  awayTeam: string;
  tournament: string;
  bettingEnds: number;
}

export enum GameState {
  Declared, // 0
  NoWinner, // 1
  Cancelled, // 2
  Closed, // 3
  Open, // 4
}
