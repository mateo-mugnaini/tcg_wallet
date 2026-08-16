import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import { getCardById } from "../../redux/actions/catalog/get/catalog.actions.js";
import { getGradingCompanies } from "../../redux/actions/grading/get/grading.actions.js";
import {
  getGradedPriceAggregations,
  getGradedPriceStats,
  getGradedPriceVariation,
  getGradedPrices,
  getLatestGradedPrice,
  getLatestPrice,
  getPriceAggregations,
  getPriceStats,
  getPriceVariation,
  getPrices,
} from "../../redux/actions/prices/get/prices.actions.js";
import PriceAnalytics from "./components/PriceAnalytics/PriceAnalytics.jsx";
import PricePanel from "./components/PricePanel/PricePanel.jsx";
import styles from "./CardPricesPage.module.css";

const initialNormalQuery = { source: "", condition: "", period: "day" };
const initialGradedQuery = { gradingCompanyId: "", grade: "", period: "day" };

function CardPricesPage() {
  const { cardId } = useParams();
  const dispatch = useDispatch();
  const card = useSelector((state) => state.catalog.selectedCard);
  const companies = useSelector((state) => state.grading.companies);
  const { normal, graded, status } = useSelector((state) => state.prices);
  const [normalQuery, setNormalQuery] = useState(initialNormalQuery);
  const [gradedQuery, setGradedQuery] = useState(initialGradedQuery);
  const [normalDraft, setNormalDraft] = useState(initialNormalQuery);
  const [gradedDraft, setGradedDraft] = useState(initialGradedQuery);

  useEffect(() => {
    dispatch(getCardById(cardId));
    dispatch(getGradingCompanies());
  }, [cardId, dispatch]);

  useEffect(() => {
    const { period: normalPeriod, ...normalFilters } = normalQuery;
    const { period: gradedPeriod, ...gradedFilters } = gradedQuery;
    dispatch(getPrices({ cardId, query: normalFilters }));
    dispatch(getLatestPrice({ cardId, query: normalFilters }));
    dispatch(getPriceStats({ cardId, query: normalFilters }));
    dispatch(getPriceVariation({ cardId, query: normalFilters }));
    dispatch(getPriceAggregations({ cardId, query: { ...normalFilters, period: normalPeriod } }));
    dispatch(getGradedPrices({ cardId, query: gradedFilters }));
    dispatch(getLatestGradedPrice({ cardId, query: gradedFilters }));
    dispatch(getGradedPriceStats({ cardId, query: gradedFilters }));
    dispatch(getGradedPriceVariation({ cardId, query: gradedFilters }));
    dispatch(getGradedPriceAggregations({ cardId, query: { ...gradedFilters, period: gradedPeriod } }));
  }, [cardId, dispatch, gradedQuery, normalQuery]);

  const isLoading = status === "loading" && !normal.list.length && !graded.list.length;

  return (
    <section className={styles.page}>
      <PageHeader
        description={card ? `Historial y evolución de precios para ${card.name}.` : "Historial y evolución de precios."}
        eyebrow="Precios"
        title={card?.name || "Precios de la carta"}
      >
        <Link className={styles.back} to={`/catalog/cards/${cardId}`}>Volver a carta</Link>
      </PageHeader>

      <section className={styles.filtersCard}>
        <div><p className={styles.eyebrow}>Filtros</p><h2>Analizar un segmento</h2></div>
        <div className={styles.filterColumns}>
          <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setNormalQuery(normalDraft); }}>
            <h3>Precio normal</h3>
            <label>Fuente<input maxLength="100" onChange={(event) => setNormalDraft((current) => ({ ...current, source: event.target.value }))} placeholder="TCGPlayer..." value={normalDraft.source} /></label>
            <label>Condición<input maxLength="100" onChange={(event) => setNormalDraft((current) => ({ ...current, condition: event.target.value }))} placeholder="Near Mint..." value={normalDraft.condition} /></label>
            <PeriodSelect value={normalDraft.period} onChange={(event) => setNormalDraft((current) => ({ ...current, period: event.target.value }))} />
            <button type="submit">Aplicar</button>
          </form>
          <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setGradedQuery(gradedDraft); }}>
            <h3>Precio graded</h3>
            <label>Empresa<select onChange={(event) => setGradedDraft((current) => ({ ...current, gradingCompanyId: event.target.value }))} value={gradedDraft.gradingCompanyId}><option value="">Todas</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
            <label>Nota<input max="10" min="0" onChange={(event) => setGradedDraft((current) => ({ ...current, grade: event.target.value }))} placeholder="Ej. 9" step="0.5" type="number" value={gradedDraft.grade} /></label>
            <PeriodSelect value={gradedDraft.period} onChange={(event) => setGradedDraft((current) => ({ ...current, period: event.target.value }))} />
            <button type="submit">Aplicar</button>
          </form>
        </div>
      </section>

      {isLoading && <p className={styles.loading}>Cargando precios...</p>}

      <div className={styles.panels}>
        <PricePanel latest={normal.latest} list={normal.list} stats={normal.stats} title="Precio normal" />
        <PricePanel graded latest={graded.latest} list={graded.list} stats={graded.stats} title="Precio graded" />
      </div>
      <div className={styles.panels}>
        <PriceAnalytics aggregations={normal.aggregations} currency={normal.latest?.currency || "USD"} title="Evolución normal" variation={normal.variation} />
        <PriceAnalytics aggregations={graded.aggregations} currency={graded.latest?.currency || "USD"} graded title="Evolución graded" variation={graded.variation} />
      </div>
    </section>
  );
}

function PeriodSelect({ value, onChange }) {
  return <label>Período<select onChange={onChange} value={value}><option value="day">Diario</option><option value="week">Semanal</option><option value="month">Mensual</option></select></label>;
}

export default CardPricesPage;
