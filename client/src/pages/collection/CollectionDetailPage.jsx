import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import { getGradingCompanies } from "../../redux/actions/grading/get/grading.actions.js";
import { getCollectionItemById } from "../../redux/actions/collection/get/collection.actions.js";
import { deleteCollectionItem } from "../../redux/actions/collection/delete/collection.actions.js";
import { updateCollectionItem } from "../../redux/actions/collection/put/collection.actions.js";
import CollectionItemForm from "./components/CollectionItemForm/CollectionItemForm.jsx";
import styles from "./CollectionDetailPage.module.css";

function CollectionDetailPage() {
  const { itemId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, status, error, mutationStatus, mutationError } = useSelector((state) => state.collection);
  const companies = useSelector((state) => state.grading.companies);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    dispatch(getCollectionItemById(itemId));
    dispatch(getGradingCompanies());
  }, [dispatch, itemId]);

  const handleUpdate = async (data) => {
    await dispatch(updateCollectionItem({ id: itemId, data })).unwrap();
    await dispatch(getCollectionItemById(itemId));
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Quieres eliminar esta carta de tu colección?")) return;
    await dispatch(deleteCollectionItem(itemId)).unwrap();
    navigate("/collection", { replace: true });
  };

  if (status === "loading" || !selectedItem) {
    return <section className={styles.page}><PageHeader eyebrow="Colección / detalle" title="Cargando item..." /><p className={styles.loading}>Consultando tu colección...</p></section>;
  }

  return (
    <section className={styles.page}>
      <PageHeader
        description={`${selectedItem.card?.name || "Carta"} · ${selectedItem.set?.name || "Set"}`}
        eyebrow="Colección / detalle"
        title="Item de colección"
      >
        <Link className={styles.back} to="/collection">Volver</Link>
        {!editing && <button className={styles.edit} onClick={() => setEditing(true)} type="button">Editar</button>}
      </PageHeader>

      {error && <p className={styles.error} role="alert">{error.message}</p>}
      {mutationError && <p className={styles.error} role="alert">{mutationError.message}</p>}

      {editing ? (
        <CollectionItemForm
          cards={selectedItem.card ? [selectedItem.card] : []}
          companies={companies}
          item={selectedItem}
          loading={mutationStatus === "loading"}
          onCancel={() => setEditing(false)}
          onSubmit={handleUpdate}
        />
      ) : (
        <article className={styles.card}>
          <div className={styles.imageWrapper}>
            {selectedItem.card?.image_url ? <img alt={`Imagen de ${selectedItem.card.name}`} src={selectedItem.card.image_url} /> : <div className={styles.placeholder}>TCG</div>}
          </div>
          <div className={styles.content}>
            <p className={styles.eyebrow}>{selectedItem.tcg?.name} / {selectedItem.set?.name}</p>
            <h2>{selectedItem.card?.name || "Carta"}</h2>
            <dl>
              <div><dt>Cantidad</dt><dd>{selectedItem.quantity}</dd></div>
              <div><dt>Condición</dt><dd>{selectedItem.condition}</dd></div>
              <div><dt>Grading</dt><dd>{selectedItem.is_graded ? selectedItem.grading_company?.name || "Gradada" : "Sin grading"}</dd></div>
              <div><dt>Nota</dt><dd>{selectedItem.is_graded ? selectedItem.grade : "—"}</dd></div>
            </dl>
            <button className={styles.delete} disabled={mutationStatus === "loading"} onClick={handleDelete} type="button">Eliminar de mi colección</button>
          </div>
        </article>
      )}
    </section>
  );
}

export default CollectionDetailPage;
