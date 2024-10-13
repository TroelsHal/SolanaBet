import * as buffer from "buffer";
import program from "../config/idl.json";
import "../assets/styles/TextPage.css";

const Questions: React.FC = () => {
  window.Buffer = buffer.Buffer;

  const programAddress = program.address;
  return (
    <div className="text-container">
      <p>
        <strong>Why should I bet with SolanaBet?</strong>
      </p>
      <p>
        SolanaBet uses a program on the Solana Blockchain, ensuring that all
        bets are securely stored on the blockchain until they are paid out to
        the winners. The blockchain program automatically calculates the payouts
        and distributes them to the correct bettors.
      </p>
      <p>
        The blockchain program is open source and available on{" "}
        <a
          href={`https://github.com`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Github
        </a>{" "}
        and on{" "}
        <a
          href={`https://explorer.solana.com/tx/${programAddress}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Solana Explorer
        </a>
        .
      </p>
      <p>
        <strong>Do I need to bet real money?</strong>
      </p>
      <p>
        No, SolanaBet does not use real money. It is deployed on the Solana
        Devnet and uses only Devnet Tokens.
      </p>
      <p>
        <strong>How do I get free tokens?</strong>
      </p>
      <p>
        Get free Devnet tokens{" "}
        <a
          href={`https://solfaucet.com/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>{" "}
        and{" "}
        <a
          href={`https://faucet.quicknode.com/solana/devnet/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
        . You will need to provide your Solana account address, which you can
        find in your wallet.
      </p>
      <p>
        <strong>How do I get a wallet?</strong>
      </p>
      <p>
        You need a Phantom Wallet browser extension. You can{" "}
        <a
          href={`https://phantom.app/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          download it here
        </a>
        .
      </p>

      <p>
        <strong>How can I see the odds?</strong>
      </p>
      <p>
        There are no fixed odds with SolanaBet. Winners share the total betting
        pool, so potential winnings depend on the total number of bets and can
        change after you place your bet.
      </p>
      <p>
        <strong>Are there any fees, when I bet on SolanaBet?</strong>
      </p>
      <p>
        There are two types of fees:
        <ul>
          <li>
            A small fee is paid to the Solana blockchain when you place a bet.
            You can reclaim part of this fee on <a href="/my-bets">My Bets</a>{" "}
            after the game ends.
          </li>
          <li>
            {" "}
            If you bet on the correct result, a 1% winning fee is deducted from
            your payout.
          </li>
        </ul>
      </p>
      <p>
        <strong>I have won, how do I get my payout?</strong>
      </p>
      <p>
        You can view your bets and claim your payout directly to your wallet
        through the <a href="/my-bets">My Bets</a> page.
      </p>
      <p>
        <strong>When can I get my payout?</strong>
      </p>
      <p>
        Payouts are available 24 hours after a game ends. You must claim your
        payout within 6 months after the game has ended. After 6 months, the bet
        expires, and payouts can no longer be claimed.
      </p>
      <p>
        <strong>What happens if no one bets on the correct result?</strong>
      </p>
      <p>
        If no one bets on the correct result, all bettors will receive a full
        refund of their original bets. No winning fees apply in this case.
      </p>
      <p>
        <strong> What happens if a game is cancelled?</strong>
      </p>
      <p>
        If a game is cancelled, all bettors will receive a full refund of their
        original bets. No winning fees apply in this case.
      </p>
    </div>
  );
};

export default Questions;
