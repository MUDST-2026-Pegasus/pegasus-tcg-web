import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShipmentForm } from "@/features/seller/orders/components/ShipmentForm";
import { OrderDetailContent } from "@/features/seller/orders/components/detail/OrderDetailContent";
import * as ordersApi from "@/features/seller/orders/orders.api";
import type { SellerOrderDetail, ShippingChoice } from "@/features/seller/orders/orders.types";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/seller/orders/orders.api", () => ({
  downloadSellerOrderSummary: vi.fn(),
  shipSellerOrder: vi.fn(),
  acceptSellerOrder: vi.fn(),
  cancelSellerOrder: vi.fn(),
}));
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

const paidOrder: SellerOrderDetail = {
  summary: {
    order: {
      id: 41,
      salesOrderId: 9,
      sellerProfileId: 3,
      sellerOrderNumber: "PGS-20261013-000009-S3",
      status: "PAID",
      itemsSubtotal: 1800,
      shippingFee: 50,
      discountAmount: 0,
      grandTotal: 1850,
      commissionAmount: 92.5,
      sellerNetAmount: 1757.5,
      acceptedAt: null,
      shippedAt: null,
      deliveredAt: null,
      autoCompleteAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: "2026-10-13T02:00:00Z",
      items: [],
      shipments: [],
      statusHistory: [],
      sellerName: null,
    },
    orderNumber: "PGS-20261013-000009",
    buyer: { id: 5, username: "nattapong_p", displayName: "Nattapong", avatarUrl: null },
    paidAt: "2026-10-13T03:00:00Z",
    shipBy: "2026-10-15T03:00:00Z",
    shippingAddressSnapshot: null,
    buyerNote: null,
    shippingChoice: null,
  },
  payment: null,
  costTotal: 980,
  buyerOrderCount: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ordersApi.shipSellerOrder).mockResolvedValue(paidOrder);
});

describe("confirming a shipment", () => {
  it("asks again on the order list before the parcel is marked as shipped", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShipmentForm orderId={41} orderNumber="PGS-20261013-000009-S3" />);

    await user.type(screen.getByRole("textbox", { name: /เลขพัสดุ/ }), "TH2408000091");
    await user.click(screen.getByRole("button", { name: "ยืนยันจัดส่ง" }));

    // ส่งแล้วย้อนไม่ได้ — ต้องเห็นสรุปก่อน และยังไม่ยิงอะไรไป
    const dialog = screen.getByRole("alertdialog", { name: "ยืนยันจัดส่ง PGS-20261013-000009-S3?" });
    expect(dialog).toHaveTextContent("Kerry Express");
    expect(dialog).toHaveTextContent("TH2408000091");
    expect(ordersApi.shipSellerOrder).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "กลับไปแก้" }));
    expect(ordersApi.shipSellerOrder).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "ยืนยันจัดส่ง" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "ยืนยันจัดส่ง" }),
    );

    await waitFor(() =>
      expect(ordersApi.shipSellerOrder).toHaveBeenCalledWith(41, {
        carrierCode: "KERRY",
        carrierName: "Kerry Express",
        trackingNumber: "TH2408000091",
      }),
    );
    expect(ordersApi.shipSellerOrder).toHaveBeenCalledTimes(1);
  });

  it("asks again on the order detail page too", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrderDetailContent detail={paidOrder} />);

    await user.type(screen.getByPlaceholderText(/TH2408/), "TH2408000091");
    await user.click(screen.getByRole("button", { name: "ยืนยันจัดส่ง" }));

    const dialog = screen.getByRole("alertdialog", { name: "ยืนยันจัดส่ง PGS-20261013-000009-S3?" });
    expect(ordersApi.shipSellerOrder).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "ยืนยันจัดส่ง" }));

    await waitFor(() => expect(ordersApi.shipSellerOrder).toHaveBeenCalledTimes(1));
  });
});

const emsChoice: ShippingChoice = {
  optionId: 7,
  name: "EMS ด่วน",
  carrierCode: "THAILAND_POST_EMS",
  fee: 200,
  estDaysMin: 1,
  estDaysMax: 2,
};
const noCarrierChoice: ShippingChoice = { ...emsChoice, name: "ส่งด่วนในกรุงเทพฯ", carrierCode: null };

function withChoice(shippingChoice: ShippingChoice | null): SellerOrderDetail {
  return { ...paidOrder, summary: { ...paidOrder.summary, shippingChoice } };
}

async function pickCarrier(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: label }));
}

const HINT_MATCH = /เลือกให้ตามที่ผู้ซื้อเลือก/;
const HINT_DIFFERS = /ไม่ตรงกับที่ผู้ซื้อเลือก \(ไปรษณีย์ไทย EMS\)/;
const HINT_UNSET = /ตัวเลือกนี้ไม่ได้ระบุบริษัทขนส่ง/;

describe("the delivery choice the buyer picked", () => {
  it("shows the choice and preselects its carrier on the detail page", () => {
    renderWithProviders(<OrderDetailContent detail={withChoice(emsChoice)} />);

    const box = screen.getByRole("region", { name: "การจัดส่งที่ผู้ซื้อเลือก" });
    expect(box).toHaveTextContent("EMS ด่วน");
    expect(box).toHaveTextContent("ไปรษณีย์ไทย EMS");
    expect(box).toHaveTextContent("ผู้ซื้อคาดว่าจะได้รับใน 1–2 วัน");
    expect(box).toHaveTextContent("ผู้ซื้อชำระค่าส่ง ฿200");
    expect(screen.getByRole("combobox")).toHaveTextContent("ไปรษณีย์ไทย EMS");
    expect(screen.getByText(HINT_MATCH)).toBeInTheDocument();
  });

  it("preselects the carrier on the order list and sends it", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShipmentForm orderId={41} orderNumber="PGS-1" shippingChoice={emsChoice} />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("ไปรษณีย์ไทย EMS");
    await user.type(screen.getByRole("textbox", { name: /เลขพัสดุ/ }), "TH1");
    await user.click(screen.getByRole("button", { name: "ยืนยันจัดส่ง" }));
    expect(screen.getByRole("alertdialog")).not.toHaveTextContent("ผู้ซื้อเลือก:");
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "ยืนยันจัดส่ง" }),
    );

    await waitFor(() =>
      expect(ordersApi.shipSellerOrder).toHaveBeenCalledWith(41, {
        carrierCode: "THAILAND_POST_EMS",
        carrierName: "ไปรษณีย์ไทย EMS",
        trackingNumber: "TH1",
      }),
    );
  });

  it("warns when the seller picks another carrier, and repeats it in the dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrderDetailContent detail={withChoice(emsChoice)} />);

    await pickCarrier(user, "Kerry Express");
    expect(screen.getByText(HINT_DIFFERS)).toBeInTheDocument();
    expect(screen.queryByText(HINT_MATCH)).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/TH2408/), "TH1");
    await user.click(screen.getByRole("button", { name: "ยืนยันจัดส่ง" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "ผู้ซื้อเลือก: EMS ด่วน (ไปรษณีย์ไทย EMS)",
    );
  });

  it("keeps the seller's own pick when the order refreshes", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <ShipmentForm orderId={41} orderNumber="PGS-1" shippingChoice={null} />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Kerry Express");

    // ข้อมูลมาทีหลัง: ค่าเริ่มต้นต้องตามออเดอร์ ไม่ค้างเป็น Kerry
    rerender(<ShipmentForm orderId={41} orderNumber="PGS-1" shippingChoice={emsChoice} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("ไปรษณีย์ไทย EMS");

    await pickCarrier(user, "Flash Express");
    rerender(<ShipmentForm orderId={41} orderNumber="PGS-1" shippingChoice={{ ...emsChoice }} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Flash Express");
  });

  it("makes the seller choose when the option has no carrier", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrderDetailContent detail={withChoice(noCarrierChoice)} />);

    expect(screen.getByRole("region", { name: "การจัดส่งที่ผู้ซื้อเลือก" })).toHaveTextContent(
      "ไม่ระบุขนส่ง",
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("เลือกบริษัทขนส่ง");
    expect(screen.getByText(HINT_UNSET)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/TH2408/), "TH1");
    expect(screen.getByRole("button", { name: "ยืนยันจัดส่ง" })).toBeDisabled();

    await pickCarrier(user, "Flash Express");
    expect(screen.getByRole("button", { name: "ยืนยันจัดส่ง" })).toBeEnabled();
    expect(screen.queryByText(HINT_UNSET)).not.toBeInTheDocument();
  });

  it("keeps showing the choice after shipping, without a hint", () => {
    const shipped = withChoice(emsChoice);
    shipped.summary.order = { ...shipped.summary.order, status: "SHIPPED" };
    renderWithProviders(<OrderDetailContent detail={shipped} />);

    expect(screen.getByRole("region", { name: "การจัดส่งที่ผู้ซื้อเลือก" })).toBeInTheDocument();
    expect(screen.queryByText(HINT_MATCH)).not.toBeInTheDocument();
  });

  it("behaves as before for an order with no snapshot", () => {
    renderWithProviders(<OrderDetailContent detail={withChoice(null)} />);

    expect(screen.queryByRole("region", { name: "การจัดส่งที่ผู้ซื้อเลือก" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Kerry Express");
    expect(screen.queryByText(HINT_MATCH)).not.toBeInTheDocument();
  });
});
