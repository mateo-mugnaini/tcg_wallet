import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.jsx";
import AppErrorBoundary from "./components/feedback/AppErrorBoundary.jsx";
import RuntimeError from "./components/feedback/RuntimeError.jsx";
import { appEnv } from "./app/config/env.js";
import { configureReduxApiClient } from "./redux/configure-api-client.js";
import { store } from "./redux/store.js";
import "./styles/global.css";

const root = createRoot(document.getElementById("root"));

if (appEnv.configurationError) {
  root.render(
    <RuntimeError
      message={appEnv.configurationError}
      title="Configuración incompleta"
    />,
  );
} else {
  configureReduxApiClient();
  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <Provider store={store}>
          <App />
        </Provider>
      </AppErrorBoundary>
    </StrictMode>,
  );
}
