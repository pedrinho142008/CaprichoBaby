import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AdminPanel from "./AdminPanel";
import "./AdminPanel.css";

function AdminPage() {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem("caprichobaby_products");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("caprichobaby_products", JSON.stringify(products));
    } catch (error) {
      console.error("Não foi possível salvar os produtos:", error);
    }
  }, [products]);

  return (
    <AdminPanel
      products={products}
      setProducts={setProducts}
      onClose={() => {
        window.location.href = "/";
      }}
    />
  );
}

createRoot(document.getElementById("admin-root")).render(<AdminPage />);
