import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUsers } from "../../redux/actions/users/get/users.actions.js";
import styles from "../Page.module.css";

function UsersPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  return (
    <section className={styles.page}>
      <header className={styles.header}><div><p className={styles.eyebrow}>Administración</p><h1 className={styles.title}>Usuarios</h1><p className={styles.description}>Listado administrativo protegido por el backend.</p></div><span className={styles.muted}>{status}</span></header>
      <article className={styles.card}><ul className={styles.list}>{items.map((user) => <li className={styles.listItem} key={user.id}><span>{user.username}</span><span className={styles.muted}>{user.email}</span></li>)}</ul></article>
    </section>
  );
}

export default UsersPage;
