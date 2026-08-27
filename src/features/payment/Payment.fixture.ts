export const PAYMENT_PAGE_FIXTURE = {
  qrCode: {
    amountText: "$129.99 USD",
    timeRemaining: "14:59",
  },
  orderSummary: {
    item: {
      name: "Charizard VMAX #020",
      description: "DARKNESS ABLAZE • NM",
      price: "THB 12,900",
    },
    subtotal: "THB 13,150",
    shipping: "THB 50",
    tax: "Included",
    total: "THB 13,200",
  },
} satisfies {
  qrCode: {
    amountText: string;
    timeRemaining: string;
  };
  orderSummary: {
    item: {
      name: string;
      description: string;
      price: string;
    };
    subtotal: string;
    shipping: string;
    tax: string;
    total: string;
  };
};

export const PAYMENT_SUCCESS_FIXTURE = {
  orderNumber: "#ORD-99521",
  transactionSummary: {
    date: "Oct 24, 2026 14:32",
    paymentMethod: "QR",
    items: "3 TCG Booster Boxes",
    totalAmount: "THB 4,250.00",
  },
  orderDetails: {
    orderNumber: "#PEG-2023-8891",
    product: "ErgoPro Executive Mesh Chair × 1",
    status: "Completed",
    total: "$1,249.97",
  },
} satisfies {
  orderNumber: string;
  transactionSummary: {
    date: string;
    paymentMethod: string;
    items: string;
    totalAmount: string;
  };
  orderDetails: {
    orderNumber: string;
    product: string;
    status: string;
    total: string;
  };
};
