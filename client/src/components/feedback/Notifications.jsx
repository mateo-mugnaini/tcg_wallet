import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dismissNotification } from "../../redux/slices/notifications.slice.js";
import styles from "./Notifications.module.css";

function Notification({ item }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      dispatch(dismissNotification(item.id));
    }, item.duration);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, item.duration, item.id]);

  const tone = styles[item.type] || styles.error;

  return (
    <div className={`${styles.notification} ${tone}`} role={item.type === "error" ? "alert" : "status"}>
      <div className={styles.copy}>
        <strong>{item.title}</strong>
        <span>{item.message}</span>
      </div>
      <button
        aria-label="Cerrar notificación"
        className={styles.close}
        onClick={() => dispatch(dismissNotification(item.id))}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

function Notifications() {
  const notifications = useSelector((state) => state.notifications?.items || []);

  return (
    <aside aria-label="Notificaciones" className={styles.container}>
      {notifications.map((item) => <Notification item={item} key={item.id} />)}
    </aside>
  );
}

export default Notifications;
