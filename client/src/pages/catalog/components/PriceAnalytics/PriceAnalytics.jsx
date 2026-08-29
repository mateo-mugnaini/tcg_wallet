import styles from "./PriceAnalytics.module.css";
import { getVisiblePriceHistory } from "../../../../lib/prices/price-history.js";

function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined) return "—";
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function PriceAnalytics({ title, variation, aggregations, currency, graded = false }) {
  const visibleHistory = getVisiblePriceHistory(aggregations);
  const maxAverage = Math.max(...visibleHistory.data.map((item) => item.averagePrice || 0), 1);
  const directionClass = variation?.direction === "up" ? styles.up : variation?.direction === "down" ? styles.down : styles.unchanged;

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Análisis</p><h2>{title}</h2></div>
        <span className={styles.badge}>{graded ? "Graded" : "Normal"}</span>
      </header>
      {variation ? (
        <div className={styles.variation}>
          <div><span>Variación</span><strong className={directionClass}>{variation.percentageVariation === null ? "Sin %" : `${variation.percentageVariation.toFixed(2)}%`}</strong></div>
          <div><span>Absoluta</span><strong>{formatCurrency(variation.absoluteVariation, variation.currency || currency)}</strong></div>
          <div><span>Dirección</span><strong className={directionClass}>{variation.direction}</strong></div>
        </div>
      ) : <p className={styles.empty}>No hay suficientes registros para calcular variación.</p>}
      <div className={styles.chart}>
        <div className={styles.chartHeader}><h3>Promedio por período</h3><span>{visibleHistory.data.length} puntos</span></div>
        {visibleHistory.isFallback && <p className={styles.empty}>Sin datos del último año; se muestra el último registro disponible.</p>}
        {visibleHistory.data.length ? visibleHistory.data.map((item) => (
          <div className={styles.barRow} key={item.period}>
            <span>{item.period}</span>
            <div className={styles.barTrack}><div className={styles.bar} style={{ width: `${Math.max((item.averagePrice || 0) / maxAverage * 100, 3)}%` }} /></div>
            <strong>{formatCurrency(item.averagePrice, currency)}</strong>
          </div>
        )) : <p className={styles.empty}>No hay agregaciones disponibles.</p>}
      </div>
    </article>
  );
}

export default PriceAnalytics;
