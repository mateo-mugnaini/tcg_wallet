import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../redux/actions/auth/post/auth.actions.js";
import { createUser } from "../../redux/actions/users/post/users.actions.js";
import styles from "./AuthPage.module.css";

const initialForm = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validateForm(mode, form) {
  const errors = {};

  if (mode === "register" && form.username.trim().length < 3) {
    errors.username = "El usuario debe tener al menos 3 caracteres.";
  }

  if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = "Ingresa un email válido.";
  }

  if (form.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres.";
  }

  if (mode === "register" && form.password !== form.confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

function AuthPage() {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState(null);
  const authState = useSelector((state) => state.auth);
  const usersState = useSelector((state) => state.users);
  const isSubmitting = authState.status === "loading" || usersState.status === "loading";
  const serverError = mode === "login" ? authState.error : usersState.error;

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setForm(initialForm);
    setFieldErrors({});
    setMessage(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    const errors = validateForm(mode, form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (mode === "login") {
        await dispatch(login({ email: form.email, password: form.password })).unwrap();
        setMessage({ type: "success", text: "Sesión iniciada correctamente." });
        return;
      }

      await dispatch(
        createUser({
          username: form.username.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      ).unwrap();
      setMode("login");
      setForm({ ...initialForm, email: form.email.trim().toLowerCase() });
      setMessage({ type: "success", text: "Cuenta creada. Ya puedes iniciar sesión." });
    } catch {
      setMessage(null);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <div className={styles.brand} aria-hidden="true">T</div>
        <p className={styles.eyebrow}>TCG Wallet</p>
        <h1 id="auth-title">
          {mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
        </h1>
        <p className={styles.subtitle}>
          {mode === "login"
            ? "Entra para gestionar tu colección."
            : "Empieza a organizar tus cartas favoritas."}
        </p>

        <div className={styles.tabs} role="tablist" aria-label="Acceso">
          <button
            className={mode === "login" ? styles.activeTab : styles.tab}
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => changeMode("login")}
          >
            Iniciar sesión
          </button>
          <button
            className={mode === "register" ? styles.activeTab : styles.tab}
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => changeMode("register")}
          >
            Registrarse
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {mode === "register" && (
            <label className={styles.field}>
              Usuario
              <input
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.username)}
              />
              {fieldErrors.username && <small>{fieldErrors.username}</small>}
            </label>
          )}

          <label className={styles.field}>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && <small>{fieldErrors.email}</small>}
          </label>

          <label className={styles.field}>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password && <small>{fieldErrors.password}</small>}
          </label>

          {mode === "register" && (
            <label className={styles.field}>
              Repetir contraseña
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
              />
              {fieldErrors.confirmPassword && <small>{fieldErrors.confirmPassword}</small>}
            </label>
          )}

          {serverError && <p className={styles.error}>{serverError.message}</p>}
          {message && <p className={message.type === "success" ? styles.success : styles.error}>{message.text}</p>}

          <button className={styles.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Procesando..."
              : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AuthPage;
