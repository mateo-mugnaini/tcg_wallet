import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../components/ui/PageHeader/PageHeader.jsx";
import { getGradingCompanies } from "../../redux/actions/grading/get/grading.actions.js";
import { createGradingCompany } from "../../redux/actions/grading/post/grading.actions.js";
import { updateGradingCompany } from "../../redux/actions/grading/patch/grading.actions.js";
import { deleteGradingCompany } from "../../redux/actions/grading/delete/grading.actions.js";
import { addNotification } from "../../redux/slices/notifications.slice.js";
import styles from "./GradingCompaniesPage.module.css";

function GradingCompaniesPage() {
  const dispatch = useDispatch();
  const { companies, status, mutationStatus } = useSelector((state) => state.grading);
  const user = useSelector((state) => state.auth.user);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    dispatch(getGradingCompanies());
  }, [dispatch]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
  };

  const startEdit = (company) => {
    setEditingId(company.id);
    setName(company.name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (name.trim().length < 1 || name.trim().length > 50) {
      dispatch(addNotification({
        message: "El nombre debe tener entre 1 y 50 caracteres.",
        title: "Revisa el formulario",
        type: "error",
      }));
      return;
    }

    try {
      if (editingId) {
        await dispatch(updateGradingCompany({ id: editingId, data: { name: name.trim() } })).unwrap();
      } else {
        await dispatch(createGradingCompany({ name: name.trim() })).unwrap();
      }
      resetForm();
      dispatch(getGradingCompanies());
    } catch { /* La notificación se genera desde Redux. */ }
  };

  const handleDelete = async (company) => {
    if (!window.confirm(`¿Eliminar ${company.name}?`)) return;
    await dispatch(deleteGradingCompany(company.id));
    dispatch(getGradingCompanies());
  };

  return (
    <section className={styles.page}>
      <PageHeader
        description="Empresas disponibles para clasificar cartas y consultar precios graded."
        eyebrow="Grading"
        title="Empresas de grading"
      >
        <span className={styles.status}>{status === "loading" ? "Cargando..." : `${companies.length} empresas`}</span>
      </PageHeader>

      {isAdmin && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div>
            <p className={styles.eyebrow}>{editingId ? "Editar empresa" : "Administración"}</p>
            <h2>{editingId ? "Actualizar grading" : "Agregar empresa"}</h2>
          </div>
          <label>
            Nombre
            <input maxLength="50" onChange={(event) => setName(event.target.value)} placeholder="PSA, BGS, CGC..." required value={name} />
          </label>
          <div className={styles.formActions}>
            <button className={styles.primary} disabled={mutationStatus === "loading"} type="submit">{mutationStatus === "loading" ? "Guardando..." : editingId ? "Guardar cambios" : "Crear empresa"}</button>
            {editingId && <button className={styles.secondary} onClick={resetForm} type="button">Cancelar</button>}
          </div>
        </form>
      )}

      <div className={styles.grid}>
        {companies.map((company) => (
          <article className={styles.company} key={company.id}>
            <div className={styles.mark}>{company.name.slice(0, 1).toUpperCase()}</div>
            <div className={styles.companyContent}><h2>{company.name}</h2><span>Empresa de grading</span></div>
            {isAdmin && <div className={styles.actions}><button onClick={() => startEdit(company)} type="button">Editar</button><button className={styles.delete} onClick={() => handleDelete(company)} type="button">Eliminar</button></div>}
          </article>
        ))}
      </div>
      {status === "succeeded" && companies.length === 0 && <p className={styles.empty}>No hay empresas de grading registradas.</p>}
    </section>
  );
}

export default GradingCompaniesPage;
