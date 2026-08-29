import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import { POKEMON_TCG_ID } from "../../app/config/catalog.js";
import { getAllSets } from "../../redux/actions/catalog/get/catalog.actions.js";
import {
  getOpeningStatus,
  getSetPokedex,
  openPacks,
} from "../../redux/actions/openings/openings.actions.js";
import styles from "./OpeningPage.module.css";

function formatRemaining(nextOpenAt, now) {
  if (!nextOpenAt || !now) return null;
  const remaining = Math.max(0, new Date(nextOpenAt).getTime() - now);
  if (remaining === 0) return null;
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.ceil((remaining % 60_000) / 1_000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function OpeningPage() {
  const dispatch = useDispatch();
  const catalog = useSelector((state) => state.catalog);
  const openings = useSelector((state) => state.openings);
  const [setId, setSetId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showMissing, setShowMissing] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    dispatch(getAllSets({
      query: { tcgId: POKEMON_TCG_ID, sortBy: "release_date", sortOrder: "DESC" },
    }));
    dispatch(getOpeningStatus());
  }, [dispatch]);

  useEffect(() => {
    if (!setId) return undefined;
    const request = dispatch(getSetPokedex({ setId }));
    return () => request.abort();
  }, [dispatch, setId]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timerId);
  }, []);

  const remaining = formatRemaining(openings.openingStatus.next_open_at, now);
  const canOpen = openings.openingStatus.can_open && !remaining;
  const pokedexCards = useMemo(() => {
    const cards = openings.pokedex?.data || [];
    return showMissing ? cards.filter((card) => !card.owned) : cards;
  }, [openings.pokedex, showMissing]);

  const handleSetChange = (event) => {
    setSetId(event.target.value);
    setShowMissing(false);
  };

  const handleOpen = async () => {
    if (!setId || !canOpen || openings.status === "loading") return;
    await dispatch(openPacks({ setId, quantity })).unwrap();
    dispatch(getSetPokedex({ setId }));
    dispatch(getOpeningStatus());
  };

  return (
    <section className={styles.page}>
      <PageHeader
        description="Elige un set y descubre cinco cartas por sobre."
        eyebrow="Simulador Pokémon"
        title="Abre sobres"
      />

      <section className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="opening-set">Set</label>
          <select id="opening-set" onChange={handleSetChange} value={setId}>
            <option value="">Selecciona un set</option>
            {catalog.sets.map((set) => (
              <option key={set.id} value={set.id}>{set.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="opening-quantity">Sobres</label>
          <select
            id="opening-quantity"
            onChange={(event) => setQuantity(Number(event.target.value))}
            value={quantity}
          >
            {Array.from({ length: 10 }, (_, index) => index + 1).map((amount) => (
              <option key={amount} value={amount}>{amount} {amount === 1 ? "sobre" : "sobres"}</option>
            ))}
          </select>
        </div>
        <button
          className={styles.openButton}
          disabled={!setId || !canOpen || openings.status === "loading"}
          onClick={handleOpen}
          type="button"
        >
          {openings.status === "loading" ? "Abriendo..." : remaining ? `Disponible en ${remaining}` : "Abrir sobres"}
        </button>
        <p className={styles.helper}>{quantity * 5} cartas en esta apertura</p>
      </section>

      {openings.error && <p className={styles.error}>{openings.error.message}</p>}

      {openings.opening && (
        <section className={styles.results}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Apertura completada</p>
              <h2>{openings.opening.total_cards} cartas obtenidas</h2>
            </div>
            <span>{openings.opening.pack_quantity} {openings.opening.pack_quantity === 1 ? "sobre" : "sobres"}</span>
          </header>
          <div className={styles.cardGrid}>
            {openings.opening.cards.map((result) => (
              <CardTile card={result.card} key={result.id} rarity={result.rarity_key} />
            ))}
          </div>
        </section>
      )}

      {setId && (
        <section className={styles.pokedex}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Pokedex del set</p>
              <h2>{openings.pokedex?.set?.name || "Cargando set..."}</h2>
            </div>
            {openings.pokedex && (
              <strong>{openings.pokedex.summary.owned_cards}/{openings.pokedex.summary.total_cards}</strong>
            )}
          </header>
          {openings.pokedex && (
            <>
              <div className={styles.progressTrack}>
                <span style={{ width: `${openings.pokedex.summary.completion_percentage}%` }} />
              </div>
              <div className={styles.pokedexToolbar}>
                <span>{openings.pokedex.summary.completion_percentage}% completado</span>
                <button onClick={() => setShowMissing((current) => !current)} type="button">
                  {showMissing ? "Ver todas" : "Ver faltantes"}
                </button>
              </div>
              <div className={styles.cardGrid}>
                {pokedexCards.map((card) => <CardTile card={card} key={card.id} owned={card.owned} quantity={card.owned_quantity} />)}
              </div>
              {pokedexCards.length === 0 && <p className={styles.empty}>Ya tienes todas las cartas de este set.</p>}
            </>
          )}
        </section>
      )}
    </section>
  );
}

function CardTile({ card, rarity, owned, quantity }) {
  return (
    <article className={`${styles.card} ${owned === false ? styles.missing : ""}`}>
      {card.image_url ? <img alt={card.name} loading="lazy" src={card.image_url} /> : <div className={styles.placeholder}>TCG</div>}
      <div className={styles.cardInfo}>
        <strong>{card.name}</strong>
        <small>{card.card_number || "Sin número"} · {rarity || card.rarity || "Común"}</small>
        {quantity > 0 && <span className={styles.quantity}>x{quantity}</span>}
      </div>
    </article>
  );
}

export default OpeningPage;
