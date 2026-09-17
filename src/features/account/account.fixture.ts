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
