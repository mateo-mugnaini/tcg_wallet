import styles from "./PricePanel.module.css";
import { getConditionLabel } from "../../../../app/config/card-conditions.js";

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

function PricePanel({ companies = [], title, latest, stats, list, graded = false, selectedCompanyId = "" }) {
  const getCompanyName = (companyId) => companies.find((company) => company.id === companyId)?.name || "Empresa no disponible";
  const selectedCompanyName = selectedCompanyId ? getCompanyName(selectedCompanyId) : "Todas las empresas";

  return (
    <article className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{graded ? `Graded · ${selectedCompanyName}` : "Normal"}</p>
          <h2>{title}</h2>
        </div>
        <span className={styles.count}>{list.length} registros</span>
      </header>
      <div className={styles.summary}>
        <div>
          <span>Último precio</span>
          <strong>{formatCurrency(latest?.price, latest?.currency)}</strong>
          <small>{graded && latest?.grading_company_id ? `${getCompanyName(latest.grading_company_id)} · ` : ""}{latest?.source || "Sin fuente"}</small>
        </div>
        <div>
          <span>Promedio histórico</span>
          <strong>{formatCurrency(stats?.averagePrice, latest?.currency)}</strong>
          <small>{stats?.total ?? 0} registros analizados</small>
        </div>
      </div>
      {graded ? <GradedHistory getCompanyName={getCompanyName} list={list} /> : <NormalHistory list={list} />}
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
              <span>{getConditionLabel(price.condition)} · {price.source}</span>
              <strong>{formatCurrency(price.price, price.currency)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GradedHistory({ getCompanyName, list }) {
  return (
    <div className={styles.history}>
      <h3>Historial reciente</h3>
      {list.length === 0 ? <p className={styles.empty}>No hay precios graded para los filtros seleccionados.</p> : (
        <ul>
          {list.slice(0, 5).map((price) => (
            <li key={price.id}>
              <span>{getCompanyName(price.grading_company_id)} · Grado {price.grade} · {price.source}</span>
              <strong>{formatCurrency(price.price, price.currency)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PricePanel;
