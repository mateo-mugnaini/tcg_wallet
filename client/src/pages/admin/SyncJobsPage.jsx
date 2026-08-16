import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSyncJobs } from "../../redux/actions/sync/get/sync.actions.js";
import styles from "../Page.module.css";

function SyncJobsPage() {
  const dispatch = useDispatch();
  const { jobs, activeJobId, status } = useSelector((state) => state.sync);

  useEffect(() => {
    dispatch(getSyncJobs());
  }, [dispatch]);

  return (
    <section className={styles.page}>
      <header className={styles.header}><div><p className={styles.eyebrow}>Administración</p><h1 className={styles.title}>Sync jobs</h1><p className={styles.description}>Estado de la cola persistente del backend.</p></div><span className={styles.muted}>{status}</span></header>
      <article className={styles.card}><p className={styles.muted}>Job activo: {activeJobId || "ninguno"}</p><ul className={styles.list}>{jobs.map((job) => <li className={styles.listItem} key={job.id}><span>{job.type}</span><span className={styles.muted}>{job.status}</span></li>)}</ul></article>
    </section>
  );
}

export default SyncJobsPage;
