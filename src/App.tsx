import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Report } from "./pages/Report";
import { BlogIndex } from "./pages/BlogIndex";
import { BlogPost } from "./pages/BlogPost";
import { Privacy } from "./pages/Privacy";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/report/:id" element={<Report />} />
        <Route path="/scan/:id" element={<LegacyScanRedirect />} />
      </Routes>
    </Layout>
  );
}

function LegacyScanRedirect() {
  const { id } = useParams();
  return <Navigate to={`/report/${id ?? ""}`} replace />;
}

export default App;
