import "./App.css";
import { Router, Route } from "preact-router";


// Show vite.config.ts base path
const basePath = (path: string) => `/admin${path === "/" ? "" : path}`;

export default function App() {
  return (
    <Router>
      <Route path={basePath("/")} component={() => <div>Home</div>} />
      <Route path={basePath("/faq")} component={() => <div>FAQ</div>} />
    </Router>
  );
}
