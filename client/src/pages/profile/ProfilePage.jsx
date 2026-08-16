import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserById } from "../../redux/actions/users/get/users.actions.js";
import styles from "../Page.module.css";

function ProfilePage() {
  const dispatch = useDispatch();
  const sessionUser = useSelector((state) => state.auth.user);
  const { current, status, error } = useSelector((state) => state.users);

  useEffect(() => {
    if (sessionUser?.id) dispatch(getUserById(sessionUser.id));
  }, [dispatch, sessionUser?.id]);

  const profile = current || sessionUser;

  return (
    <section className={styles.page}>
      <header className={styles.header}><div><p className={styles.eyebrow}>Cuenta</p><h1 className={styles.title}>Mi perfil</h1><p className={styles.description}>Datos del usuario autenticado.</p></div><span className={styles.muted}>{status}</span></header>
      {error && <p className={styles.error}>{error.message}</p>}
      <article className={styles.card}><h2>{profile?.username || "Usuario"}</h2><p className={styles.muted}>{profile?.email || "—"}</p><p className={styles.muted}>Rol: {profile?.role || "No informado por auth"}</p></article>
    </section>
  );
}

export default ProfilePage;
