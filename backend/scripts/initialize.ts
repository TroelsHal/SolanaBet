import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { Betting } from "../target/types/betting";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Betting as Program<Betting>;
  console.log("Program ID: ", program.programId.toBase58());
  const manager = new anchor.web3.PublicKey(
    "GtEEL4x3TdTw2KaBLuRMGzjodrThjasLhvXUUwzsCcAS"
  );

  // Use the provider's wallet keypair (from the file system)
  const initializer = provider.wallet.publicKey;

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
