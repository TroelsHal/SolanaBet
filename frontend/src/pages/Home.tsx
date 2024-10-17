import * as buffer from "buffer";
import "../assets/styles/Home.css";
import "../assets/styles/TextPage.css";

const Home: React.FC = () => {
  window.Buffer = buffer.Buffer;

  return (
    <div className="home-container text-center">
      <div className="header-section">
        <h1 className="display-4 fw-bold">SolanaBet</h1>
        <p className="lead">
          Bet on popular football games with Solana Devnet tokens.
        </p>
        <a href="/games" className="btn btn-primary btn-lg mt-3">
          Start Betting →
        </a>
      </div>

      <div className="mt-5">
        <h2 className="fw-bold">Getting Started</h2>
        <p className="lead">
          SolanaBet does not use real money. Read more about getting{" "}
          <a href="/questions" className="custom-link">
            free Devnet tokens
          </a>
          .
        </p>
        <p className="lead">
          You need a{" "}
          <a href="/questions" className="custom-link">
            Phantom wallet
          </a>{" "}
          for your browser.
        </p>
      </div>
    </div>
  );
};

export default Home;
