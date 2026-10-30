import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Game } from "@/features/admin/catalog.types";
import { GameFormDialog } from "@/features/admin/components/GameFormDialog";
import * as taxonomyApi from "@/features/admin/taxonomy.api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/taxonomy.api", () => ({
  createGame: vi.fn(),
  updateGame: vi.fn(),
}));

const pokemon: Game = {
  id: 1,
  code: "POKEMON",
  name: "Pokémon",
  nameLocal: null,
  slug: "pokemon",
  logoUrl: "catalog/2026/10/pokemon.png",
  logoImageUrl: "https://storage.example/pokemon.png?signed",
  displayOrder: 1,
  active: true,
  createdBy: 1,
  createdAt: "2026-01-01T00:00:00Z",
};

function renderDialog(game?: Game) {
  renderWithProviders(
    <GameFormDialog open onOpenChange={vi.fn()} game={game} />,
  );
}

describe("GameFormDialog — logo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taxonomyApi.updateGame).mockResolvedValue(pokemon);
  });

  it("asks for an uploaded file instead of a URL", () => {
    renderDialog();

    expect(screen.queryByPlaceholderText("https://…")).not.toBeInTheDocument();
    expect(
      screen.getByText("ลากรูปมาวาง หรือคลิกเพื่อเลือกรูป"),
    ).toBeInTheDocument();
  });

  it("keeps the saved logo key when it is left alone", async () => {
    const user = userEvent.setup();
    renderDialog(pokemon);

    expect(screen.getByText("โลโก้ปัจจุบัน")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "บันทึก" }));

    await waitFor(() => expect(taxonomyApi.updateGame).toHaveBeenCalled());
    expect(vi.mocked(taxonomyApi.updateGame).mock.calls[0][1].logoUrl).toBe(
      "catalog/2026/10/pokemon.png",
    );
  });

  it("clears the logo once it is removed", async () => {
    const user = userEvent.setup();
    renderDialog(pokemon);

    await user.click(screen.getByRole("button", { name: "เอารูปออก" }));
    expect(
      screen.getByText("ลากรูปมาวาง หรือคลิกเพื่อเลือกรูป"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "บันทึก" }));

    await waitFor(() => expect(taxonomyApi.updateGame).toHaveBeenCalled());
    expect(vi.mocked(taxonomyApi.updateGame).mock.calls[0][1].logoUrl).toBeNull();
  });
});
