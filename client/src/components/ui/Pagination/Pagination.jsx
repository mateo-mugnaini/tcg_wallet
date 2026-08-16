import styles from "./Pagination.module.css";

function Pagination({ page = 1, totalPages = 0, onPageChange, disabled = false }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación" className={styles.pagination}>
      <button
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        Anterior
      </button>
      <span>Página {page} de {totalPages}</span>
      <button
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Siguiente
      </button>
    </nav>
  );
}

export default Pagination;
