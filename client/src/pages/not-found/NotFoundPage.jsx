import { Link } from "react-router-dom";
import styles from "../Page.module.css";

function NotFoundPage() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>404</p>
          <h1 className={styles.title}>Página no encontrada</h1>
          <p className={styles.description}>
            La dirección que buscas no existe o ya no está disponible.
          </p>
        </div>
      </header>
      <article className={styles.card}>
        <Link className={styles.link} to="/dashboard">
          Volver al dashboard
        </Link>
      </article>
    </section>
  );
}

export default NotFoundPage;
