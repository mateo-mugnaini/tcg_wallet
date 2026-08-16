import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError } from "../../../../redux/slices/auth.slice.js";
import { login as loginAction } from "../../../../redux/actions/auth/post/auth.actions.js";
import { createUser } from "../../../../redux/actions/users/post/users.actions.js";
import { clearUsersError } from "../../../../redux/slices/users.slice.js";
import { addNotification } from "../../../../redux/slices/notifications.slice.js";
import styles from "./AuthForm.module.css";

const initialForm = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validateForm(mode, form) {
  const errors = {};
  const username = form.username.trim();
  const email = form.email.trim();

  if (mode === "register" && (username.length < 3 || username.length > 50)) {
    errors.username = "El usuario debe tener entre 3 y 50 caracteres.";
  }
  if (!email || email.length > 255 || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Ingresa un email válido.";
  }
  if (form.password.length < 8 || form.password.length > 255) {
    errors.password = "La contraseña debe tener entre 8 y 255 caracteres.";
  }
  if (mode === "register" && form.password !== form.confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

function FieldError({ id, message }) {
  return message ? <small id={id} role="alert">{message}</small> : null;
}

function AuthForm({ mode, onModeChange }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const authState = useSelector((state) => state.auth);
  const usersState = useSelector((state) => state.users);
  const isSubmitting = authState.status === "loading" || usersState.status === "loading";

  const changeMode = (nextMode, nextMessage = null) => {
    setForm(initialForm);
    setFieldErrors({});
    if (nextMessage) dispatch(addNotification({
      message: nextMessage.text,
      title: "Cuenta creada",
      type: nextMessage.type,
    }));
    dispatch(clearAuthError());
    dispatch(clearUsersError());
    onModeChange(nextMode);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateForm(mode, form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (mode === "login") {
        await dispatch(loginAction({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        })).unwrap();
        return;
      }

      await dispatch(createUser({
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })).unwrap();
      changeMode("login", {
        type: "success",
        text: "Cuenta creada correctamente. Ya puedes iniciar sesión.",
      });
    } catch {
      // La notificación de error se genera desde Redux.
    }
  };

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Acceso">
        <button
          aria-controls="auth-form"
          aria-selected={mode === "login"}
          className={mode === "login" ? styles.activeTab : styles.tab}
          onClick={() => changeMode("login")}
          role="tab"
          type="button"
        >
          Iniciar sesión
        </button>
        <button
          aria-controls="auth-form"
          aria-selected={mode === "register"}
          className={mode === "register" ? styles.activeTab : styles.tab}
          onClick={() => changeMode("register")}
          role="tab"
          type="button"
        >
          Registrarse
        </button>
      </div>

      <form className={styles.form} id="auth-form" onSubmit={handleSubmit} noValidate>
        {mode === "register" && (
          <label className={styles.field}>
            Usuario
            <input
              aria-describedby={fieldErrors.username ? "username-error" : undefined}
              aria-invalid={Boolean(fieldErrors.username)}
              autoComplete="username"
              maxLength={50}
              minLength={3}
              name="username"
              onChange={handleChange}
              required
              type="text"
              value={form.username}
            />
            <FieldError id="username-error" message={fieldErrors.username} />
          </label>
        )}
        <label className={styles.field}>
          Email
          <input
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
            maxLength={255}
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
          <FieldError id="email-error" message={fieldErrors.email} />
        </label>
        <label className={styles.field}>
          Contraseña
          <input
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            aria-invalid={Boolean(fieldErrors.password)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            maxLength={255}
            minLength={8}
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
          <FieldError id="password-error" message={fieldErrors.password} />
        </label>
        {mode === "register" && (
          <label className={styles.field}>
            Repetir contraseña
            <input
              aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              autoComplete="new-password"
              maxLength={255}
              name="confirmPassword"
              onChange={handleChange}
              required
              type="password"
              value={form.confirmPassword}
            />
            <FieldError id="confirm-password-error" message={fieldErrors.confirmPassword} />
          </label>
        )}
        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </form>
    </>
  );
}

export default AuthForm;
