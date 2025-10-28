# Nova Multisig - Rust SDK

[![Crates.io](https://img.shields.io/crates/v/nova-multisig.svg)](https://crates.io/crates/nova-multisig)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

A Rust SDK for interacting with the Nova Shield fork of Squads Protocol v4 on Solana.

**Now compatible with Solana 2.2+!**

## About

This is the official Rust SDK for the Nova Shield multisig protocol - a fork of [Squads Protocol v4](https://github.com/Squads-Protocol/v4). The Nova Shield fork maintains the same robust multisig functionality while being deployed to Nova Shield's custom program addresses.

## Features

- ✅ Complete multisig transaction support
- ✅ Proposal creation and voting
- ✅ Vault transaction management
- ✅ Batch operations
- ✅ Config transactions
- ✅ PDA (Program Derived Address) utilities
- ✅ Full type safety with Rust

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
nova-multisig = "0.2.0"
```

## Quick Start

```rust
use nova_multisig::{client, pda, state};
use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;

// Initialize RPC client
let rpc = RpcClient::new("https://api.mainnet-beta.solana.com".to_string());

// Get multisig PDA
let create_key = Pubkey::new_unique();
let (multisig_pda, bump) = pda::get_multisig_pda(&create_key);

// Use the client to interact with the multisig
// (See examples for more detailed usage)
```

## Usage Examples

### Creating a Multisig

```rust
use nova_multisig::state::{Member, Permissions};

let members = vec![
    Member {
        key: member1_pubkey,
        permissions: Permissions::all(),
    },
    Member {
        key: member2_pubkey,
        permissions: Permissions::all(),
    },
];

let threshold = 2; // Require 2 signatures
```

### Working with Proposals

```rust
use nova_multisig::state::Proposal;

// Fetch a proposal
let proposal_pda = pda::get_proposal_pda(&multisig_pda, 1);
// Use RPC to fetch and deserialize the account
```

## iOS Integration

This SDK is designed to work seamlessly with iOS applications through Rust FFI. For iOS integration:

1. Build the library as a static lib or cdylib
2. Use UniFFI or cbindgen to generate Swift bindings
3. Create an XCFramework for distribution

See the main repository documentation for detailed iOS integration guides.

## Program Addresses

The Nova Shield multisig program is deployed to:
- **Solana Mainnet**: (Check with Nova Shield team)
- **Solana Devnet**: (Check with Nova Shield team)

## Documentation

- [Main Repository](https://github.com/NovaShieldWallet/nova-multisig)
- [Original Squads V4 Docs](https://docs.squads.so/main/v/development/development/overview)

## Fork Information

This is a fork of the original Squads Protocol v4. The only modifications made by Nova Shield LLC are:
- Program address updates to Nova Shield's deployment
- Treasury address updates

All core functionality remains unchanged from the audited Squads Protocol v4.

## Security

The underlying Squads Protocol v4 has been audited by:
- OtterSec
- Neodyme  
- Certora (with formal verification)
- Trail of Bits

Audit reports are available in the [audits directory](https://github.com/NovaShieldWallet/nova-multisig/tree/main/audits).

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](../../LICENSE) file for details.

## Contact

For issues related to this Nova Shield fork:
- Email: hi@nshield.org
- Repository: https://github.com/NovaShieldWallet/nova-multisig

For issues related to the underlying Squads V4 protocol, please refer to the [original repository](https://github.com/Squads-Protocol/v4).



