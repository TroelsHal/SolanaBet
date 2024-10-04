import React from "react";
import { Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "bootstrap/dist/css/bootstrap.min.css";
import "../assets/styles/Header.css";

const Header: React.FC = () => {
  return (
    <header className="header">
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <img
              src={process.env.PUBLIC_URL + "/favicon.png"}
              alt="SolanaBet Logo"
              width="30"
              height="30"
              className="me-2"
            />
            SolanaBet
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link to="/games" className="nav-link">
                  Games
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/my-bets" className="nav-link">
                  My bets
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/how-to-bet" className="nav-link">
                  How to bet
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/questions" className="nav-link">
                  Questions?
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/my-account" className="nav-link">
                  My Solana account
                </Link>
              </li>
            </ul>
            <ul className="navbar-nav mb-2 mb-lg-0">
              <li className="nav-item">
                <div className="d-flex">
                  <WalletMultiButton />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
