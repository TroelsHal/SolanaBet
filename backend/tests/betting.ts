import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Betting } from "../target/types/betting";
import { expect } from "chai";

describe("bettings", () => {
  const provider = anchor.AnchorProvider.env();
  console.log("endpoint", provider.connection.rpcEndpoint);
  anchor.setProvider(provider);

  const program = anchor.workspace.Betting as Program<Betting>;

  let gameAccount: anchor.web3.Keypair;
  let gameAccountStartsIn3Seconds: anchor.web3.Keypair;
  let homeTeam1 = "Liverpool";
  let awayTeam1 = "Chelsea";
  let tournament1 = "Premier League";
  let startTime: number;
  let startTimeSoon: number;
  let timeOffset: number;

  let manager: anchor.web3.Keypair;

  let player1: anchor.web3.Keypair;
  let player2: anchor.web3.Keypair;
  let player3: anchor.web3.Keypair;
  let player4: anchor.web3.Keypair;
  let player5: anchor.web3.Keypair;

  const houseFee = 0.01;
  const expirationTime = 60;

  before("Initialize the program", async () => {
    let initializer = anchor.web3.Keypair.generate();
    const airdropInitializer_tx = await provider.connection.requestAirdrop(
      initializer.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropInitializer_tx);

    manager = anchor.web3.Keypair.generate();

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    await program.methods
      .initializeProgram(manager.publicKey)
      .accounts({
        programSettings: programSettingsPDA,
        user: initializer.publicKey,
      } as any)
      .signers([initializer])
      .rpc();
  });

  beforeEach("Fund manager+players and initialize games", async () => {
    // Create manager, players 1+2+3 wallets and fund each with 1 SOL
    const airdropManager_tx = await provider.connection.requestAirdrop(
      manager.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropManager_tx);

    player1 = anchor.web3.Keypair.generate();
    const airdrop1_tx = await provider.connection.requestAirdrop(
      player1.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );

    await provider.connection.confirmTransaction(airdrop1_tx);

    player2 = anchor.web3.Keypair.generate();
    const airdrop2_tx = await provider.connection.requestAirdrop(
      player2.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdrop2_tx);

    player3 = anchor.web3.Keypair.generate();
    const airdrop3_tx = await provider.connection.requestAirdrop(
      player3.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdrop3_tx);

    // Create player 4 wallets and fund with 2000000 lamports
    // (enough to pay for the bet account creation fee)
    player4 = anchor.web3.Keypair.generate();
    const airdrop4_tx = await provider.connection.requestAirdrop(
      player4.publicKey,
      2000000
    );
    await provider.connection.confirmTransaction(airdrop4_tx);

    // Create player 5 wallets and fund with 1000 lamports
    // (not enough to pay for the bet account creation fee)
    player5 = anchor.web3.Keypair.generate();
    const airdrop5_tx = await provider.connection.requestAirdrop(
      player5.publicKey,
      1000
    );
    await provider.connection.confirmTransaction(airdrop5_tx);

    // Create game that ends 1 day from now
    gameAccount = anchor.web3.Keypair.generate();
    startTime = Math.floor(Date.now() / 1000) + 86400;

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    await program.methods
      .initializeGame(
        homeTeam1,
        awayTeam1,
        tournament1,
        new anchor.BN(startTime)
      )
      .accounts({
        gameAccount: gameAccount.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager, gameAccount])
      .rpc();

    // Create a game that starts in 3 seconds
    timeOffset = 3;
    startTimeSoon = Math.floor(Date.now() / 1000) + timeOffset;
    gameAccountStartsIn3Seconds = anchor.web3.Keypair.generate();

    await program.methods
      .initializeGame(
        homeTeam1,
        awayTeam1,
        tournament1,
        new anchor.BN(startTimeSoon)
      )
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager, gameAccountStartsIn3Seconds])
      .rpc();
  });

  it("Manager account - Program is initialized - Manager has correct data", async () => {
    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    const programSettings = await program.account.programSettings.fetch(
      programSettingsPDA
    );

    expect(programSettings.manager.toString()).to.equal(
      manager.publicKey.toString()
    );
  });

  it("InitializeProgram - Program is already initialized - Can not initialize again", async () => {
    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );
    try {
      await program.methods
        .initializeProgram(manager.publicKey)
        .accounts({
          programSettings: programSettingsPDA,
          user: player1.publicKey,
        } as any)
        .signers([player1])
        .rpc();

      expect.fail(
        "The transaction should have failed due to program already initialized"
      );
    } catch (err: any) {
      expect(err.message).to.include("already in use");
    }
  });

  it("InitializeProgram - Initializing with invalid seed - Can not initialize", async () => {
    const [invalidAccountPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("invalidSeed")],
        program.programId
      );
    try {
      await program.methods
        .initializeProgram(manager.publicKey)
        .accounts({
          programSettings: invalidAccountPDA,
          user: player1.publicKey,
        } as any)
        .signers([player1])
        .rpc();

      expect.fail(
        "The transaction should have failed due to program already initialized"
      );
    } catch (err: any) {
      expect(err.message).to.include("A seeds constraint was violated");
    }
  });

  it("TransferManager - Calling with current manager - Manager is transferred", async () => {
    const newManager = anchor.web3.Keypair.generate();

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    await program.methods
      .transferManager(newManager.publicKey)
      .accounts({
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    const programSettingsAfterFirstTransfer =
      await program.account.programSettings.fetch(programSettingsPDA);

    expect(programSettingsAfterFirstTransfer.manager.toString()).to.equal(
      newManager.publicKey.toString()
    );

    // Transfer manager back to the original manager
    await program.methods
      .transferManager(manager.publicKey)
      .accounts({
        programSettings: programSettingsPDA,
        manager: newManager.publicKey,
      } as any)
      .signers([newManager])
      .rpc();

    const programSettingsAfterSecondTransfer =
      await program.account.programSettings.fetch(programSettingsPDA);

    expect(programSettingsAfterSecondTransfer.manager.toString()).to.equal(
      manager.publicKey.toString()
    );
  });

  it("TransferManager - Calling with unauthorized manager - Manager is not transferred", async () => {
    const newManager = anchor.web3.Keypair.generate();

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );
    try {
      await program.methods
        .transferManager(newManager.publicKey)
        .accounts({
          programSettings: programSettingsPDA,
          player1: manager.publicKey,
        } as any)
        .signers([player1])
        .rpc();

      expect.fail(
        "The transaction should have failed due to unauthorized manager"
      );
    } catch (err: any) {
      expect(err.message).to.include("unknown signer");
    }

    const programSettingsAfterTransfer =
      await program.account.programSettings.fetch(programSettingsPDA);

    expect(programSettingsAfterTransfer.manager.toString()).to.equal(
      manager.publicKey.toString()
    );
  });

  it("InitializeGame - Calling with unauthorized manager - Game is not initialized", async () => {
    let newGameAccount = anchor.web3.Keypair.generate();

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    try {
      await program.methods
        .initializeGame(
          homeTeam1,
          awayTeam1,
          tournament1,
          new anchor.BN(startTime)
        )
        .accounts({
          gameAccount: newGameAccount.publicKey,
          programSettings: programSettingsPDA,
          manager: player1.publicKey,
        } as any)
        .signers([player1, newGameAccount])
        .rpc();

      expect.fail(
        "The transaction should have failed due to unauthorized manager"
      );
    } catch (err: any) {
      expect(err.message).to.include("Unauthorized manager");
    }

    const gameAccountInfo = await provider.connection.getAccountInfo(
      newGameAccount.publicKey
    );
    expect(gameAccountInfo).to.be.null;
  });

  it("Game - Game is initialized - Game has correct data", async () => {
    const game = await program.account.game.fetch(gameAccount.publicKey);

    expect(game.homeTeam).to.equal(homeTeam1);
    expect(game.awayTeam).to.equal(awayTeam1);
    expect(game.tournament).to.equal(tournament1);

    expect(game.totalAmountDraw.toNumber()).to.equal(0);
    expect(game.totalAmountHome.toNumber()).to.equal(0);
    expect(game.totalAmountAway.toNumber()).to.equal(0);

    expect(game.result).to.equal(255);
    expect(game.startTime.toNumber()).to.equal(startTime);
    expect(game.resultDeclaredTime.toNumber()).to.equal(0);

    const gameAccountInfo = await provider.connection.getAccountInfo(
      gameAccount.publicKey
    );
  });

  it("MakeBet - Player has sufficient funds - Payed amounts = bet + bet account fees; change in Game account balance = bet; Bet account has correct amount, user, game and prediction fields; Game account has correct amount", async () => {
    const betAmount = 50000000;
    const prediction = 1;

    const playerBalanceBeforeBet = await provider.connection.getBalance(
      player1.publicKey
    );

    const gameBalanceBeforeBet = await provider.connection.getBalance(
      gameAccount.publicKey
    );

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccount.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    await program.methods
      .makeBet(prediction, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccount.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    const betBalanceAfterBet = await provider.connection.getBalance(betAccount);

    const playerBalanceAfterBet = await provider.connection.getBalance(
      player1.publicKey
    );

    const gameBalanceAfterBet = await provider.connection.getBalance(
      gameAccount.publicKey
    );

    const payedAmount = playerBalanceBeforeBet - playerBalanceAfterBet;

    expect(payedAmount).to.equal(betAmount + betBalanceAfterBet);
    expect(gameBalanceAfterBet - gameBalanceBeforeBet).to.equal(betAmount);

    const bet = await program.account.bet.fetch(betAccount);
    expect(bet.amount.toNumber()).to.equal(betAmount);
    expect(bet.user.toBase58()).to.equal(player1.publicKey.toBase58());
    expect(bet.game.toBase58()).to.equal(gameAccount.publicKey.toBase58());
    expect(bet.prediction).to.equal(prediction);

    const gameAccountData = await program.account.game.fetch(
      gameAccount.publicKey
    );
    expect(gameAccountData.totalAmountDraw.toNumber()).to.equal(0);
    expect(gameAccountData.totalAmountHome.toNumber()).to.equal(betAmount);
    expect(gameAccountData.totalAmountAway.toNumber()).to.equal(0);
  });

  it("MakeBet - Player makes invalid prediction - MakeBet fails and is free", async () => {
    const betAmount = 50000000;
    const prediction = 3;

    const playerBalanceBeforeBet = await provider.connection.getBalance(
      player1.publicKey
    );

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccount.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    try {
      await program.methods
        .makeBet(prediction, new anchor.BN(betAmount))
        .accounts({
          betAccount: betAccount,
          gameAccount: gameAccount.publicKey,
          user: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([player1])
        .rpc();
      expect.fail(
        "The transaction should have failed due to invalid prediction"
      );
    } catch (err: any) {
      expect(err.message).to.include("Invalid prediction value");
    }

    const playerBalanceAfterBet = await provider.connection.getBalance(
      player1.publicKey
    );

    expect(playerBalanceBeforeBet).to.be.equal(playerBalanceAfterBet);
  });

  it("MakeBet - Player has enough funds to make bet account but not for the bet - MakeBet fails correctly, and it's free", async () => {
    const betAmount = 50000000;
    const prediction = 1;

    const playerBalanceBeforeBet = await provider.connection.getBalance(
      player4.publicKey
    );

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player4.publicKey.toBuffer(),
        gameAccount.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    try {
      await program.methods
        .makeBet(prediction, new anchor.BN(betAmount))
        .accounts({
          betAccount: betAccount,
          gameAccount: gameAccount.publicKey,
          user: player4.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([player4])
        .rpc();

      expect.fail(
        "The transaction should have failed due to insufficient funds"
      );
    } catch (err: any) {
      expect(err.message).to.include("Insufficient funds");
    }

    const playerBalanceAfterBet = await provider.connection.getBalance(
      player4.publicKey
    );

    expect(playerBalanceBeforeBet).to.be.equal(playerBalanceAfterBet);
  });

  it("MakeBet - Player does not have enough funds to make bet account - MakeBet fails correctly, and it's free", async () => {
    const betAmount = 50000000;
    const prediction = 1;

    const playerBalanceBeforeBet = await provider.connection.getBalance(
      player5.publicKey
    );

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player5.publicKey.toBuffer(),
        gameAccount.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    try {
      await program.methods
        .makeBet(prediction, new anchor.BN(betAmount))
        .accounts({
          betAccount: betAccount,
          gameAccount: gameAccount.publicKey,
          user: player5.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([player5])
        .rpc();

      expect.fail(
        "The transaction should have failed due to insufficient funds"
      );
    } catch (err: any) {
      expect(err.message).to.include("insufficient lamports");
    }

    const playerBalanceAfterBet = await provider.connection.getBalance(
      player5.publicKey
    );

    expect(playerBalanceBeforeBet).to.be.equal(playerBalanceAfterBet);
  });

  it("MakeBet - Player is updating existing bet - Payed amount by player equals bet (no fees); Change in Game account balance equals bet; No change in Bet account balance; Bet account has correct amount; Game account has correct amounts", async () => {
    const betAmount = 30000000;
    const updateAmount = 40000000;
    const prediction = 2;

    // 1. Place first bet
    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccount.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    await program.methods
      .makeBet(prediction, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccount.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    // 2. Update bet
    const playerBalanceBeforeUpdate = await provider.connection.getBalance(
      player1.publicKey
    );

    const gameBalanceBeforeUpdate = await provider.connection.getBalance(
      gameAccount.publicKey
    );

    const betBalanceBeforeUpdate = await provider.connection.getBalance(
      betAccount
    );

    const gameAccountDataBeforeUpdate = await program.account.game.fetch(
      gameAccount.publicKey
    );

    const betAccountDataBeforeUpdate = await program.account.bet.fetch(
      betAccount
    );

    await program.methods
      .makeBet(prediction, new anchor.BN(updateAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccount.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    const playerBalanceAfterUpdate = await provider.connection.getBalance(
      player1.publicKey
    );

    const gameBalanceAfterUpdate = await provider.connection.getBalance(
      gameAccount.publicKey
    );

    const betBalanceAfterUpdate = await provider.connection.getBalance(
      betAccount
    );

    const gameAccountDataAfterUpdate = await program.account.game.fetch(
      gameAccount.publicKey
    );

    const betAccountDataAfterUpdate = await program.account.bet.fetch(
      betAccount
    );

    // check that the amount payed for the update is equal to the update amount (no fees)
    expect(playerBalanceBeforeUpdate - playerBalanceAfterUpdate).to.equal(
      updateAmount
    );

    // check the the balance of the bet account did not change (no fees)
    expect(betBalanceBeforeUpdate).to.equal(betBalanceAfterUpdate);

    // check that the game account balance increased with the update amount (no fees)
    expect(gameBalanceAfterUpdate - gameBalanceBeforeUpdate).to.equal(
      updateAmount
    );

    expect(
      gameAccountDataAfterUpdate.totalAmountDraw.toNumber() -
        gameAccountDataBeforeUpdate.totalAmountDraw.toNumber()
    ).to.equal(0);

    expect(
      gameAccountDataAfterUpdate.totalAmountHome.toNumber() -
        gameAccountDataBeforeUpdate.totalAmountHome.toNumber()
    ).to.equal(0);

    expect(
      gameAccountDataAfterUpdate.totalAmountAway.toNumber() -
        gameAccountDataBeforeUpdate.totalAmountAway.toNumber()
    ).to.equal(updateAmount);

    expect(
      betAccountDataAfterUpdate.amount.toNumber() -
        betAccountDataBeforeUpdate.amount.toNumber()
    ).to.equal(updateAmount);
  });

  it("MakeBet - player2 betting (updating) on accout if player1 - MakeBet fails correctly ", async () => {
    const betAmount = 30000000;
    const updateAmount = 40000000;
    const prediction = 0;

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccount.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    await program.methods
      .makeBet(prediction, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccount.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    const playerBalanceBeforeUpdate = await provider.connection.getBalance(
      player2.publicKey
    );

    try {
      await program.methods
        .makeBet(prediction, new anchor.BN(updateAmount))
        .accounts({
          betAccount: betAccount,
          gameAccount: gameAccount.publicKey,
          user: player2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([player2])
        .rpc();
      expect.fail(
        "The transaction should have failed due to insufficient funds"
      );
    } catch (err: any) {
      expect(err.message).to.include("A seeds constraint was violated");
    }

    const playerBalanceAfterUpdate = await provider.connection.getBalance(
      player2.publicKey
    );

    expect(playerBalanceBeforeUpdate).to.equal(playerBalanceAfterUpdate);
  });

  it("MakeBet - Player is betting on different predictions for one game - Fees are equal for all three bets; Change in Game account balance = bet1 + bet2 + bet3; Bet accounts has correct amount and user fields; Game account has correct amounts", async () => {
    const betAmount1 = 30000000;
    const betAmount2 = 40000000;
    const betAmount3 = 50000000;
    const prediction1 = 1;
    const prediction2 = 2;
    const prediction3 = 0;

    const [betAccount1, _bump1] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          player1.publicKey.toBuffer(),
          gameAccount.publicKey.toBuffer(),
          Buffer.from([prediction1]),
        ],
        program.programId
      );

    const [betAccount2, _bump2] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          player1.publicKey.toBuffer(),
          gameAccount.publicKey.toBuffer(),
          Buffer.from([prediction2]),
        ],
        program.programId
      );

    const [betAccount3, _bump3] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          player1.publicKey.toBuffer(),
          gameAccount.publicKey.toBuffer(),
          Buffer.from([prediction3]),
        ],
        program.programId
      );

    const playerBalanceBeforeBet1 = await provider.connection.getBalance(
      player1.publicKey
    );

    const gameBalanceBeforeBet1 = await provider.connection.getBalance(
      gameAccount.publicKey
    );

    await program.methods
      .makeBet(prediction1, new anchor.BN(betAmount1))
      .accounts({
        betAccount: betAccount1,
        gameAccount: gameAccount.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    const playerBalanceBeforeBet2 = await provider.connection.getBalance(
      player1.publicKey
    );

    await program.methods
      .makeBet(prediction2, new anchor.BN(betAmount2))
      .accounts({
        betAccount: betAccount2,
        gameAccount: gameAccount.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    const playerBalanceBeforeBet3 = await provider.connection.getBalance(
      player1.publicKey
    );

    await program.methods
      .makeBet(prediction3, new anchor.BN(betAmount3))
      .accounts({
        betAccount: betAccount3,
        gameAccount: gameAccount.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    const playerBalanceAfterBet = await provider.connection.getBalance(
      player1.publicKey
    );

    const gameBalanceAfterBet = await provider.connection.getBalance(
      gameAccount.publicKey
    );

    const gameAccountData = await program.account.game.fetch(
      gameAccount.publicKey
    );

    expect(gameBalanceAfterBet - gameBalanceBeforeBet1).to.equal(
      betAmount1 + betAmount2 + betAmount3
    );

    const bet1Fee =
      playerBalanceBeforeBet1 - playerBalanceBeforeBet2 - betAmount1;
    const bet2Fee =
      playerBalanceBeforeBet2 - playerBalanceBeforeBet3 - betAmount2;
    const bet3Fee =
      playerBalanceBeforeBet3 - playerBalanceAfterBet - betAmount3;

    expect(bet1Fee).to.equal(bet2Fee);
    expect(bet2Fee).to.equal(bet3Fee);

    expect(gameAccountData.totalAmountHome.toNumber()).to.equal(betAmount1);
    expect(gameAccountData.totalAmountAway.toNumber()).to.equal(betAmount2);
    expect(gameAccountData.totalAmountDraw.toNumber()).to.equal(betAmount3);

    const betAccountData1 = await program.account.bet.fetch(betAccount1);
    const betAccountData2 = await program.account.bet.fetch(betAccount2);
    const betAccountData3 = await program.account.bet.fetch(betAccount3);

    expect(betAccountData1.amount.toNumber()).to.equal(betAmount1);
    expect(betAccountData2.amount.toNumber()).to.equal(betAmount2);
    expect(betAccountData3.amount.toNumber()).to.equal(betAmount3);

    expect(betAccountData1.user.toBase58()).to.equal(
      player1.publicKey.toBase58()
    );
    expect(betAccountData2.user.toBase58()).to.equal(
      player1.publicKey.toBase58()
    );
    expect(betAccountData3.user.toBase58()).to.equal(
      player1.publicKey.toBase58()
    );
  });

  it("MakeBet - Betting after game has started - MakeBet fails correctly, and it's free", async () => {
    const betAmount = 50000000;
    const prediction = 1;

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccountStartsIn3Seconds.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    const playerBalanceBeforeBet = await provider.connection.getBalance(
      player1.publicKey
    );

    // Wait for the game to start
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + 2) * 1000)
    );
    try {
      await program.methods
        .makeBet(prediction, new anchor.BN(betAmount))
        .accounts({
          betAccount: betAccount,
          gameAccount: gameAccountStartsIn3Seconds.publicKey,
          user: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([player1])
        .rpc();

      expect.fail(
        "The transaction should have failed due to betting period ended"
      );
    } catch (err: any) {
      expect(err.message).to.include("Betting period ended");
    }

    const playerBalanceAfterBet = await provider.connection.getBalance(
      player1.publicKey
    );

    expect(playerBalanceBeforeBet).to.equal(playerBalanceAfterBet);
  });

  it("DeclareResult - Calling with current manager, Winning bet - Result is declared", async () => {
    const result = 1;
    const betAmount = 50000000;

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccountStartsIn3Seconds.publicKey.toBuffer(),
        Buffer.from([result]),
      ],
      program.programId
    );

    await program.methods
      .makeBet(result, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    const gameAccountDataBeforeDeclare = await program.account.game.fetch(
      gameAccountStartsIn3Seconds.publicKey
    );
    expect(gameAccountDataBeforeDeclare.result).to.equal(255);

    // Wait for the game to start
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + 2) * 1000)
    );

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    await program.methods
      .declareResult(result)
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    const gameAccountData = await program.account.game.fetch(
      gameAccountStartsIn3Seconds.publicKey
    );

    expect(gameAccountData.result).to.equal(result);

    const currentTime = Math.floor(Date.now() / 1000);

    expect(
      currentTime - gameAccountData.resultDeclaredTime.toNumber()
    ).to.be.lessThan(5);
  });

  it("DeclareResult - Calling with current manager, No winning bet - Result is 4", async () => {
    const result = 1;

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    const gameAccountDataBeforeDeclare = await program.account.game.fetch(
      gameAccountStartsIn3Seconds.publicKey
    );
    expect(gameAccountDataBeforeDeclare.result).to.equal(255);

    // Wait for the game to start
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + 2) * 1000)
    );

    await program.methods
      .declareResult(result)
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    const gameAccountData = await program.account.game.fetch(
      gameAccountStartsIn3Seconds.publicKey
    );

    expect(gameAccountData.result).to.equal(4);
  });

  it("DeclareResult - Calling with invalid result - Fails with correct error; result is still not declared", async () => {
    const result = 4;

    const gameAccountDataBeforeDeclare = await program.account.game.fetch(
      gameAccount.publicKey
    );
    expect(gameAccountDataBeforeDeclare.result).to.equal(255);

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    try {
      await program.methods
        .declareResult(result)
        .accounts({
          gameAccount: gameAccount.publicKey,
          programSettings: programSettingsPDA,
          manager: manager.publicKey,
        } as any)
        .signers([manager])
        .rpc();

      expect.fail("The transaction should have failed due to invalid result");
    } catch (err: any) {
      expect(err.message).to.include("Invalid result");
    }

    const gameAccountData = await program.account.game.fetch(
      gameAccount.publicKey
    );

    expect(gameAccountData.result).to.equal(255);
  });

  it("DeclareResult - Calling with unauthorized manager - Fails with correct error; result is still not declared", async () => {
    const result = 1;

    const gameAccountDataBeforeDeclare = await program.account.game.fetch(
      gameAccount.publicKey
    );
    expect(gameAccountDataBeforeDeclare.result).to.equal(255);

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    try {
      await program.methods
        .declareResult(result)
        .accounts({
          gameAccount: gameAccount.publicKey,
          programSettings: programSettingsPDA,
          manager: player1.publicKey,
        } as any)
        .signers([player1])
        .rpc();

      expect.fail("The transaction should have failed due to unauthorized");
    } catch (err: any) {
      expect(err.message).to.include("Unauthorized manager");
    }

    const gameAccountData = await program.account.game.fetch(
      gameAccount.publicKey
    );

    expect(gameAccountData.result).to.equal(255);
  });

  it("ClaimWinnings - Result not declared - Fails with correct error", async () => {
    const prediction = 1;
    const betAmount = 50000000;

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccount.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    const a = 2;

    await program.methods
      .makeBet(prediction, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccount.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    try {
      await program.methods
        .claimWinnings(prediction)
        .accounts({
          betAccount: betAccount,
          gameAccount: gameAccount.publicKey,
          user: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([player1])
        .rpc();

      expect.fail(
        "The transaction should have failed due to result not declared"
      );
    } catch (err: any) {
      expect(err.message).to.include("Result not declared");
    }
  });

  async function testClaimWinningsAfterDeclareResult(
    predictionPlayer1: number,
    predictionPlayer2: number,
    predictionPlayer3: number,
    result: number,
    deductHouseFee: boolean,
    betAmountPlayer1: number,
    betAmountPlayer2: number,
    betAmountPlayer3: number,
    expectWinningsPlayer1: number,
    expectWinningsPlayer2: number,
    expectWinningsPlayer3: number
  ) {
    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    const [betAccountPlayer1, _bump1] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          player1.publicKey.toBuffer(),
          gameAccountStartsIn3Seconds.publicKey.toBuffer(),
          Buffer.from([predictionPlayer1]),
        ],
        program.programId
      );
    const [betAccountPlayer2, _bump2] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          player2.publicKey.toBuffer(),
          gameAccountStartsIn3Seconds.publicKey.toBuffer(),
          Buffer.from([predictionPlayer2]),
        ],
        program.programId
      );

    const [betAccountPlayer3, _bump3] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          player3.publicKey.toBuffer(),
          gameAccountStartsIn3Seconds.publicKey.toBuffer(),
          Buffer.from([predictionPlayer3]),
        ],
        program.programId
      );

    await program.methods
      .makeBet(predictionPlayer1, new anchor.BN(betAmountPlayer1))
      .accounts({
        betAccount: betAccountPlayer1,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    await program.methods
      .makeBet(predictionPlayer2, new anchor.BN(betAmountPlayer2))
      .accounts({
        betAccount: betAccountPlayer2,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player2])
      .rpc();

    await program.methods
      .makeBet(predictionPlayer3, new anchor.BN(betAmountPlayer3))
      .accounts({
        betAccount: betAccountPlayer3,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player3.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player3])
      .rpc();

    const player1BalanceBeforeClaim = await provider.connection.getBalance(
      player1.publicKey
    );

    const player2BalanceBeforeClaim = await provider.connection.getBalance(
      player2.publicKey
    );

    const player3BalanceBeforeClaim = await provider.connection.getBalance(
      player3.publicKey
    );

    const betAccount1BalanceBeforeClaim = await provider.connection.getBalance(
      betAccountPlayer1
    );

    const betAccount2BalanceBeforeClaim = await provider.connection.getBalance(
      betAccountPlayer2
    );

    const betAccount3BalanceBeforeClaim = await provider.connection.getBalance(
      betAccountPlayer3
    );

    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + 2) * 1000)
    );

    await program.methods
      .declareResult(result)
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    // Claim the winnings
    await program.methods
      .claimWinnings(predictionPlayer1)
      .accounts({
        betAccount: betAccountPlayer1,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    await program.methods
      .claimWinnings(predictionPlayer2)
      .accounts({
        betAccount: betAccountPlayer2,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player2])
      .rpc();

    await program.methods
      .claimWinnings(predictionPlayer3)
      .accounts({
        betAccount: betAccountPlayer3,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player3.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player3])
      .rpc();

    const player1BalanceAfterClaim = await provider.connection.getBalance(
      player1.publicKey
    );

    const player2BalanceAfterClaim = await provider.connection.getBalance(
      player2.publicKey
    );

    const player3BalanceAfterClaim = await provider.connection.getBalance(
      player3.publicKey
    );

    // Unless the game is cancelled, the house fee is deducted
    if (deductHouseFee) {
      expectWinningsPlayer1 = expectWinningsPlayer1 * (1 - houseFee);
      expectWinningsPlayer2 = expectWinningsPlayer2 * (1 - houseFee);
      expectWinningsPlayer3 = expectWinningsPlayer3 * (1 - houseFee);
    }

    expectWinningsPlayer1 =
      expectWinningsPlayer1 + betAccount1BalanceBeforeClaim;

    expectWinningsPlayer2 =
      expectWinningsPlayer2 + betAccount2BalanceBeforeClaim;

    expectWinningsPlayer3 =
      expectWinningsPlayer3 + betAccount3BalanceBeforeClaim;

    expect(
      Math.abs(
        player1BalanceAfterClaim -
          player1BalanceBeforeClaim -
          expectWinningsPlayer1
      )
    ).to.be.below(1);

    expect(
      Math.abs(
        player2BalanceAfterClaim -
          player2BalanceBeforeClaim -
          expectWinningsPlayer2
      )
    ).to.be.below(1);

    expect(
      Math.abs(
        player3BalanceAfterClaim -
          player3BalanceBeforeClaim -
          expectWinningsPlayer3
      )
    ).to.be.below(1);
  }

  it("ClaimWinnings - All players win - Winnings (minus house fee) and remaining fees are received", async () => {
    await testClaimWinningsAfterDeclareResult(
      1,
      1,
      1,
      1,
      true,
      20000000,
      30000000,
      40000000,
      20000000,
      30000000,
      40000000
    );
  });

  it("ClaimWinnings - One player wins - Winnings (minus house fee) and remaining fees are received", async () => {
    await testClaimWinningsAfterDeclareResult(
      1,
      2,
      2,
      1,
      true,
      20000000,
      30000000,
      40000000,
      90000000,
      0,
      0
    );
  });

  it("ClaimWinnings - Two players win - Winnings (minus house fee) and remaining fees are received", async () => {
    await testClaimWinningsAfterDeclareResult(
      1,
      2,
      2,
      2,
      true,
      20000000,
      30000000,
      40000000,
      0,
      38571429,
      51428571
    );
  });

  it("ClaimWinnings - No players win - Bets and remaining fees are received", async () => {
    await testClaimWinningsAfterDeclareResult(
      0,
      1,
      1,
      2,
      false,
      20000000,
      30000000,
      40000000,
      20000000,
      30000000,
      40000000
    );
  });

  it("ClaimWinnings - Game is cancelled - Bets and remaining fees are received", async () => {
    await testClaimWinningsAfterDeclareResult(
      0,
      1,
      1,
      6,
      false,
      20000000,
      30000000,
      40000000,
      20000000,
      30000000,
      40000000
    );
  });

  it("ClaimWinnings - Player already claimed winnings - Fails with correct error", async () => {
    const prediction = 1;
    const betAmount = 50000000;

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccountStartsIn3Seconds.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    await program.methods
      .makeBet(prediction, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    // Wait for the game to start
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + 3) * 1000)
    );

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    await program.methods
      .declareResult(1)
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    await program.methods
      .claimWinnings(prediction)
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    try {
      await program.methods
        .claimWinnings(prediction)
        .accounts({
          betAccount: betAccount,
          gameAccount: gameAccountStartsIn3Seconds.publicKey,
          user: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([player1])
        .rpc();

      expect.fail("The transaction should have failed due to already claimed");
    } catch (err: any) {
      expect(err.message).to.include(
        "The program expected this account to be already initialized"
      );
    }
  });
  /*
  it("CloseGame - Result is declared but game not expired - Fails with correct error, game account closed and has correct balance", async () => {
    const betAmount = 30000000;
    const prediction = 1;

    // Derive the bet account PDA using the same seeds as in the Rust code
    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccountStartsIn3Seconds.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    await program.methods
      .makeBet(prediction, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    // Wait for the game to start
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + 3) * 1000)
    );

    const result = 1;

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    await program.methods
      .declareResult(result)
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    const gameAccountBalanceBeforeClose = await provider.connection.getBalance(
      gameAccountStartsIn3Seconds.publicKey
    );
    try {
      await program.methods
        .closeGame()
        .accounts({
          gameAccount: gameAccountStartsIn3Seconds.publicKey,
          programSettings: programSettingsPDA,
          manager: manager.publicKey,
        } as any)
        .signers([manager])
        .rpc();
      expect.fail("The closeGame should have failed");
    } catch (err: any) {
      expect(err.message).to.include("Game not expired");
    }

    const gameAccountBalanceAfterClose = await provider.connection.getBalance(
      gameAccountStartsIn3Seconds.publicKey
    );
  });

 */

  it("CloseGame - Result is declared and game expired - Game account closed, manager receives game balance, bet account still open with unchanged balance/fee", async () => {
    const betAmount = 30000000;
    const prediction = 1;

    // Derive the bet account PDA using the same seeds as in the Rust code
    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccountStartsIn3Seconds.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    await program.methods
      .makeBet(prediction, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    // Wait for the game to start
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + 3) * 1000)
    );

    const result = 1;

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    await program.methods
      .declareResult(result)
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    //Wait for the game to expire
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + expirationTime + 3) * 1000)
    );

    const managerBalanceBeforeClose = await provider.connection.getBalance(
      manager.publicKey
    );

    const gameAccountBalanceBeforeClose = await provider.connection.getBalance(
      gameAccountStartsIn3Seconds.publicKey
    );

    const betAccountBalanceBeforeClose = await provider.connection.getBalance(
      betAccount
    );

    expect(gameAccountBalanceBeforeClose).to.be.greaterThan(betAmount);

    await program.methods
      .closeGame()
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    const managerBalanceAfterClose = await provider.connection.getBalance(
      manager.publicKey
    );

    const betAccountBalanceAfterClose = await provider.connection.getBalance(
      betAccount
    );

    expect(
      managerBalanceAfterClose -
        managerBalanceBeforeClose -
        gameAccountBalanceBeforeClose
    ).to.equal(0);

    try {
      await program.account.game.fetch(gameAccountStartsIn3Seconds.publicKey);
      expect.fail("The game account should have been closed");
    } catch (err: any) {
      expect(err.message).to.include("Account does not exist");
    }

    expect(betAccountBalanceAfterClose).to.equal(betAccountBalanceBeforeClose);
  });

  it("CloseBetAccount - Game is closed - Bet account closed, player recieves fees", async () => {
    const betAmount = 30000000;
    const prediction = 1;

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccountStartsIn3Seconds.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    await program.methods
      .makeBet(prediction, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    // Wait for the game to start
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + 3) * 1000)
    );

    const result = 1;

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    await program.methods
      .declareResult(result)
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    //Wait for the game to expire
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + expirationTime + 1) * 1000)
    );

    await program.methods
      .closeGame()
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    const betAccountBalance = await provider.connection.getBalance(betAccount);

    const playerBalanceBeforeClose = await provider.connection.getBalance(
      player1.publicKey
    );

    await program.methods
      .closeBetAccount(prediction)
      .accounts({
        betAccount: betAccount,
        user: player1.publicKey,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
      } as any)
      .signers([player1])
      .rpc();

    const playerBalanceAfterClose = await provider.connection.getBalance(
      player1.publicKey
    );

    expect(
      playerBalanceAfterClose - playerBalanceBeforeClose - betAccountBalance
    ).to.equal(0);

    try {
      await program.account.bet.fetch(betAccount);
      expect.fail("The bet account should have been closed");
    } catch (err: any) {
      expect(err.message).to.include("Account does not exist");
    }
  });

  it("CloseBetAccount - Game is not closed - Fails with correct error, Bet account not closed", async () => {
    const betAmount = 30000000;
    const prediction = 1;

    const [betAccount, _bump1] = await anchor.web3.PublicKey.findProgramAddress(
      [
        player1.publicKey.toBuffer(),
        gameAccountStartsIn3Seconds.publicKey.toBuffer(),
        Buffer.from([prediction]),
      ],
      program.programId
    );

    await program.methods
      .makeBet(prediction, new anchor.BN(betAmount))
      .accounts({
        betAccount: betAccount,
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        user: player1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([player1])
      .rpc();

    // Wait for the game to start
    await new Promise((resolve) =>
      setTimeout(resolve, (timeOffset + 3) * 1000)
    );

    const result = 1;

    const [programSettingsPDA, _bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("settings")],
        program.programId
      );

    await program.methods
      .declareResult(result)
      .accounts({
        gameAccount: gameAccountStartsIn3Seconds.publicKey,
        programSettings: programSettingsPDA,
        manager: manager.publicKey,
      } as any)
      .signers([manager])
      .rpc();

    const betAccountBalance = await provider.connection.getBalance(betAccount);

    try {
      await program.methods
        .closeBetAccount(prediction)
        .accounts({
          betAccount: betAccount,
          user: player1.publicKey,
          gameAccount: gameAccountStartsIn3Seconds.publicKey,
        } as any)
        .signers([player1])
        .rpc();

      expect.fail("The closeBetAccount should have failed");
    } catch (err: any) {
      expect(err.message).to.include("Game not closed");
    }

    const betAccountBalanceAfterClose = await provider.connection.getBalance(
      betAccount
    );

    expect(betAccountBalanceAfterClose).to.equal(betAccountBalance);
  });
});
