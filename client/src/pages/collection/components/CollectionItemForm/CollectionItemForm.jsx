import { useState } from "react";
import styles from "./CollectionItemForm.module.css";

function getInitialForm(item) {
  return {
    cardId: item?.card_id || "",
    quantity: item?.quantity || 1,
    condition: item?.condition || "Near Mint",
    isGraded: item?.is_graded || false,
    gradingCompanyId: item?.grading_company_id || "",
    grade: item?.grade ?? "",
  };
}

function CollectionItemForm({ item, cards, companies, loading, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => getInitialForm(item));
  const [error, setError] = useState(null);
  const isEditing = Boolean(item);

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
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
      // The parent displays the serialized API error.
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
        Carta
        <select disabled={isEditing} onChange={(event) => change("cardId", event.target.value)} required value={form.cardId}>
          <option value="">Selecciona una carta</option>
          {cards.map((card) => <option key={card.id} value={card.id}>{card.name} · {card.card_number || "Sin número"}</option>)}
        </select>
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
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.submit} disabled={loading} type="submit">
        {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar carta"}
      </button>
    </form>
  );
}

export default CollectionItemForm;
