import idl from "../config/idl.json";
import { Betting } from "../config/betting";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Bet, Game, GameToCreate } from "../types";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import {
  InvalidTimeError,
  SolanaError,
  UnknownTournamentError,
} from "../types/errors";
import { UnauthorizedError, InsufficientFundsError } from "../types/errors";
import {
  findTournamentByCode,
  findCodeByTournament,
} from "../utils/tournamentUtils";

class SolanaService {
  private program: anchor.Program<Betting> | null = null;

  constructor(private connection: Connection, private wallet?: AnchorWallet) {}

  // Lazy initialization of the program
  private getProgram(): anchor.Program<Betting> | null {
    if (!this.program) {
      if (this.wallet) {
        const provider = new anchor.AnchorProvider(
          this.connection,
          this.wallet,
          {}
        );
        this.program = new anchor.Program<Betting>(idl as Betting, provider);
      } else {
        // Initialize the program in read-only mode without a wallet
        const provider = new anchor.AnchorProvider(
          this.connection,
          {} as any,
          {}
        );
        this.program = new anchor.Program<Betting>(idl as Betting, provider);
      }
    }
    return this.program;
  }

  async getUserBalance(): Promise<number | Error> {
    if (!this.wallet) {
      return new WalletNotConnectedError();
    }
    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance;
    } catch (error) {
      console.error(error);
      return new SolanaError();
    }
  }

  async getBalance(publicKey: PublicKey): Promise<number | Error> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance;
    } catch (error) {
      console.error(error);
      return new SolanaError();
    }
  }

  async getGame(gamePublicKey: string): Promise<Game | Error> {
    const program = this.getProgram();
    if (!program) {
      console.error("error getting games: program not initialized");
      return new SolanaError();
    }

    const gamePublicKeyObject = new PublicKey(gamePublicKey);

    try {
      const game = await program.account.game.fetch(gamePublicKeyObject);

      return {
        publicKey: gamePublicKey,
        homeTeam: game.homeTeam.toString(),
        awayTeam: game.awayTeam.toString(),
        tournament: findTournamentByCode(game.tournament.toString()),
        startTime: game.startTime.toNumber() * 1000,
        resultDeclaredTime: game.resultDeclaredTime.toNumber() * 1000,
        totalAmountDraw: game.totalAmountDraw.toNumber(),
        totalAmountHome: game.totalAmountHome.toNumber(),
        totalAmountAway: game.totalAmountAway.toNumber(),
        result: game.result,
      };
    } catch (error) {
      if (error instanceof UnknownTournamentError) {
        return error; // Return the specific tournament error
      }
      console.error(error);
      return new SolanaError();
    }
  }

  async getGames(gamePublicKeys: string[]): Promise<(Game | null)[] | Error> {
    const program = this.getProgram();
    if (!program) {
      console.error("Error getting games: program not initialized");
      return new SolanaError();
    }

    try {
      const gamePublicKeyObjects = gamePublicKeys.map(
        (key) => new PublicKey(key)
      );

      const accountsInfo = await this.connection.getMultipleAccountsInfo(
        gamePublicKeyObjects
      );

      if (!accountsInfo) {
        console.error("Error: no accountsinfo");
        return new SolanaError();
      }

      const games = accountsInfo.map((accountInfo, index) => {
        if (!accountInfo) {
          return null;
        }

        const gameData = program.coder.accounts.decode(
          "game",
          accountInfo.data
        );

        return {
          publicKey: gamePublicKeys[index],
          homeTeam: gameData.homeTeam.toString(),
          awayTeam: gameData.awayTeam.toString(),
          tournament: findTournamentByCode(gameData.tournament.toString()),
          startTime: gameData.startTime.toNumber() * 1000,
          resultDeclaredTime: gameData.resultDeclaredTime.toNumber() * 1000,
          totalAmountDraw: gameData.totalAmountDraw.toNumber(),
          totalAmountHome: gameData.totalAmountHome.toNumber(),
          totalAmountAway: gameData.totalAmountAway.toNumber(),
          result: gameData.result,
        } as Game;
      });

      return games;
    } catch (error) {
      if (error instanceof UnknownTournamentError) {
        return error; 
      }
      console.error("Error fetching games:", error);
      return new SolanaError();
    }
  }

  async getAllGames(): Promise<Game[] | Error> {
    const program = this.getProgram();
    if (!program) {
      console.error("error getting games: program not initialized");
      return new SolanaError();
    }

    try {
      const games = await program.account.game.all();
      return games.map((game) => ({
        publicKey: game.publicKey.toString(),
        homeTeam: game.account.homeTeam.toString(),
        awayTeam: game.account.awayTeam.toString(),
        tournament: findTournamentByCode(game.account.tournament.toString()),
        startTime: game.account.startTime.toNumber() * 1000,
        resultDeclaredTime: game.account.resultDeclaredTime.toNumber() * 1000,
        totalAmountDraw: game.account.totalAmountDraw.toNumber(),
        totalAmountHome: game.account.totalAmountHome.toNumber(),
        totalAmountAway: game.account.totalAmountAway.toNumber(),
        result: game.account.result,
      }));
    } catch (error) {
      if (error instanceof UnknownTournamentError) {
        return error;
      }
      console.error("Error fetching all games:", error);
      return new SolanaError();
    }
  }

  async getBets(userPublicKey: PublicKey): Promise<Bet[] | Error> {
    const program = this.getProgram();
    if (!program) {
      console.error("error getting games: program not initialized");
      return new SolanaError();
    }
    try {
      const betAccounts = await program.account.bet.all([
        {
          memcmp: {
            offset: 8 + 8 + 1, // Offset to skip discriminator, amount, bump, and user public key
            bytes: userPublicKey.toBase58(),
          },
        },
      ]);
      return betAccounts.map((betAccount) => ({
        betPublicKey: betAccount.publicKey.toString(),
        gamePublicKey: betAccount.account.game.toString(),
        amount: betAccount.account.amount.toNumber(),
        prediction: betAccount.account.prediction as number,
      }));
    } catch (error) {
      console.error("Error fetching user bets with games:", error);
      return new SolanaError();
    }
  }

  async getProgramManager(): Promise<string | Error> {
    const program = this.getProgram();
    if (!program) {
      return new SolanaError();
    }

    let settings = null;
    try {
      settings = await program.account.programSettings.all();
    } catch (error) {
      console.error(error);
      return new SolanaError();
    }
    if (!settings || settings.length !== 1) {
      console.error("Invalid program settings");
      return new SolanaError();
    } else {
      return settings[0].account.manager.toString();
    }
  }

  async createGame(game: GameToCreate): Promise<string | Error> {
    if (!this.wallet) {
      return new WalletNotConnectedError();
    }

    const program = this.getProgram();
    if (!program) {
      return new SolanaError();
    }

    const programManagerResult = await this.getProgramManager();
    if (programManagerResult instanceof Error) {
      return programManagerResult;
    }

    if (this.wallet.publicKey.toString() !== programManagerResult) {
      console.error("Unauthorized: wallet is not the program manager");
      console.log("Wallet:", this.wallet.publicKey.toString());
      console.log("Program manager:", programManagerResult);

      return new UnauthorizedError();
    }

    try {
      const gameAccount = anchor.web3.Keypair.generate();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [programSettingsPDA, _bump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from("settings")],
          program.programId
        );

      // Convert from milliseconds (used in frontend) to seconds (used in Solana)
      const bettingEndsInSeconds = Math.floor(game.bettingEnds / 1000);

      await program.methods
        .initializeGame(
          game.homeTeam,
          game.awayTeam,
          findCodeByTournament(game.tournament),
          new anchor.BN(bettingEndsInSeconds)
        )
        .accounts({
          gameAccount: gameAccount.publicKey,
          programSettings: programSettingsPDA,
          manager: this.wallet.publicKey,
        } as any)
        .signers([gameAccount])
        .rpc();

      console.log(
        "Game created successfully:",
        gameAccount.publicKey.toString()
      );

      return gameAccount.publicKey.toString();
    } catch (error: any) {
      if (error instanceof UnknownTournamentError) {
        return error;
      } else if (error.message.toLowerCase().includes("invalid time")) {
        return new InvalidTimeError();
      } else {
        console.error("error from solana: ", error);
        return new SolanaError();
      }
    }
  }

  async makeBet(
    gamePublicKeyString: string,
    amount: number,
    prediction: number
  ): Promise<string | Error> {
    if (!this.wallet) {
      return new WalletNotConnectedError();
    }

    const program = this.getProgram();
    if (!program) {
      return new SolanaError();
    }

    const gamePublicKey = new PublicKey(gamePublicKeyString);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [betAccount, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        this.wallet.publicKey.toBuffer(),
        gamePublicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    try {
      const txId = await program.methods
        .makeBet(prediction, new anchor.BN(amount))
        .accounts({
          betAccount: betAccount,
          gameAccount: gamePublicKey,
          user: this.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();
      console.log("Bet made successfully:", txId);
      return txId;
    } catch (error: any) {
      if (error.message.toLowerCase().includes("insufficient funds")) {
        return new InsufficientFundsError();
      }
      console.error("Error making bet:", error);
      return new SolanaError();
    }
  }

  async claimWinnings(bets: Bet[]): Promise<string | Error> {
    if (!this.wallet) {
      return new WalletNotConnectedError();
    }

    const program = this.getProgram();
    if (!program) {
      return new SolanaError();
    }

    if (!program.provider) {
      return new Error("Provider not available error");
    }

    if (!program.provider.sendAndConfirm) {
      return new Error("Provider.sendAndConfirm not available error");
    }

    let transaction = new Transaction();
    try {
      for (const bet of bets) {
        const gamePublicKey = new PublicKey(bet.gamePublicKey);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [betAccount, _bump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [
              this.wallet.publicKey.toBuffer(),
              gamePublicKey.toBuffer(),
              Buffer.from([bet.prediction]),
            ],
            program.programId
          );

        const instruction = await program.methods
          .claimWinnings(bet.prediction)
          .accounts({
            betAccount: betAccount,
            gameAccount: gamePublicKey,
            user: this.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          } as any)
          .instruction();

        transaction = transaction.add(instruction);
      }

      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.wallet.publicKey;

      const txId = await program.provider.sendAndConfirm(transaction);
      console.log("Winnings claimed successfully:", txId);
      return txId;
    } catch (error) {
      console.error("Error claiming winnings:", error);
      return new SolanaError();
    }
  }

  async declareResult(
    gamePublicKeyString: string,
    result: number
  ): Promise<string | Error> {
    if (!this.wallet) {
      return new WalletNotConnectedError();
    }

    const program = this.getProgram();
    if (!program) {
      return new SolanaError();
    }

    const gamePublicKey = new PublicKey(gamePublicKeyString);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );
    try {
      const txId = await program.methods
        .declareResult(result)
        .accounts({
          gameAccount: gamePublicKey,
          programSettings: programSettingsPDA,
          manager: this.wallet.publicKey,
        } as any)
        .rpc();
      return txId;
    } catch (error) {
      console.error("Error declaring result:", error);
      return new SolanaError();
    }
  }

  async closeGame(gamePublicKeyString: string): Promise<string | Error> {
    if (!this.wallet) {
      return new WalletNotConnectedError();
    }

    const program = this.getProgram();
    if (!program) {
      return new SolanaError();
    }

    const gamePublicKey = new PublicKey(gamePublicKeyString);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    try {
      const txId = await program.methods
        .closeGame()
        .accounts({
          gameAccount: gamePublicKey,
          programSettings: programSettingsPDA,
          manager: this.wallet.publicKey,
        } as any)
        .rpc();
      return txId;
    } catch (error) {
      console.error("Error closing game:", error);
      return new SolanaError();
    }
  }
}

export default SolanaService;
