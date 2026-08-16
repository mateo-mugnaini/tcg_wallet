import styles from "./TopValuedItems.module.css";

function TopValuedItems({ items, currency, formatCurrency }) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Valoración</p>
          <h2>Cartas de mayor valor</h2>
        </div>
        <span className={styles.currency}>{currency}</span>
      </header>
      {items.length === 0 ? (
        <p className={styles.empty}>Todavía no hay cartas con precio disponible.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Carta</th>
                <th scope="col">Cantidad</th>
                <th scope="col">Precio total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.cardName}</strong>
                    <span>
                      {item.setName} · {item.condition}
                      {item.priceMatch === "fallback" ? " · Estimación base" : ""}
                    </span>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.totalItemValue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export default TopValuedItems;
