import styles from "./CardSummary.module.css";

function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined) return "Sin precio";

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

function CardSummary({ card }) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {card.image_url ? (
          <img
            alt={`Imagen de ${card.name}`}
            className={styles.image}
            decoding="async"
            fetchPriority="high"
            src={card.image_url}
          />
        ) : (
          <div className={styles.placeholder}>TCG</div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{card.tcg?.name || "TCG"} / {card.set?.name || "Set"}</p>
            <h2>{card.name}</h2>
          </div>
          {card.rarity && <span className={styles.badge}>{card.rarity}</span>}
        </div>
        <dl className={styles.details}>
          <div><dt>Número</dt><dd>{card.card_number || "—"}</dd></div>
          <div><dt>External ID</dt><dd>{card.external_id || "—"}</dd></div>
          <div><dt>Colección</dt><dd>{card.collection?.total_quantity ?? 0} unidades</dd></div>
          <div><dt>Gradadas</dt><dd>{card.collection?.graded_quantity ?? 0} unidades</dd></div>
        </dl>
        <div className={styles.latest}>
          <h3>Últimos precios normales</h3>
          {card.latest_prices?.length ? (
            <ul>
              {card.latest_prices.map((price) => (
                <li key={price.id}>
                  <span>{price.condition} · {price.source}</span>
                  <strong>{formatCurrency(price.price, price.currency)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay precios normales registrados.</p>
          )}
        </div>
      </div>
    </article>
  );
}

export default CardSummary;
