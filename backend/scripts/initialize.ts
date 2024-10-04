import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { Betting } from "../target/types/betting";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Betting as Program<Betting>;
  console.log("Program ID: ", program.programId.toBase58());
  const manager = new anchor.web3.PublicKey(
    "GtEEL4x3TdTw2KaBLuRMGzjodrThjasLhvXUUwzsCcAS"
  );

  const player = new anchor.web3.PublicKey(
    "Cn2ycBdQNdtWzBWKTCL3brFxdBhF6KXxpJBrcsyu85pU"
  );

  // Use the provider's wallet keypair (from the file system)
  const initializer = provider.wallet.publicKey;

  /*  const airdropInitializer_tx = await provider.connection.requestAirdrop(
    initializer.publicKey,
    anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropInitializer_tx);

  const airdropManager_tx = await provider.connection.requestAirdrop(
    manager,
    2 * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropManager_tx);

  const airdropPlayer_tx = await provider.connection.requestAirdrop(
    player,
    2 * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropPlayer_tx);
  */

  const [programSettingsPDA, _bump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("settings")],
      program.programId
    );

  await program.methods
    .initializeProgram(manager)
    .accounts({
      programSettings: programSettingsPDA,
      user: initializer,
    } as any)
    .signers([])
    .rpc();

  // read manager from program
  const programSettings = await program.account.programSettings.fetch(
    programSettingsPDA
  );

  const managerFromProgram = programSettings.manager.toString();
  console.log("Program initialized with manager: ", managerFromProgram);
}

main().then(() => process.exit());
