import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AdminPanel from "./AdminPanel";
import { supabase } from "./supabase";
import "./AdminPanel.css";

function AdminPage() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function checkAdmin(user) {
    setAuthorized(false);

    if (!user) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar perfil:", error);
      setMessage("Não foi possível verificar a permissão. Tente novamente.");
      return false;
    }

    if (data?.role !== "admin") {
      setMessage("Esta conta não tem permissão de administrador.");
      return false;
    }

    setMessage("");
    setAuthorized(true);
    return true;
  }

  useEffect(() => {
    let alive = true;

    async function init() {
      const { data, error } = await supabase.auth.getSession();

      if (!alive) return;

      if (error) {
        setMessage("Não foi possível verificar a sessão.");
        setChecking(false);
        return;
      }

      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        await checkAdmin(currentSession.user);
      }

      if (alive) setChecking(false);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!alive) return;

        setSession(newSession);
        setChecking(true);

        // Evita fazer uma consulta ao Supabase diretamente dentro do callback.
        Promise.resolve().then(async () => {
          if (newSession?.user) {
            await checkAdmin(newSession.user);
          } else {
            setAuthorized(false);
            setMessage("");
          }

          if (alive) setChecking(false);
        });
      }
    );

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      setSession(data.session);
      const allowed = await checkAdmin(data.user);

      if (!allowed) {
        await supabase.auth.signOut();
        setSession(null);
      }
    } catch (error) {
      console.error("Erro no login administrativo:", error);
      setMessage(error.message || "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage("Não foi possível sair. Tente novamente.");
      console.error(error);
    } else {
      setSession(null);
      setAuthorized(false);
      setPassword("");
      setMessage("");
    }

    setBusy(false);
  }

  if (checking) {
    return <main className="cb-admin"><p>Verificando acesso...</p></main>;
  }

  if (session?.user && authorized) {
    return (
      <>
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 12,
          padding: "12px 18px",
          background: "#fffaf7"
        }}>
          <span style={{ fontSize: 13 }}>{session.user.email}</span>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            style={{
              border: "1px solid #e7d8d0",
              borderRadius: 20,
              padding: "9px 15px",
              background: "#fff",
              cursor: "pointer"
            }}
          >
            {busy ? "Saindo..." : "Sair"}
          </button>
        </div>

        <AdminPanel
          onClose={() => { window.location.href = "/"; }}
        />
      </>
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 20,
      background: "#fff8f5",
      color: "#543d43"
    }}>
      <form
        onSubmit={login}
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 28,
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 12px 40px #543d4312",
          display: "grid",
          gap: 15
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <img
            src="/icon_capricho.png"
            alt="Capricho Baby"
            style={{ width: 68, height: 68, objectFit: "contain" }}
          />
          <h1 style={{ fontSize: 24, margin: "10px 0 6px" }}>
            Área administrativa
          </h1>
          <p style={{ margin: 0, fontSize: 14 }}>
            Entre com sua conta autorizada.
          </p>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          E-mail
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 13,
              border: "1px solid #e7d8d0",
              borderRadius: 12
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 13,
              border: "1px solid #e7d8d0",
              borderRadius: 12
            }}
          />
        </label>

        {message && (
          <p role="alert" style={{ color: "#a33345", fontSize: 14 }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            padding: 14,
            border: 0,
            borderRadius: 14,
            background: "#9b6477",
            color: "white",
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer"
          }}
        >
          {busy ? "Verificando..." : "Entrar"}
        </button>

        <a
          href="/"
          style={{ textAlign: "center", color: "#795764", fontSize: 14 }}
        >
          Voltar à loja
        </a>
      </form>
    </main>
  );
}

createRoot(document.getElementById("admin-root")).render(<AdminPage />);
