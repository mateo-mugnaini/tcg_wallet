import { useContext, useEffect, useState } from "react";
import { ReactReduxContext } from "react-redux";
import { addNotification } from "../../../../redux/slices/notifications.slice.js";
import styles from "./CollectionItemForm.module.css";

function getInitialForm(item) {
  return {
    cardId: item?.card_id || "",
    setId: item?.set_id || item?.set?.id || item?.card?.set_id || "",
    quantity: item?.quantity || 1,
    condition: item?.condition || "Near Mint",
    isGraded: item?.is_graded || false,
    gradingCompanyId: item?.grading_company_id || "",
    grade: item?.grade ?? "",
  };
}

function CollectionItemForm({
  item,
  cards,
  sets,
  companies,
  loading,
  setsLoading = false,
  cardsLoading = false,
  onCancel,
  onCardSearch,
  onSetChange,
  onSubmit,
}) {
  const reduxContext = useContext(ReactReduxContext);
  const dispatch = reduxContext?.store?.dispatch || (() => {});
  const [form, setForm] = useState(() => getInitialForm(item));
  const [cardSearch, setCardSearch] = useState("");
  const setError = (message) => {
    if (!message) return;
    dispatch(addNotification({
      message,
      title: "Revisa el formulario",
      type: "error",
    }));
  };
  const isEditing = Boolean(item);

  useEffect(() => {
    if (isEditing || !form.setId || !onCardSearch) return undefined;

    const normalizedSearch = cardSearch.trim();
    if (normalizedSearch && normalizedSearch.length < 2) return undefined;

    const timeoutId = window.setTimeout(() => {
      onCardSearch(form.setId, normalizedSearch);
    }, normalizedSearch ? 300 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [cardSearch, form.setId, isEditing, onCardSearch]);

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError(null);
  };

  const handleSetChange = (event) => {
    const setId = event.target.value;
    setCardSearch("");
    setForm((current) => ({ ...current, setId, cardId: "" }));
    setError(null);
    onSetChange?.(setId);
  };

  const handleCardSearchChange = (event) => {
    setCardSearch(event.target.value);
    setForm((current) => ({ ...current, cardId: "" }));
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.cardId || !form.condition.trim() || Number(form.quantity) < 1) {
      setError("Completa la carta, cantidad y condición.");
      return;
    }
    if (form.isGraded && (!form.gradingCompanyId || form.grade === "" || Number(form.grade) < 0 || Number(form.grade) > 10)) {
      setError("Una carta gradada requiere empresa y una nota entre 0 y 10.");
      return;
    }

    try {
      await onSubmit({
        cardId: form.cardId,
        quantity: Number(form.quantity),
        condition: form.condition.trim(),
        isGraded: form.isGraded,
        gradingCompanyId: form.isGraded ? form.gradingCompanyId : null,
        grade: form.isGraded ? Number(form.grade) : null,
      });
    } catch {
      // La notificación de error se genera desde Redux.
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <div>
          <p className={styles.eyebrow}>{isEditing ? "Editar" : "Nueva carta"}</p>
          <h2>{isEditing ? "Actualizar item" : "Agregar a tu colección"}</h2>
        </div>
        {onCancel && <button className={styles.close} onClick={onCancel} type="button">Cerrar</button>}
      </div>

      <label>
        Set
        <select disabled={isEditing || setsLoading} onChange={handleSetChange} required value={form.setId}>
          <option value="">{setsLoading ? "Cargando sets..." : "Selecciona primero un set"}</option>
          {sets.map((set) => <option key={set.id} value={set.id}>{set.name}{set.code ? ` · ${set.code}` : ""}</option>)}
        </select>
      </label>
      {!isEditing && form.setId && (
        <label>
          Buscar carta dentro del set
          <input
            onChange={handleCardSearchChange}
            placeholder="Nombre o número de carta"
            type="search"
            value={cardSearch}
          />
          <small className={styles.help}>Escribe al menos 2 caracteres para buscar en todo el set.</small>
        </label>
      )}
      <label>
        Carta
        <select
          disabled={isEditing || !form.setId || cardsLoading}
          onChange={(event) => change("cardId", event.target.value)}
          required
          value={form.cardId}
        >
          <option value="">
            {cardsLoading
              ? "Cargando cartas del set..."
              : form.setId ? "Selecciona una carta" : "Selecciona primero un set"}
          </option>
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.name} · {card.card_number || "Sin número"}
            </option>
          ))}
        </select>
        {form.setId && !cardsLoading && cards.length === 0 && (
          <small className={styles.help}>No hay cartas disponibles para este set.</small>
        )}
      </label>
      <div className={styles.row}>
        <label>
          Cantidad
          <input min="1" onChange={(event) => change("quantity", event.target.value)} required type="number" value={form.quantity} />
        </label>
        <label>
          Condición
          <input maxLength="100" onChange={(event) => change("condition", event.target.value)} required type="text" value={form.condition} />
        </label>
      </div>
      <label className={styles.checkbox}>
        <input checked={form.isGraded} onChange={(event) => change("isGraded", event.target.checked)} type="checkbox" />
        <span>Esta carta está gradada</span>
      </label>
      {form.isGraded && (
        <div className={styles.row}>
          <label>
            Empresa de grading
            <select onChange={(event) => change("gradingCompanyId", event.target.value)} required value={form.gradingCompanyId}>
              <option value="">Selecciona una empresa</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <label>
            Nota
            <input max="10" min="0" onChange={(event) => change("grade", event.target.value)} required step="0.5" type="number" value={form.grade} />
          </label>
        </div>
      )}
      <button className={styles.submit} disabled={loading} type="submit">
        {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar carta"}
      </button>
    </form>
  );
}

export default CollectionItemForm;
