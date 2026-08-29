import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import { getGradingCompanies } from "../../redux/actions/grading/get/grading.actions.js";
import { getCollectionItemById } from "../../redux/actions/collection/get/collection.actions.js";
import { deleteCollectionItem } from "../../redux/actions/collection/delete/collection.actions.js";
import { updateCollectionItem } from "../../redux/actions/collection/put/collection.actions.js";
import {
  getGradedPriceAggregations,
  getLatestGradedPrice,
  getLatestPrice,
  getPriceAggregations,
} from "../../redux/actions/prices/get/prices.actions.js";
import { clearPrices } from "../../redux/slices/prices.slice.js";
import { getConditionLabel } from "../../app/config/card-conditions.js";
import {
  getAllPriceHistory,
  getVisiblePriceHistory,
} from "../../lib/prices/price-history.js";
import CollectionItemForm from "./components/CollectionItemForm/CollectionItemForm.jsx";
import PriceHistoryChart from "./components/PriceHistoryChart/PriceHistoryChart.jsx";
import styles from "./CollectionDetailPage.module.css";

function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Sin precio";

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function summarizeHistory(history, allHistory, latest) {
  const valid = history.filter(
    (item) => Number.isFinite(Number(item.averagePrice)) && Number.isFinite(Number(item.total)),
  );

  const sampleCount = valid.reduce((total, item) => total + Number(item.total), 0);
  const weightedAverage = sampleCount
    ? valid.reduce((total, item) => total + Number(item.averagePrice) * Number(item.total), 0) / sampleCount
    : null;
  const maximum = allHistory.reduce(
    (current, item) => Math.max(current, Number(item.maximumPrice)),
    0,
  );
  const lastPoint = history.at(-1);

  return {
    average: weightedAverage,
    current: latest?.price ?? lastPoint?.averagePrice ?? null,
    maximum: allHistory.length ? maximum : null,
  };
}

function CollectionDetailPage() {
  const { itemId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    selectedItem,
    status,
    mutationStatus,
  } = useSelector((state) => state.collection);
  const companies = useSelector((state) => state.grading.companies);
  const prices = useSelector((state) => state.prices);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    dispatch(getCollectionItemById(itemId));
    dispatch(getGradingCompanies());
    dispatch(clearPrices());
  }, [dispatch, itemId]);

  useEffect(() => {
    if (!selectedItem || selectedItem.id !== itemId) return;

    if (selectedItem.is_graded) {
      const query = {
        gradingCompanyId: selectedItem.grading_company_id,
        grade: selectedItem.grade,
        period: "month",
      };
      dispatch(getGradedPriceAggregations({ cardId: selectedItem.card_id, query }));
      dispatch(getLatestGradedPrice({
        cardId: selectedItem.card_id,
        query: {
          gradingCompanyId: selectedItem.grading_company_id,
          grade: selectedItem.grade,
        },
      }));
      return;
    }

    dispatch(getPriceAggregations({ cardId: selectedItem.card_id, query: { period: "month" } }));
    dispatch(getLatestPrice({ cardId: selectedItem.card_id, query: {} }));
  }, [dispatch, itemId, selectedItem, selectedItem?.card_id, selectedItem?.grade, selectedItem?.grading_company_id, selectedItem?.id, selectedItem?.is_graded]);

  const handleUpdate = async (data) => {
    await dispatch(updateCollectionItem({ id: itemId, data })).unwrap();
    await dispatch(getCollectionItemById(itemId));
    setEditing(false);
  };

  const handleQuantityChange = async (delta) => {
    const nextQuantity = selectedItem.quantity + delta;
    if (nextQuantity < 1) return;

    await dispatch(updateCollectionItem({
      id: itemId,
      data: { quantity: nextQuantity },
    })).unwrap();
    await dispatch(getCollectionItemById(itemId));
  };

  const handleDelete = async () => {
    if (selectedItem.quantity !== 1) return;
    if (!window.confirm("¿Quieres eliminar esta carta de tu colección?")) return;

    await dispatch(deleteCollectionItem(itemId)).unwrap();
    navigate("/collection", { replace: true });
  };

  if (status === "loading" || !selectedItem || selectedItem.id !== itemId) {
    return (
      <section className={styles.page}>
        <PageHeader eyebrow="Colección / detalle" title="Cargando item..." />
        <p className={styles.loading}>Consultando tu colección...</p>
      </section>
    );
  }

  const priceResource = selectedItem.is_graded ? prices.graded : prices.normal;
  const visibleHistory = getVisiblePriceHistory(priceResource.aggregations);
  const allHistory = getAllPriceHistory(priceResource.aggregations);
  const priceSummary = summarizeHistory(visibleHistory.data, allHistory, priceResource.latest);
  const currency = priceResource.latest?.currency || "USD";
  const totalValue = priceSummary.current === null
    ? null
    : Number(priceSummary.current) * selectedItem.quantity;
  const isBusy = mutationStatus === "loading";

  return (
    <section className={styles.page}>
      <PageHeader
        description={`${selectedItem.card?.name || "Carta"} · ${selectedItem.set?.name || "Set"}`}
        eyebrow="Colección / detalle"
        title={selectedItem.card?.name || "Carta"}
      >
        <Link className={styles.back} to="/collection">Volver</Link>
        {!editing && <button className={styles.edit} onClick={() => setEditing(true)} type="button">Editar datos</button>}
      </PageHeader>

      {editing ? (
        <CollectionItemForm
          cards={selectedItem.card ? [selectedItem.card] : []}
          sets={selectedItem.set ? [selectedItem.set] : []}
          companies={companies}
          item={selectedItem}
          loading={isBusy}
          onCancel={() => setEditing(false)}
          onSubmit={handleUpdate}
        />
      ) : (
        <>
          <article className={styles.cardHero}>
            <div className={styles.imageWrapper}>
              {selectedItem.card?.image_url ? (
                <img
                  alt={`Imagen de ${selectedItem.card.name}`}
                  className={styles.image}
                  decoding="async"
                  fetchPriority="high"
                  src={selectedItem.card.image_url}
                />
              ) : <div className={styles.placeholder}>TCG</div>}
            </div>
            <div className={styles.content}>
              <div>
                <p className={styles.eyebrow}>{selectedItem.tcg?.name} / {selectedItem.set?.name}</p>
                <h2>{selectedItem.card?.name || "Carta"}</h2>
                <p className={styles.cardMeta}>
                  {selectedItem.card?.card_number || "Sin número"}
                  {selectedItem.card?.rarity ? ` · ${selectedItem.card.rarity}` : ""}
                </p>
              </div>

              <div className={styles.quantityPanel}>
                <div>
                  <span className={styles.panelLabel}>En tu colección</span>
                  <strong>{selectedItem.quantity} {selectedItem.quantity === 1 ? "unidad" : "unidades"}</strong>
                </div>
                <div className={styles.quantityControls}>
                  <button aria-label="Restar una unidad" disabled={isBusy || selectedItem.quantity === 1} onClick={() => handleQuantityChange(-1)} type="button">−</button>
                  <span aria-live="polite">{selectedItem.quantity}</span>
                  <button aria-label="Sumar una unidad" disabled={isBusy} onClick={() => handleQuantityChange(1)} type="button">+</button>
                </div>
                {selectedItem.quantity === 1 && (
                  <button className={styles.delete} disabled={isBusy} onClick={handleDelete} type="button">
                    Eliminar carta
                  </button>
                )}
              </div>

              <dl className={styles.details}>
                <div><dt>Condición</dt><dd>{getConditionLabel(selectedItem.condition)}</dd></div>
                <div><dt>Estado</dt><dd>{selectedItem.is_graded ? selectedItem.grading_company?.name || "Gradada" : "Sin grading"}</dd></div>
                <div><dt>Nota</dt><dd>{selectedItem.is_graded ? selectedItem.grade : "—"}</dd></div>
                <div><dt>La tienes desde</dt><dd>{formatDate(selectedItem.created_at)}</dd></div>
              </dl>
            </div>
          </article>

          <div className={styles.stats}>
            <Stat label="Valor actual" value={formatCurrency(priceSummary.current, currency)} caption="Por unidad" />
            <Stat label="Máximo alcanzado" value={formatCurrency(priceSummary.maximum, currency)} caption="Todo el histórico" />
            <Stat label="Media de precio" value={formatCurrency(priceSummary.average, currency)} caption="Promedio ponderado" />
            <Stat label="Valor de tus unidades" value={formatCurrency(totalValue, currency)} caption={`${selectedItem.quantity} ${selectedItem.quantity === 1 ? "unidad" : "unidades"}`} accent />
          </div>

          {selectedItem.is_graded && (
            <aside className={styles.priceMetadata}>
              <div>
                <span>Mercado seleccionado</span>
                <strong>{selectedItem.grading_company?.name || "Graded"} · Grado {selectedItem.grade}</strong>
              </div>
              <div>
                <span>Fuente del precio</span>
                <strong>{priceResource.latest?.source || "Precio exacto no disponible"}</strong>
              </div>
              <div>
                <span>Último dato</span>
                <strong>{formatDate(priceResource.latest?.recorded_at)}</strong>
              </div>
              {!priceResource.latest && (
                <p>Esta carta solo se valorará cuando exista un precio para la empresa y el grado exactos.</p>
              )}
            </aside>
          )}

          <PriceHistoryChart currency={currency} data={visibleHistory.data} isFallback={visibleHistory.isFallback} />
        </>
      )}
    </section>
  );
}

function Stat({ accent = false, caption, label, value }) {
  return (
    <article className={`${styles.stat} ${accent ? styles.statAccent : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  );
}

export default CollectionDetailPage;
