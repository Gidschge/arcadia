import { Outlet } from "react-router-dom";
import Ads from "./Ads.jsx";
import Leaderboard from "./Leaderboard.jsx";

export default function Layout() {
    return (
        <div className="arcadiaRoot">
            <header className="arcadiaTopbar">
                <input className="arcadiaSearch" placeholder="Search" />
                <div className="arcadiaTitle">Arcadia</div>
                <div className="arcadiaTopRight">
                    <div className="arcadiaCoins">Coins: 0</div>
                    <button className="arcadiaLogin">Login</button>
                </div>
            </header>

            <div className="arcadiaGrid">
                <aside className="arcadiaLeft">
                    <Ads />
                </aside>

                <section className="arcadiaCenter">
                    <Outlet />
                </section>

                <aside className="arcadiaRight">
                    <Leaderboard />
                </aside>
            </div>
        </div>
    );
}
