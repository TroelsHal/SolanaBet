export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export class SolanaError extends Error {
  constructor() {
    super("Solana error");
  }
}

export class InvalidTimeError extends Error {
  constructor() {
    super("Invalid time");
  }
}

export class UnknownTournamentError extends Error {
  constructor() {
    super("Unknown tournament");
  }
}

export class InsufficientFundsError extends Error {
  constructor() {
    super("Insufficient balance");
  }
}
