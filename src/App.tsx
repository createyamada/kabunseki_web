import { BrowserRouter } from "react-router-dom";
import "./assets/css/App.css";
import { Header } from "./components/Header";
import Routers from "./routers";

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Header className="header" />
        <main className="c-main">
          <Routers />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
