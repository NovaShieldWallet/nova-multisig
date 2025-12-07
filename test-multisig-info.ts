import * as multisig from "@sqds/multisig";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

/**
 * Simple script to query multisig information
 * 
 * Usage:
 *   ts-node test-multisig-info.ts [multisig_address]
 * 
 * Environment Variables:
 *   SOLANA_CLUSTER - Cluster to use (mainnet-beta, devnet, testnet, or localhost)
 * 
 * Example:
 *   SOLANA_CLUSTER=devnet ts-node test-multisig-info.ts 5cSM7kjqnKcSvYkhzNiLx65RvX3oi3VYKuZ4pwqSjBHk
 */

async function getMultisigInfo() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const multisigAddress = args[0] || "5cSM7kjqnKcSvYkhzNiLx65RvX3oi3VYKuZ4pwqSjBHk";

  // Configuration
  const MULTISIG_PDA = new PublicKey(multisigAddress);
  
  // Determine cluster and program ID
  const cluster = (process.env.SOLANA_CLUSTER || "devnet") as any;
  const PROGRAM_ID = cluster === "localhost" 
    ? new PublicKey("SMPL1JzvaVRmKLfqeuD6EfHxGtkC8HnVioC6HBnK3zg") // Local test program
    : new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf"); // Mainnet/Devnet program ID
  
  // Connect to cluster
  const connection = cluster === "localhost"
    ? new Connection("http://127.0.0.1:8899", "confirmed")
    : new Connection(clusterApiUrl(cluster), "confirmed");
  
  console.log("=== Multisig Info Query ===");
  console.log("Cluster:", cluster);
  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("Multisig PDA:", MULTISIG_PDA.toBase58());
  console.log();

  try {
    // Fetch multisig account
    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      MULTISIG_PDA
    );

    console.log("📋 Multisig Configuration:");
    console.log("  Threshold:", multisigAccount.threshold);
    console.log("  Time Lock:", multisigAccount.timeLock, "seconds");
    console.log("  Transaction Index:", multisigAccount.transactionIndex.toString());
    console.log("  Stale Transaction Index:", multisigAccount.staleTransactionIndex.toString());
    console.log("  Config Authority:", multisigAccount.configAuthority.toBase58());
    console.log("  Rent Collector:", multisigAccount.rentCollector?.toBase58() || "None");
    console.log();

    console.log("👥 Members:", multisigAccount.members.length);
    multisigAccount.members.forEach((member, index) => {
      console.log(`  [${index + 1}] ${member.key.toBase58()}`);
      console.log(`      Permissions: ${member.permissions.mask.toString()}`);
    });
    console.log();

    // Get vault PDA (default vault is index 0)
    const vaultIndex = 0;
    const [vaultPda] = multisig.getVaultPda({
      multisigPda: MULTISIG_PDA,
      index: vaultIndex,
      programId: PROGRAM_ID,
    });

    console.log("🏦 Default Vault (Index 0):");
    console.log("  PDA:", vaultPda.toBase58());

    // Check vault balance
    const vaultBalance = await connection.getBalance(vaultPda);
    console.log("  Balance:", vaultBalance / LAMPORTS_PER_SOL, "SOL");
    console.log();

    // Try to fetch some recent transactions/proposals
    console.log("📝 Recent Transactions:");
    const currentIndex = BigInt(multisigAccount.transactionIndex);
    
    // Check last 5 transactions
    for (let i = 0n; i < 5n && currentIndex - i > 0n; i++) {
      const txIndex = currentIndex - i;
      const [proposalPda] = multisig.getProposalPda({
        multisigPda: MULTISIG_PDA,
        transactionIndex: txIndex,
        programId: PROGRAM_ID,
      });

      try {
        const proposal = await multisig.accounts.Proposal.fromAccountAddress(
          connection,
          proposalPda
        );
        
        console.log(`  Transaction #${txIndex}:`);
        console.log(`    Status: ${JSON.stringify(proposal.status)}`);
        console.log(`    Approved: ${proposal.approved.length}`);
        console.log(`    Rejected: ${proposal.rejected.length}`);
        console.log(`    Cancelled: ${proposal.cancelled.length}`);
      } catch (e) {
        // Transaction might not exist
        console.log(`  Transaction #${txIndex}: Not found`);
      }
    }

    console.log("\n✅ Successfully retrieved multisig information");

  } catch (error) {
    console.error("\n❌ Error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      if ('logs' in error) {
        console.error("Logs:", (error as any).logs);
      }
    }
    
    // Check if account exists
    console.log("\n🔍 Checking if account exists...");
    const accountInfo = await connection.getAccountInfo(MULTISIG_PDA);
    if (!accountInfo) {
      console.error("❌ Account does not exist at this address");
      console.error("   Make sure you're using the correct cluster and address");
    } else {
      console.log("✅ Account exists");
      console.log("   Owner:", accountInfo.owner.toBase58());
      console.log("   Data length:", accountInfo.data.length, "bytes");
      console.log("   Lamports:", accountInfo.lamports);
    }
  }
}

// Run the query
getMultisigInfo().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);

