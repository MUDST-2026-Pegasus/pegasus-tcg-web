export const ACCOUNT_USER = {
  initials: "SJ",
  name: "Somchai Jaidee",
  email: "somchai.j@example.com",
};

export const PROFILE_FIXTURE = {
  user: ACCOUNT_USER,
  membership: {
    tier: "Elite",
    rewardPoints: "2,450",
  },
  latestOrder: {
    awaitingPayment: "0",
    toShip: "1",
  },
  primaryAddress: {
    label: "Home",
    recipient: "Somchai Jaidee",
    phone: "(+66) 89-123-4567",
    lines: [
      "123/45 Sukhumvit Soi 1, Sukhumvit Road",
      "Khlong Toei Nuea, Watthana",
      "Bangkok 10110",
    ],
  },
};

export const ORDER_HISTORY_FIXTURE = {
  user: ACCOUNT_USER,
  orders: [
    {
      id: "#PEG-2023-8891",
      date: "Oct 24, 2023",
      title: "Charizard VMAX #020",
      description: "Darkness Ablaze • Near Mint • Qty: 1",
      total: "12,900",
      image: "/charizard.jpg",
      status: "completed",
    },
    {
      id: "#PEG-2023-8942",
      date: "Oct 28, 2023",
      title: "Monkey D. Luffy OP01-003",
      description: "Romance Dawn • Near Mint • Qty: 1",
      total: "8,450",
      image: "/luffy.jpg",
      status: "shipping",
    },
    {
      id: "#PEG-2023-9105",
      date: "Nov 01, 2023",
      title: "Charizard VMAX #020",
      description: "Darkness Ablaze • Near Mint • Qty: 2",
      total: "25,800",
      image: "/charizard.jpg",
      status: "payment",
    },
  ],
} satisfies {
  user: typeof ACCOUNT_USER;
  orders: Array<{
    id: string;
    date: string;
    title: string;
    description: string;
    total: string;
    image: string;
    status: "completed" | "shipping" | "payment";
  }>;
};

export const ADDRESS_BOOK_FIXTURE = {
  user: ACCOUNT_USER,
  addresses: [
    {
      name: "Elena Rostova",
      phone: "+1 (555) 019-2837",
      lines: ["1440 Corporate Way, Suite 400", "San Francisco, CA 94107", "United States"],
      isDefault: true,
    },
    {
      name: "Elena Rostova",
      phone: "+1 (555) 837-1102",
      lines: ["829 Logistics Blvd, Warehouse B", "Newark, NJ 07114", "United States"],
      isDefault: false,
    },
  ],
};
