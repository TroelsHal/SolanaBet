import * as buffer from "buffer";
import "../assets/styles/TextPage.css";
import coinIcon from "../assets/icons/coin.png";
import halfCoinIcon from "../assets/icons/halfcoin.png";

const Coin = ({ full, half }: { full: number; half?: boolean }) => {
  const coins = Array(full)
    .fill(0)
    .map((_, idx) => (
      <img
        key={`full-coin-${idx}`}
        src={coinIcon}
        alt="coin"
        className="coin-icon"
      />
    ));

  const halfCoin = half ? (
    <img
      key="half-coin"
      src={halfCoinIcon}
      alt="half coin"
      className="coin-icon half-coin"
    />
  ) : null;

  return (
    <>
      {coins}
      {halfCoin}
    </>
  );
};

const HowToBet: React.FC = () => {
  window.Buffer = buffer.Buffer;
  return (
    <div className="text-container">
      <h1>SolanaBet is a pool-betting platform.</h1>
      <br />
      <p className="lead">
        Predict a result and choose how much you want to bet.
      </p>
      <p className="lead">
        When the game is over, all the betters that predicted the correct result
        share the total sum of bets.
      </p>
      <br />
      <h3>Let’s look at a simple example</h3>
      <p className="lead">
        <strong>Alice</strong> bets 1 SOL on the <strong>home</strong> team.
        <Coin full={1} half={false} />
      </p>
      <p className="lead">
        <strong>Bob</strong> bets 3 SOL on the <strong>home</strong> team.
        <Coin full={3} half={false} />
      </p>
      <p className="lead">
        <strong>Carroll</strong> bets 6 SOL on the <strong>away</strong> team.
        <Coin full={6} half={false} />
      </p>
      <p className="lead">The total amount of bets is 10 SOL.</p>
      <br />
      <p className="lead">
        Let's say the <strong>home</strong> team wins, so Alice and Bob share
        the 10 SOL.
      </p>
      <br />
      <p className="lead">
        25% of the bets on the correct result came from <strong>Alice</strong>,
        so she gets 25% of the 10 SOL.
        <Coin full={2} half={true} />
      </p>
      <p className="lead">
        75% of the bets on the correct result came from <strong>Bob</strong>, so
        he gets 75% of the 10 SOL.
        <Coin full={7} half={true} />
      </p>
      <br />
      <p className="lead">
        ... and that’s all you need to know about pool betting.
      </p>
      <br />
      <h3>Getting started</h3>
      <p className="lead">
        Remember that you need a{" "}
        <a href="/questions" className="custom-link">
          Phantom wallet
        </a>{" "}
        with{" "}
        <a href="/questions" className="custom-link">
          Devnet tokens
        </a>
        , and then you are ready to go to the games and{" "}
        <a href="/questions" className="custom-link">
          start betting
        </a>
        .{" "}
      </p>
    </div>
  );
};

export default HowToBet;
