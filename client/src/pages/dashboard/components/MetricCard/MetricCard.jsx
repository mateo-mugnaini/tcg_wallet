import styles from "./MetricCard.module.css";

function MetricCard({ label, value, caption, accent = false }) {
  return (
    <article className={`${styles.card} ${accent ? styles.accent : ""}`}>
      <p className={styles.label}>{label}</p>
      <strong className={styles.value}>{value}</strong>
      <span className={styles.caption}>{caption}</span>
    </article>
  );
}

export default MetricCard;
