import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.jsx";
import { configureReduxApiClient } from "./redux/configure-api-client.js";
import { store } from "./redux/store.js";
import "./index.css";

configureReduxApiClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
