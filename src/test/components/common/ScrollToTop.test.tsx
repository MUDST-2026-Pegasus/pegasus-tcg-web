import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";

import { ScrollToTop } from "@/components/common/ScrollToTop";

function NavigationTestHarness() {
  const navigate = useNavigate();
  return (
    <>
      <ScrollToTop />
      <button onClick={() => navigate("/search")}>Go to search</button>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/search" element={<div>Search</div>} />
      </Routes>
    </>
  );
}

describe("ScrollToTop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  it("calls window.scrollTo(0, 0) on initial render", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("calls window.scrollTo(0, 0) upon route navigation", async () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <NavigationTestHarness />
      </MemoryRouter>,
    );

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    // Simulate route navigation
    act(() => {
      getByText("Go to search").click();
    });

    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
  });
});
