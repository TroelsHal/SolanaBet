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

const Home: React.FC = () => {
  window.Buffer = buffer.Buffer;
  return (
    <div className="text-container">
      <h2>SolanaBet is a pool-betting platform.</h2>
      <br />
      <h5>
        You choose how much you want to bet on a game. When the game is over,
        all the betters that predicted the correct result share the total amount
        of bets.
      </h5>
      <br />
      <h5>Let’s look at a simple example:</h5>
      <h5>
        <strong>Alice</strong> bets 1 SOL on the <strong>home team.</strong>{" "}
        <Coin full={1} half={false} />
      </h5>
      <h5>
        <strong>Bob</strong> bets 3 SOL on the <strong>home team.</strong>
        <Coin full={3} half={false} />
      </h5>
      <h5>
        <strong>Carroll</strong> bets 6 SOL on the <strong>away team</strong>.
        <Coin full={6} half={false} />
      </h5>
      <h5>The total amount of bets is 10 SOL.</h5>
      <br />
      <h5>
        Let's say the <strong>home teams</strong> wins, so Alice and Bob share
        the 10 SOL.
      </h5>
      <br />
      <h5>
        25% of the bets on the correct result came from <strong>Alice</strong>,
        so she gets 25% of the 10 SOL.
        <Coin full={2} half={true} />
      </h5>
      <h5>
        75% of the bets on the correct result came from <strong>Bob</strong>, so
        he gets 75% of the 10 SOL.
        <Coin full={7} half={true} />
      </h5>
      <br />
      <h5>...and that’s all you need to know about pool betting.</h5>
      <br />{" "}
      <h5>
        Remember that you need a <a href="/questions">Phantom wallet</a> with{" "}
        <a href="/questions">Testnet tokens</a>, and then you are ready to go to
        the games and <a href="/questions">start betting</a>.{" "}
      </h5>
    </div>
  );
};

export default Home;
