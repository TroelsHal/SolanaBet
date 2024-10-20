<h2>Bet on popular football games with Solana Devnet tokens.</h2>

Solana Bet is a Solana program that lets the user bet Solana tokens on selected football (soccer) games.

The program can be accessed through the user friendly web client at: https://solanabet.troelshalgreen.dk

### Code

You might want to look at these files:

- Solana/Rust program: [lib.rs](backend/programs/betting/src/lib.rs)
- The test file documenting usage of the program: [betting.ts](backend/tests/betting.ts)
- The deployed program on Solana Explorer: [View on Solana Explorer](https://explorer.solana.com/address/5vSrWYFQcnQA4Lu49WjwaSb8P9AD6ZN8KiLWPEunYnrD?cluster=devnet)

### Technologies

The Solana program is made with:

- Rust, Anchor

The Solana program is tested with:

- Typescript, Mocha

The website is made with:

- React, Typescript, Anchor, Phantom Wallet

### About

All code is written by Troels Halgreen.

This program (still) only uses free devnet tokens.

### To do

- [x] Check/fix external links
- [ ] Fix timezone on MyBets page
- [x] Migrate to devnet
- [ ] Validate program on Solana Explorer
- [ ] Add security.txt
- [ ] Show amounts in both lamports and SOL
