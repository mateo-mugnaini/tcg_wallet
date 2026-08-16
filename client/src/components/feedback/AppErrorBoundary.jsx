import { Component } from "react";
import RuntimeError from "./RuntimeError.jsx";

class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("Frontend runtime error", error, errorInfo);
    }
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <RuntimeError
          message="Ocurrió un error inesperado. Recarga la aplicación para volver a intentarlo."
          onAction={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
