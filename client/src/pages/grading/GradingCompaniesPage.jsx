import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getGradingCompanies } from "../../redux/actions/grading/get/grading.actions.js";
import styles from "../Page.module.css";

function GradingCompaniesPage() {
  const dispatch = useDispatch();
  const { companies, status, error } = useSelector((state) => state.grading);

  useEffect(() => {
    dispatch(getGradingCompanies());
  }, [dispatch]);

  return (
    <section className={styles.page}>
      <header className={styles.header}><div><p className={styles.eyebrow}>Grading</p><h1 className={styles.title}>Empresas de grading</h1><p className={styles.description}>Catálogo de empresas disponible para precios graded.</p></div><span className={styles.muted}>{status}</span></header>
      {error && <p className={styles.error}>{error.message}</p>}
      <article className={styles.card}><ul className={styles.list}>{companies.map((company) => <li className={styles.listItem} key={company.id}>{company.name || company.code}</li>)}</ul></article>
    </section>
  );
}

export default GradingCompaniesPage;
