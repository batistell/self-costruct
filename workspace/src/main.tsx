import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

function App(){return <main><div className="badge">LIVE WORKSPACE</div><h1>Build something from the chat.</h1><p>The agent edits this repository on GitHub, commits the change, then asks the local supervisor to deploy that exact commit.</p></main>}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
