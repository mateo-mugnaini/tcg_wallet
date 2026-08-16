import { useState } from "react";
import AuthForm from "./components/AuthForm/AuthForm.jsx";
import styles from "./authPages.module.css";

function AuthPages() {
  const [mode, setMode] = useState("login");

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <div className={styles.brand} aria-hidden="true">T</div>
        <p className={styles.eyebrow}>TCG Wallet</p>
        <h1 className={styles.title} id="auth-title">
          {mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
        </h1>
        <p className={styles.subtitle}>
          {mode === "login"
            ? "Entra para gestionar tu colección."
            : "Empieza a organizar tus cartas favoritas."}
        </p>

        <AuthForm mode={mode} onModeChange={setMode} />
      </section>
    </main>
  );
}

export default AuthPages;
