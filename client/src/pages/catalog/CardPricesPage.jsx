import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import { getCardById } from "../../redux/actions/catalog/get/catalog.actions.js";
import {
  getGradedPriceStats,
  getGradedPrices,
  getLatestGradedPrice,
  getLatestPrice,
  getPriceStats,
  getPrices,
} from "../../redux/actions/prices/get/prices.actions.js";
import PricePanel from "./components/PricePanel/PricePanel.jsx";
import styles from "./CardPricesPage.module.css";

function CardPricesPage() {
  const { cardId } = useParams();
  const dispatch = useDispatch();
  const card = useSelector((state) => state.catalog.selectedCard);
  const { normal, graded, status, error } = useSelector((state) => state.prices);

  useEffect(() => {
    dispatch(getCardById(cardId));
    dispatch(getPrices({ cardId }));
    dispatch(getLatestPrice({ cardId }));
    dispatch(getPriceStats({ cardId }));
    dispatch(getGradedPrices({ cardId }));
    dispatch(getLatestGradedPrice({ cardId }));
    dispatch(getGradedPriceStats({ cardId }));
  }, [cardId, dispatch]);

  const isLoading = status === "loading" && !normal.list.length && !graded.list.length;

  return (
    <section className={styles.page}>
      <PageHeader
        description={card ? `Historial de precios para ${card.name}.` : "Historial de precios normales y graded."}
        eyebrow="Precios"
        title={card?.name || "Precios de la carta"}
      >
        <Link className={styles.back} to={`/catalog/cards/${cardId}`}>Volver a carta</Link>
      </PageHeader>

      {error && <p className={styles.error} role="alert">{error.message}</p>}
      {isLoading && <p className={styles.loading}>Cargando precios...</p>}

      <div className={styles.panels}>
        <PricePanel
          latest={normal.latest}
          list={normal.list}
          stats={normal.stats}
          title="Precio normal"
        />
        <PricePanel
          graded
          latest={graded.latest}
          list={graded.list}
          stats={graded.stats}
          title="Precio graded"
        />
      </div>
    </section>
  );
}

export default CardPricesPage;
