import { useSelector } from "react-redux";
import AppHeader from "../components/layout/AppHeader.jsx";
import styles from "../App.module.css";

const highlights = [
  { value: "0", label: "Cartas en tu colección" },
  { value: "$0", label: "Valor estimado" },
  { value: "0", label: "Sets registrados" },
];

function HomePage() {
  const isAuthenticated = useSelector((state) => Boolean(state.auth.accessToken));

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <AppHeader />

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Tu colección, bajo control</p>
            <h1>
              El hogar de tus
              <span className={styles.accent}> cartas favoritas.</span>
            </h1>
            <p className={styles.description}>
              Guarda, organiza y sigue el valor de tu colección de TCG desde
              cualquier dispositivo.
            </p>
            <button className={styles.primaryButton} type="button">
              {isAuthenticated ? "Abrir colección" : "Explorar colección"}
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className={styles.heroCard} aria-hidden="true">
            <div className={styles.cardGlow} />
            <div className={styles.cardInner}>
              <span className={styles.cardSymbol}>✦</span>
              <span className={styles.cardLabel}>TCG WALLET</span>
              <span className={styles.cardTitle}>COLLECTION</span>
              <span className={styles.cardNumber}>001 / 001</span>
            </div>
          </div>
        </section>

        <section className={styles.highlights} aria-label="Resumen de colección">
          {highlights.map((highlight) => (
            <article className={styles.highlight} key={highlight.label}>
              <strong>{highlight.value}</strong>
              <span>{highlight.label}</span>
            </article>
          ))}
        </section>

        <footer className={styles.footer}>
          <span>La base para tu próxima colección.</span>
          <span>React Redux · CSS Modules</span>
        </footer>
      </section>
    </main>
  );
}

export default HomePage;
