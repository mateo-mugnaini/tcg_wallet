import styles from "./RuntimeError.module.css";

function RuntimeError({
  actionLabel = "Reintentar",
  message,
  onAction,
  title = "No pudimos cargar TCG Wallet",
}) {
  return (
    <main aria-labelledby="runtime-error-title" className={styles.page}>
      <section aria-describedby="runtime-error-message" className={styles.card} role="alert">
        <span aria-hidden="true" className={styles.mark}>!</span>
        <p className={styles.eyebrow}>TCG Wallet</p>
        <h1 className={styles.title} id="runtime-error-title">{title}</h1>
        <p className={styles.message} id="runtime-error-message">{message}</p>
        {onAction && (
          <button className={styles.action} onClick={onAction} type="button">
            {actionLabel}
          </button>
        )}
      </section>
    </main>
  );
}

export default RuntimeError;
