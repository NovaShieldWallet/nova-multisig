# Nova Multisig Program

[![Crates.io](https://img.shields.io/crates/v/nova-multisig-program.svg)](https://crates.io/crates/nova-multisig-program)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

The Nova Shield fork of Squads Protocol v4 - A Solana multisig program with advanced features.

**Now compatible with Solana 2.2+ and Anchor 0.31!**

## About

This is the core program crate for the Nova Shield multisig protocol. It contains the on-chain program logic and can be used for:

1. **Program development**: Building on top of the multisig protocol
2. **CPI (Cross-Program Invocation)**: Calling the multisig from other Solana programs
3. **Type definitions**: Accessing state structures and instruction data

## Features

- ✅ Multi-signature wallet functionality
- ✅ Time locks
- ✅ Spending limits
- ✅ Role-based permissions
- ✅ Batch transactions
- ✅ Address lookup table support
- ✅ Config transactions
- ✅ Vault management

## Installation

For CPI or type access in your Solana program:

```toml
[dependencies]
nova-multisig-program = { version = "0.1.0", features = ["cpi", "no-entrypoint"] }
anchor-lang = "0.29.0"
```

## Usage

### Using Types

```rust
use nova_multisig_program::state::{Multisig, Proposal, Member};
```

### Cross-Program Invocation (CPI)

```rust
use nova_multisig_program::cpi;
use anchor_lang::prelude::*;

// Call multisig from your program
cpi::proposal_create(
    ctx,
    // ... parameters
)?;
```

## Features

- `cpi` - Enable CPI functionality
- `no-entrypoint` - Disable program entrypoint (required for CPI)
- `no-idl` - Disable IDL generation
- `custom-heap` - Use custom heap allocation (default)

## Program Addresses

The Nova Shield multisig program is deployed to:
- **Solana Mainnet**: (Check with Nova Shield team)
- **Solana Devnet**: (Check with Nova Shield team)

## Fork Information

This is a fork of the original [Squads Protocol v4](https://github.com/Squads-Protocol/v4). The only modifications made by Nova Shield LLC are:
- Program address updates to Nova Shield's deployment
- Treasury address updates

All core functionality remains unchanged from the audited Squads Protocol v4.

## Security

The underlying Squads Protocol v4 has been extensively audited by:
- **OtterSec** - Multiple audits
- **Neodyme** - Multiple audits
- **Certora** - Formal verification
- **Trail of Bits** - Security audit

Audit reports are available in the [audits directory](https://github.com/NovaShieldWallet/nova-multisig/tree/main/audits).

## Documentation

- [Main Repository](https://github.com/NovaShieldWallet/nova-multisig)
- [Original Squads V4 Docs](https://docs.squads.so)
- [Rust SDK](../../sdk/rs)

## License

AGPL-3.0 - See [LICENSE](../../LICENSE) for details.

## Contact

- Email: hi@nshield.org
- Repository: https://github.com/NovaShieldWallet/nova-multisig



