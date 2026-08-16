import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import { getCollectionStats, getCollectionValue } from "../../redux/actions/collection/get/collection.actions.js";
import { debugLog } from "../../lib/debug/logger.js";
import BreakdownCard from "./components/BreakdownCard/BreakdownCard.jsx";
import MetricCard from "./components/MetricCard/MetricCard.jsx";
import TopValuedItems from "./components/TopValuedItems/TopValuedItems.jsx";
import styles from "./DashboardPage.module.css";

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

function formatValueCaption(summary) {
  const missing = summary?.itemsMissingPriceCount ?? 0;
  const fallback = summary?.itemsUsingFallbackPriceCount ?? 0;

  return fallback > 0
    ? `${missing} sin precio · ${fallback} estimados con precio base`
    : `${missing} items sin precio disponible`;
}

function DashboardPage() {
  const dispatch = useDispatch();
  const {
    stats,
    value,
    statsStatus,
    statsError,
    valueStatus,
    valueError,
  } = useSelector((state) => state.collection);
  const summary = stats?.summary;
  const valueSummary = value?.summary;
  const isLoading = statsStatus === "loading" || valueStatus === "loading";
  const hasCollection = (summary?.totalQuantity || 0) > 0;

  useEffect(() => {
    dispatch(getCollectionStats());
    dispatch(getCollectionValue());
  }, [dispatch]);

  useEffect(() => {
    debugLog("dashboard_collection_value_state", {
      status: valueStatus,
      summary: valueSummary,
      error: valueError
        ? {
          message: valueError.message,
          code: valueError.code,
          status: valueError.status,
        }
        : null,
    });
  }, [valueError, valueStatus, valueSummary]);

  const refreshDashboard = () => {
    dispatch(getCollectionStats());
    dispatch(getCollectionValue());
  };

  return (
    <section className={styles.page}>
      <PageHeader
        description="Una vista rápida de tus cartas, distribución y valor estimado."
        eyebrow="Resumen"
        title="Tu dashboard"
      >
        <button className={styles.refreshButton} disabled={isLoading} onClick={refreshDashboard} type="button">
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </PageHeader>

      {(statsError || valueError) && (
        <div className={styles.error} role="alert">
          <span>{statsError?.message || valueError?.message || "No se pudo cargar el resumen."}</span>
          <button onClick={refreshDashboard} type="button">Reintentar</button>
        </div>
      )}

      <div className={styles.metrics}>
        <MetricCard
          caption="Cartas distintas registradas"
          label="Cartas"
          value={summary?.totalDistinctCards ?? "—"}
        />
        <MetricCard
          caption={`${summary?.gradedQuantity ?? 0} unidades gradadas`}
          label="Unidades"
          value={summary?.totalQuantity ?? "—"}
        />
        <MetricCard
          accent
          caption={formatValueCaption(valueSummary)}
          label="Valor estimado"
          value={formatCurrency(valueSummary?.totalEstimatedValue, valueSummary?.currency)}
        />
      </div>

      {!isLoading && !hasCollection && !statsError && (
        <article className={styles.emptyState}>
          <p className={styles.eyebrow}>Colección vacía</p>
          <h2>Tu colección empieza aquí</h2>
          <p>Cuando agregues cartas, este dashboard mostrará su distribución y valoración.</p>
        </article>
      )}

      {(hasCollection || isLoading) && (
        <>
          <div className={styles.breakdowns}>
            <BreakdownCard
              emptyLabel="Sin condiciones registradas."
              formatValue={(item) => `${item.distinctCards} distintas`}
              items={stats?.byCondition || []}
              nameKey="condition"
              title="Por condición"
            />
            <BreakdownCard
              emptyLabel="Sin sets registrados."
              formatValue={(item) => `${item.distinctCards} distintas`}
              items={stats?.bySet || []}
              nameKey="setName"
              title="Por set"
            />
            <BreakdownCard
              emptyLabel="Sin TCGs registrados."
              formatValue={(item) => `${item.distinctCards} distintas`}
              items={stats?.byTcg || []}
              nameKey="tcgName"
              title="Por TCG"
            />
            <BreakdownCard
              emptyLabel="Sin cartas gradadas."
              formatValue={(item) => `${item.distinctCards} distintas`}
              items={stats?.byGradingCompany || []}
              nameKey="gradingCompanyName"
              title="Por grading"
            />
          </div>

          <TopValuedItems
            currency={valueSummary?.currency || "USD"}
            formatCurrency={formatCurrency}
            items={value?.topValuedItems || []}
          />
        </>
      )}
    </section>
  );
}

export default DashboardPage;
