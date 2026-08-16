import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CollectionItemForm from "./CollectionItemForm.jsx";

const set = { id: "set-1", name: "Base Set", code: "BASE" };
const card = { id: "card-1", set_id: "set-1", name: "Pikachu", card_number: "025" };

describe("CollectionItemForm", () => {
  it("obliga a seleccionar un set antes de habilitar las cartas", async () => {
    const user = userEvent.setup();
    const onSetChange = vi.fn();

    render(
      <CollectionItemForm
        cards={[card]}
        companies={[]}
        loading={false}
        onSetChange={onSetChange}
        onSubmit={vi.fn()}
        sets={[set]}
      />,
    );

    const setSelect = screen.getByLabelText("Set");
    const cardSelect = screen.getByLabelText("Carta");

    expect(cardSelect).toBeDisabled();
    await user.selectOptions(setSelect, "set-1");

    expect(onSetChange).toHaveBeenCalledWith("set-1");
    expect(cardSelect).not.toBeDisabled();
    expect(screen.getByRole("option", { name: "Pikachu · 025" })).toBeInTheDocument();
  });

  it("ofrece búsqueda de cartas dentro del set seleccionado", async () => {
    const user = userEvent.setup();
    const onCardSearch = vi.fn();

    render(
      <CollectionItemForm
        cards={[card]}
        companies={[]}
        loading={false}
        onCardSearch={onCardSearch}
        onSubmit={vi.fn()}
        sets={[set]}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Set"), "set-1");
    await user.type(screen.getByPlaceholderText("Nombre o número de carta"), "Pika");

    await waitFor(() => expect(onCardSearch).toHaveBeenLastCalledWith("set-1", "Pika"));
  });
});
