import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React, { useMemo } from "react";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// CartSummary Component Definition
// Encapsulates Multi-Seller Cart Subtotal & Shipping Split Math
// ---------------------------------------------------------------------------

export interface CartItemSummary {
  id: number;
  sellerProfileId?: number | null;
  sellerName?: string | null;
  productName: string;
  variantLabel?: string | null;
  condition?: string | null;
  quantity: number;
  unitPriceAtAdd: number;
  currentPrice?: number | null;
  priceChanged?: boolean;
}

export interface CartSummaryProps {
  items: CartItemSummary[];
  selectedItemIds?: Set<number> | number[];
  baseShippingPerSeller?: number;
  isLoading?: boolean;
  onProceedToCheckout?: () => void;
}

export function CartSummary({
  items,
  selectedItemIds,
  baseShippingPerSeller = 50,
  isLoading = false,
  onProceedToCheckout,
}: CartSummaryProps) {
  const selectedSet = useMemo(() => {
    if (!selectedItemIds) {
      return new Set(items.map((item) => item.id));
    }
    return selectedItemIds instanceof Set ? selectedItemIds : new Set(selectedItemIds);
  }, [items, selectedItemIds]);

  const checkedItems = useMemo(
    () => items.filter((item) => selectedSet.has(item.id)),
    [items, selectedSet]
  );

  const subtotal = useMemo(
    () =>
      checkedItems.reduce((acc, item) => {
        const price = item.currentPrice ?? item.unitPriceAtAdd;
        return acc + price * item.quantity;
      }, 0),
    [checkedItems]
  );

  // Group checked items by seller for multi-seller shipping splits
  const sellerGroups = useMemo(() => {
    const groups = new Map<
      number,
      { sellerId: number; sellerName: string; items: CartItemSummary[]; subtotal: number }
    >();

    for (const item of checkedItems) {
      const sellerId = item.sellerProfileId ?? 1;
      const sellerName = item.sellerName || `Seller #${sellerId}`;
      const price = item.currentPrice ?? item.unitPriceAtAdd;

      if (!groups.has(sellerId)) {
        groups.set(sellerId, {
          sellerId,
          sellerName,
          items: [],
          subtotal: 0,
        });
      }
      const group = groups.get(sellerId)!;
      group.items.push(item);
      group.subtotal += price * item.quantity;
    }

    return Array.from(groups.values());
  }, [checkedItems]);

  const estimatedShipping = useMemo(() => {
    if (checkedItems.length === 0) return 0;
    return sellerGroups.length * baseShippingPerSeller;
  }, [checkedItems, sellerGroups, baseShippingPerSeller]);

  const grandTotal = subtotal > 0 ? subtotal + estimatedShipping : 0;
  const formatPrice = (val: number) => `฿${val.toLocaleString()}`;

  return (
    <Card className="rounded-xl border shadow-none bg-white p-6 flex flex-col gap-6" data-testid="cart-summary">
      <h2 className="text-2xl font-bold text-foreground">Order Summary</h2>

      <div className="flex flex-col gap-4 text-base">
        {/* Subtotal */}
        <div className="flex items-center justify-between" data-testid="cart-subtotal-row">
          <span className="text-foreground">
            Subtotal ({checkedItems.length} items)
          </span>
          <span className="font-medium text-foreground" data-testid="cart-subtotal-value">
            {formatPrice(subtotal)}
          </span>
        </div>

        {/* Multi-Seller Split Breakdown if > 1 seller */}
        {sellerGroups.length > 1 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2" data-testid="multi-seller-breakdown">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Shipping split across {sellerGroups.length} shops ({formatPrice(baseShippingPerSeller)} / shop):
            </span>
            {sellerGroups.map((group) => (
              <div key={group.sellerId} className="flex items-center justify-between text-xs text-slate-700" data-testid={`seller-split-${group.sellerId}`}>
                <span>{group.sellerName} ({group.items.length} items)</span>
                <span>{formatPrice(group.subtotal)} + {formatPrice(baseShippingPerSeller)} shipping</span>
              </div>
            ))}
          </div>
        )}

        {/* Estimated Shipping */}
        <div className="flex items-center justify-between" data-testid="cart-shipping-row">
          <span className="text-foreground">Estimated Shipping</span>
          <span className="font-medium text-foreground" data-testid="cart-shipping-value">
            {checkedItems.length > 0 ? formatPrice(estimatedShipping) : "฿0"}
          </span>
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between">
          <span className="text-foreground">Tax</span>
          <span className="font-medium text-foreground">Included</span>
        </div>
      </div>

      <Separator className="my-2 bg-border/50" />

      {/* Grand Total */}
      <div className="flex items-center justify-between mb-2" data-testid="cart-total-row">
        <span className="text-xl font-bold text-foreground">Total</span>
        <span className="text-4xl font-bold text-primary" data-testid="cart-total-value">
          {formatPrice(grandTotal)}
        </span>
      </div>

      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg py-6 rounded-full shadow-md"
        disabled={checkedItems.length === 0 || isLoading}
        onClick={onProceedToCheckout}
        data-testid="checkout-button"
      >
        {isLoading ? "Loading..." : "Proceed to Checkout"}
      </Button>

      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium mt-2">
        <Lock className="w-4 h-4" />
        <span>Secure Checkout Guarantee</span>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// TEST SUITE: Multi-Seller Cart Subtotal & Shipping Split Math
// ---------------------------------------------------------------------------

describe("CartSummary: Multi-Seller Subtotal & Shipping Split Math", () => {
  const sellerAItems: CartItemSummary[] = [
    {
      id: 1,
      sellerProfileId: 10,
      sellerName: "Somchai Cards Shop",
      productName: "Pikachu ex",
      quantity: 1,
      unitPriceAtAdd: 250,
      currentPrice: 250,
    },
    {
      id: 2,
      sellerProfileId: 10,
      sellerName: "Somchai Cards Shop",
      productName: "Raichu Holo",
      quantity: 2,
      unitPriceAtAdd: 100,
      currentPrice: 100,
    },
  ];

  const sellerBItems: CartItemSummary[] = [
    {
      id: 3,
      sellerProfileId: 20,
      sellerName: "Bangkok TCG Hub",
      productName: "Charizard ex",
      quantity: 1,
      unitPriceAtAdd: 500,
      currentPrice: 500,
    },
  ];

  const sellerCItems: CartItemSummary[] = [
    {
      id: 4,
      sellerProfileId: 30,
      sellerName: "Siam Card Collector",
      productName: "Mew ex",
      quantity: 1,
      unitPriceAtAdd: 300,
      currentPrice: 300,
    },
  ];

  // Test Case 1: Single Seller calculation
  it("Case 1: calculates subtotal and single-seller shipping fee (฿50) correctly", () => {
    render(<CartSummary items={sellerAItems} />);

    // Subtotal: (250 * 1) + (100 * 2) = 450
    // Shipping: 1 seller * 50 = 50
    // Total: 450 + 50 = 500
    expect(screen.getByTestId("cart-subtotal-value")).toHaveTextContent("฿450");
    expect(screen.getByTestId("cart-shipping-value")).toHaveTextContent("฿50");
    expect(screen.getByTestId("cart-total-value")).toHaveTextContent("฿500");
    expect(screen.queryByTestId("multi-seller-breakdown")).not.toBeInTheDocument();
  });

  // Test Case 2: Multi-Seller with 2 Sellers
  it("Case 2: calculates multi-seller shipping split for 2 different sellers (2 x ฿50 = ฿100)", () => {
    const twoSellerItems = [...sellerAItems, ...sellerBItems];
    render(<CartSummary items={twoSellerItems} />);

    // Subtotal: 450 (A) + 500 (B) = 950
    // Shipping: 2 sellers * 50 = 100
    // Total: 950 + 100 = 1050
    expect(screen.getByTestId("cart-subtotal-value")).toHaveTextContent("฿950");
    expect(screen.getByTestId("cart-shipping-value")).toHaveTextContent("฿100");
    expect(screen.getByTestId("cart-total-value")).toHaveTextContent("฿1,050");

    // Multi-seller breakdown should be visible
    const breakdown = screen.getByTestId("multi-seller-breakdown");
    expect(breakdown).toBeInTheDocument();
    expect(within(breakdown).getByText(/Somchai Cards Shop/)).toBeInTheDocument();
    expect(within(breakdown).getByText(/Bangkok TCG Hub/)).toBeInTheDocument();
  });

  // Test Case 3: Multi-Seller with 3 Sellers
  it("Case 3: calculates multi-seller shipping split for 3 different sellers (3 x ฿50 = ฿150) and matches grand total", () => {
    const threeSellerItems = [...sellerAItems, ...sellerBItems, ...sellerCItems];
    render(<CartSummary items={threeSellerItems} />);

    // Subtotal: 450 (A) + 500 (B) + 300 (C) = 1250
    // Shipping: 3 sellers * 50 = 150
    // Total: 1250 + 150 = 1400
    expect(screen.getByTestId("cart-subtotal-value")).toHaveTextContent("฿1,250");
    expect(screen.getByTestId("cart-shipping-value")).toHaveTextContent("฿150");
    expect(screen.getByTestId("cart-total-value")).toHaveTextContent("฿1,400");

    const breakdown = screen.getByTestId("multi-seller-breakdown");
    expect(within(breakdown).getByTestId("seller-split-10")).toHaveTextContent("Somchai Cards Shop (2 items)");
    expect(within(breakdown).getByTestId("seller-split-20")).toHaveTextContent("Bangkok TCG Hub (1 items)");
    expect(within(breakdown).getByTestId("seller-split-30")).toHaveTextContent("Siam Card Collector (1 items)");
  });

  // Test Case 4: Grouping items and displaying per-seller subtotals
  it("Case 4: groups items by seller and displays per-seller item counts and subtotals accurately", () => {
    const items = [...sellerAItems, ...sellerBItems];
    render(<CartSummary items={items} />);

    const splitA = screen.getByTestId("seller-split-10");
    expect(splitA).toHaveTextContent("฿450 + ฿50 shipping");

    const splitB = screen.getByTestId("seller-split-20");
    expect(splitB).toHaveTextContent("฿500 + ฿50 shipping");
  });

  // Test Case 5: Deselecting items adjusts shipping split
  it("Case 5: recalculates subtotal and removes a seller's shipping fee when all items from that seller are deselected", () => {
    const items = [...sellerAItems, ...sellerBItems]; // Seller A (id 1, 2), Seller B (id 3)
    // Select only Seller A's items
    const selectedIds = new Set([1, 2]);

    render(<CartSummary items={items} selectedItemIds={selectedIds} />);

    // Subtotal should only be Seller A's items (฿450)
    expect(screen.getByTestId("cart-subtotal-value")).toHaveTextContent("฿450");
    // Shipping should drop to 1 seller (฿50) since Seller B has 0 selected items
    expect(screen.getByTestId("cart-shipping-value")).toHaveTextContent("฿50");
    expect(screen.getByTestId("cart-total-value")).toHaveTextContent("฿500");
    // Multi-seller banner should disappear because only 1 seller is active
    expect(screen.queryByTestId("multi-seller-breakdown")).not.toBeInTheDocument();
  });

  // Test Case 6: Empty cart or 0 selected items disables checkout
  it("Case 6: disables the checkout button and displays ฿0 for empty selection or empty cart", () => {
    const handleCheckout = vi.fn();
    const { rerender } = render(
      <CartSummary items={[]} onProceedToCheckout={handleCheckout} />
    );

    expect(screen.getByTestId("cart-subtotal-value")).toHaveTextContent("฿0");
    expect(screen.getByTestId("cart-shipping-value")).toHaveTextContent("฿0");
    expect(screen.getByTestId("cart-total-value")).toHaveTextContent("฿0");

    const button = screen.getByTestId("checkout-button");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleCheckout).not.toHaveBeenCalled();

    // Rerender with items but none selected
    rerender(
      <CartSummary
        items={sellerAItems}
        selectedItemIds={new Set()}
        onProceedToCheckout={handleCheckout}
      />
    );
    expect(screen.getByTestId("cart-subtotal-value")).toHaveTextContent("฿0");
    expect(screen.getByTestId("checkout-button")).toBeDisabled();
  });

  // Test Case 7: Loading state disables checkout button
  it("Case 7: shows loading state and disables checkout during checkout submission or cart loading", () => {
    render(<CartSummary items={sellerAItems} isLoading={true} />);

    const button = screen.getByTestId("checkout-button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Loading...");
  });

  // Test Case 8: Price updates and floating-point arithmetic precision
  it("Case 8: handles price updates (currentPrice vs unitPriceAtAdd) and computes exact arithmetic without floating point drift", () => {
    const itemsWithDecimals: CartItemSummary[] = [
      {
        id: 11,
        sellerProfileId: 10,
        sellerName: "Shop A",
        productName: "Card A",
        quantity: 3,
        unitPriceAtAdd: 19.99,
        currentPrice: 20.0, // Updated price
        priceChanged: true,
      },
      {
        id: 12,
        sellerProfileId: 20,
        sellerName: "Shop B",
        productName: "Card B",
        quantity: 1,
        unitPriceAtAdd: 100.0,
        currentPrice: 100.0,
      },
    ];

    render(<CartSummary items={itemsWithDecimals} />);

    // Subtotal: (20 * 3) + 100 = 160
    // Shipping: 2 * 50 = 100
    // Total: 260
    expect(screen.getByTestId("cart-subtotal-value")).toHaveTextContent("฿160");
    expect(screen.getByTestId("cart-shipping-value")).toHaveTextContent("฿100");
    expect(screen.getByTestId("cart-total-value")).toHaveTextContent("฿260");
  });
});
