import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import WalletContextProvider from "./contexts/WalletContextProvider";
import { SolanaServiceProvider } from "./contexts/SolanaServiceContext";

import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/styles/App.css";

import Header from "./components/Header";
import Home from "./pages/Home";
import CreateGame from "./pages/CreateGame";
import CloseGame from "./pages/CloseGame";
import GamesOverview from "./pages/GamesOverview";
import MyAccount from "./pages/MyAccount";
import Questions from "./pages/Questions";
import HowToBet from "./pages/HowToBet";
import MakeBet from "./pages/MakeBet";
import DeclareResult from "./pages/DeclareResult";
import MyBets from "./pages/MyBets";
import { GamesProvider } from "./contexts/GamesContext";

const App: React.FC = () => {
  return (
    <WalletContextProvider>
      <SolanaServiceProvider>
        <GamesProvider>
          <Router>
            <div className="fixed-width-container">
              <Header />
              <div className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/questions" element={<Questions />} />
                  <Route path="/create-game" element={<CreateGame />} />
                  <Route path="/close-expired-games" element={<CloseGame />} />
                  <Route path="/games" element={<GamesOverview />} />
                  <Route path="/my-account" element={<MyAccount />} />
                  <Route path="/make-bet" element={<MakeBet />} />
                  <Route path="/declare-result" element={<DeclareResult />} />
                  <Route path="/my-bets" element={<MyBets />} />
                  <Route path="/how-to-bet" element={<HowToBet />} />
                </Routes>
              </div>
            </div>
          </Router>
        </GamesProvider>
      </SolanaServiceProvider>
    </WalletContextProvider>
  );
};

export default App;
