import styles from "./App.module.css";

const highlights = [
  {
    value: "0",
    label: "Cartas en tu colección",
  },
  {
    value: "$0",
    label: "Valor estimado",
  },
  {
    value: "0",
    label: "Sets registrados",
  },
];

function App() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <nav className={styles.navigation} aria-label="Navegación principal">
          <a className={styles.brand} href="/" aria-label="TCG Wallet inicio">
            <span className={styles.brandMark}>T</span>
            <span>TCG Wallet</span>
          </a>
          <span className={styles.status}>
            <span className={styles.statusDot} aria-hidden="true" />
            Frontend listo
          </span>
        </nav>

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
              Explorar colección
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
          <span>Vite · React · CSS Modules</span>
        </footer>
      </section>
    </main>
  );
}

export default App;
