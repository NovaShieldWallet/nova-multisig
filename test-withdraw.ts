import * as multisig from "@sqds/multisig";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  clusterApiUrl,
} from "@solana/web3.js";
import * as fs from "fs";

/**
 * Test script to withdraw SOL from a multisig vault
 * 
 * Usage:
 *   ts-node test-withdraw.ts [multisig_address] [destination_address] [amount_in_sol]
 * 
 * Environment Variables:
 *   MEMBER_KEYPAIR_PATH - Path to member's keypair JSON file (required)
 *   SOLANA_CLUSTER - Cluster to use (mainnet-beta, devnet, testnet, or localhost)
 * 
 * Example:
 *   MEMBER_KEYPAIR_PATH=~/.config/solana/id.json ts-node test-withdraw.ts \
 *     5cSM7kjqnKcSvYkhzNiLx65RvX3oi3VYKuZ4pwqSjBHk \
 *     YourDestinationAddress111111111111111111111111 \
 *     0.1
 */

function loadKeypairFromFile(path: string): Keypair {
  const secretKey = JSON.parse(fs.readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function testWithdraw() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const multisigAddress = args[0] || "5cSM7kjqnKcSvYkhzNiLx65RvX3oi3VYKuZ4pwqSjBHk";
  const destinationAddress = args[1] || Keypair.generate().publicKey.toBase58();
  const withdrawAmountSol = parseFloat(args[2] || "0.1");

  // Configuration
  const MULTISIG_PDA = new PublicKey(multisigAddress);
  const destination = new PublicKey(destinationAddress);
  const withdrawAmount = withdrawAmountSol * LAMPORTS_PER_SOL;
  
  // Determine cluster and program ID
  const cluster = (process.env.SOLANA_CLUSTER || "devnet") as any;
  const PROGRAM_ID = cluster === "localhost" 
    ? new PublicKey("SMPL1JzvaVRmKLfqeuD6EfHxGtkC8HnVioC6HBnK3zg") // Local test program
    : new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf"); // Mainnet/Devnet program ID
  
  // Connect to cluster
  const connection = cluster === "localhost"
    ? new Connection("http://127.0.0.1:8899", "confirmed")
    : new Connection(clusterApiUrl(cluster), "confirmed");
  
  // Load member keypair
  const keypairPath = process.env.MEMBER_KEYPAIR_PATH;
  if (!keypairPath) {
    console.error("❌ Error: MEMBER_KEYPAIR_PATH environment variable not set");
    console.error("\nUsage:");
    console.error("  MEMBER_KEYPAIR_PATH=~/.config/solana/id.json ts-node test-withdraw.ts <multisig> <destination> <amount>");
    process.exit(1);
  }

  const member = loadKeypairFromFile(keypairPath);
  
  console.log("=== Multisig Withdraw Test ===");
  console.log("Cluster:", cluster);
  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("Multisig PDA:", MULTISIG_PDA.toBase58());
  console.log("Member Public Key:", member.publicKey.toBase58());
  console.log("Destination:", destination.toBase58());
  console.log("Amount:", withdrawAmountSol, "SOL");
  console.log();

  try {
    // Fetch multisig account
    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      MULTISIG_PDA
    );

    console.log("📋 Multisig Info:");
    console.log("  Threshold:", multisigAccount.threshold);
    console.log("  Members:", multisigAccount.members.length);
    console.log("  Transaction Index:", multisigAccount.transactionIndex.toString());
    console.log();

    // Get vault PDA (default vault is index 0)
    const vaultIndex = 0;
    const [vaultPda] = multisig.getVaultPda({
      multisigPda: MULTISIG_PDA,
      index: vaultIndex,
      programId: PROGRAM_ID,
    });

    console.log("🏦 Vault PDA:", vaultPda.toBase58());

    // Check vault balance
    const vaultBalance = await connection.getBalance(vaultPda);
    console.log("  Vault Balance:", vaultBalance / LAMPORTS_PER_SOL, "SOL");
    console.log();

    if (vaultBalance === 0) {
      console.log("⚠️  Warning: Vault has no balance to withdraw!");
      return;
    }


    // Calculate next transaction index
    const transactionIndex = BigInt(multisigAccount.transactionIndex) + 1n;
    console.log("🔢 Transaction Index:", transactionIndex.toString());

    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: vaultPda,
      toPubkey: destination,
      lamports: withdrawAmount,
    });

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();

    // Create transaction message
    const transactionMessage = new TransactionMessage({
      payerKey: vaultPda,
      recentBlockhash: blockhash,
      instructions: [transferInstruction],
    });

    console.log("\n📝 Step 1: Creating vault transaction...");
    
    // Create vault transaction
    let signature = await multisig.rpc.vaultTransactionCreate({
      connection,
      feePayer: member,
      multisigPda: MULTISIG_PDA,
      transactionIndex,
      creator: member.publicKey,
      vaultIndex,
      ephemeralSigners: 0,
      transactionMessage,
      memo: `Withdraw ${withdrawAmount / LAMPORTS_PER_SOL} SOL`,
      programId: PROGRAM_ID,
    });
    await connection.confirmTransaction(signature);
    console.log("✅ Transaction created:", signature);

    console.log("\n📝 Step 2: Creating proposal...");
    
    // Create proposal
    signature = await multisig.rpc.proposalCreate({
      connection,
      feePayer: member,
      multisigPda: MULTISIG_PDA,
      transactionIndex,
      creator: member,
      programId: PROGRAM_ID,
    });
    await connection.confirmTransaction(signature);
    console.log("✅ Proposal created:", signature);

    console.log("\n📝 Step 3: Approving proposal...");
    console.log(`ℹ️  Note: You need ${multisigAccount.threshold} approvals to execute`);
    
    // Approve proposal
    signature = await multisig.rpc.proposalApprove({
      connection,
      feePayer: member,
      multisigPda: MULTISIG_PDA,
      transactionIndex,
      member: member,
      memo: "Approved",
      programId: PROGRAM_ID,
    });
    await connection.confirmTransaction(signature);
    console.log("✅ Proposal approved (1/", multisigAccount.threshold, "):", signature);

    // Check proposal status
    const [proposalPda] = multisig.getProposalPda({
      multisigPda: MULTISIG_PDA,
      transactionIndex,
      programId: PROGRAM_ID,
    });

    const proposalAccount = await multisig.accounts.Proposal.fromAccountAddress(
      connection,
      proposalPda
    );

    console.log("\n📊 Proposal Status:");
    console.log("  Status:", JSON.stringify(proposalAccount.status));
    console.log("  Approved:", proposalAccount.approved.length);
    console.log("  Rejected:", proposalAccount.rejected.length);
    console.log("  Cancelled:", proposalAccount.cancelled.length);

    // Check if approved and ready to execute
    if (multisig.types.isProposalStatusApproved(proposalAccount.status)) {
      console.log("\n📝 Step 4: Executing transaction...");
      
      signature = await multisig.rpc.vaultTransactionExecute({
        connection,
        feePayer: member,
        multisigPda: MULTISIG_PDA,
        transactionIndex,
        member: member,
        signers: [member],
        programId: PROGRAM_ID,
      });
      await connection.confirmTransaction(signature);
      console.log("✅ Transaction executed:", signature);
      console.log("\n🎉 Withdrawal completed successfully!");
      
      // Check final balances
      const finalVaultBalance = await connection.getBalance(vaultPda);
      const destinationBalance = await connection.getBalance(destination);
      console.log("\n💰 Final Balances:");
      console.log("  Vault:", finalVaultBalance / LAMPORTS_PER_SOL, "SOL");
      console.log("  Destination:", destinationBalance / LAMPORTS_PER_SOL, "SOL");
    } else {
      console.log("\n⏳ Proposal needs more approvals before execution");
      console.log(`   Required: ${multisigAccount.threshold}`);
      console.log(`   Current: ${proposalAccount.approved.length}`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      if ('logs' in error) {
        console.error("Logs:", (error as any).logs);
      }
    }
  }
}

// Run the test
testWithdraw().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);

