import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Report } from "./pages/Report";
import { BlogIndex } from "./pages/BlogIndex";
import { BlogPost } from "./pages/BlogPost";
import { Privacy } from "./pages/Privacy";
import { NotFound } from "./pages/NotFound";
import { ModsDirectory } from "./pages/ModsDirectory";
import { ModReport } from "./pages/ModReport";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mods" element={<ModsDirectory />} />
        <Route path="/mods/:slug" element={<ModReport />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/report/:id" element={<Report />} />
        <Route path="/scan/:id" element={<LegacyScanRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function LegacyScanRedirect() {
  const { id } = useParams();
  return <Navigate to={`/report/${id ?? ""}`} replace />;
}

export default App;
