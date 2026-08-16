import styles from "./ValuationBreakdown.module.css";

function ValuationBreakdown({ title, items, nameKey, formatCurrency }) {
  return (
    <article className={styles.card}>
      <header><h2>{title}</h2><span>{items.length}</span></header>
      {items.length === 0 ? <p className={styles.empty}>Sin datos de valoración.</p> : (
        <ul>
          {items.slice(0, 5).map((item, index) => (
            <li key={item.id || item[nameKey] || index}>
              <span><strong>{item[nameKey]}</strong><small>{item.totalQuantity} unidades</small></span>
              <b>{formatCurrency(item.estimatedValue)}</b>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default ValuationBreakdown;
