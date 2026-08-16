import styles from "./PricePanel.module.css";

function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined) return "—";

  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function PricePanel({ title, latest, stats, list, graded = false }) {
  return (
    <article className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{graded ? "Graded" : "Normal"}</p>
          <h2>{title}</h2>
        </div>
        <span className={styles.count}>{list.length} registros</span>
      </header>
      <div className={styles.summary}>
        <div>
          <span>Último precio</span>
          <strong>{formatCurrency(latest?.price, latest?.currency)}</strong>
          <small>{latest?.source || "Sin fuente"}</small>
        </div>
        <div>
          <span>Promedio histórico</span>
          <strong>{formatCurrency(stats?.averagePrice, latest?.currency)}</strong>
          <small>{stats?.total ?? 0} registros analizados</small>
        </div>
      </div>
      {graded ? <GradedHistory list={list} /> : <NormalHistory list={list} />}
    </article>
  );
}

function NormalHistory({ list }) {
  return (
    <div className={styles.history}>
      <h3>Historial reciente</h3>
      {list.length === 0 ? <p className={styles.empty}>No hay precios normales registrados.</p> : (
        <ul>
          {list.slice(0, 5).map((price) => (
            <li key={price.id}>
              <span>{price.condition} · {price.source}</span>
              <strong>{formatCurrency(price.price, price.currency)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GradedHistory({ list }) {
  return (
    <div className={styles.history}>
      <h3>Historial reciente</h3>
      {list.length === 0 ? <p className={styles.empty}>No hay precios graded registrados.</p> : (
        <ul>
          {list.slice(0, 5).map((price) => (
            <li key={price.id}>
              <span>Grado {price.grade} · {price.source}</span>
              <strong>{formatCurrency(price.price, price.currency)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PricePanel;
