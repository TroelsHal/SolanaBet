import * as buffer from "buffer";
import "../assets/styles/TextPage.css";

const Home: React.FC = () => {
  window.Buffer = buffer.Buffer;
  return (
    <div className="text-container">
      <h2>Bet on popular football games with Solana Testnet tokens.</h2>
      <br />
      <br />
      <h5>
        SolanaBet does not use real money. Read more about{" "}
        <a href="/questions">free Testnet tokens</a>.
      </h5>
      <br />
      <h5>
        You need a <a href="/questions">Phantom wallet</a> for your browser.
      </h5>
      <br />
      <h5>
        Go to games and <a href="/games">start betting</a>.
      </h5>
    </div>
  );
};

export default Home;
