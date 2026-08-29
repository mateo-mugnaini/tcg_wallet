import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./PriceHistoryChart.module.css";

function formatCurrency(value, currency) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function PriceHistoryChart({ currency = "USD", data, isFallback = false }) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Mercado · últimos 12 meses</p>
          <h2>Variación del precio</h2>
        </div>
        <span className={styles.legendHint}>Mínimo · Media · Máximo</span>
      </header>

      {isFallback && <p className={styles.empty}>No hay datos del último año; se muestra el último registro disponible.</p>}
      {data.length === 0 ? (
        <p className={styles.empty}>No hay histórico suficiente para mostrar un gráfico.</p>
      ) : (
        <div className={styles.chart}>
          <ResponsiveContainer height={310} width="100%">
            <LineChart data={data} margin={{ top: 12, right: 14, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="rgba(24, 36, 51, 0.12)" strokeDasharray="4 4" />
              <XAxis axisLine={false} dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <YAxis axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => formatCurrency(value, currency)} tickLine={false} width={72} />
              <Tooltip
                contentStyle={{ background: "#fffaf0", border: "2px solid #182433", borderRadius: 4, boxShadow: "4px 4px 0 rgba(24, 36, 51, 0.14)" }}
                formatter={(value, name) => [formatCurrency(value, currency), name]}
                labelStyle={{ color: "#182433", fontWeight: 700 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line connectNulls dataKey="minimumPrice" dot={false} name="Mínimo" stroke="#1769aa" strokeWidth={2} type="monotone" />
              <Line connectNulls dataKey="averagePrice" dot={{ fill: "#f4c542", r: 3, stroke: "#182433", strokeWidth: 1 }} name="Media" stroke="#d4a817" strokeWidth={3} type="monotone" />
              <Line connectNulls dataKey="maximumPrice" dot={false} name="Máximo" stroke="#df3f36" strokeDasharray="5 4" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

export default PriceHistoryChart;
