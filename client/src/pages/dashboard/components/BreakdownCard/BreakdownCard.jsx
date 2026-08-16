import styles from "./BreakdownCard.module.css";

function BreakdownCard({ title, items, nameKey, emptyLabel, formatValue }) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2>{title}</h2>
        <span>{items.length}</span>
      </header>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyLabel}</p>
      ) : (
        <ul className={styles.list}>
          {items.slice(0, 5).map((item, index) => (
            <li className={styles.item} key={item.id || item[nameKey] || index}>
              <span className={styles.name}>{item[nameKey]}</span>
              <span className={styles.quantity}>
                {item.totalQuantity} {formatValue(item)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default BreakdownCard;
