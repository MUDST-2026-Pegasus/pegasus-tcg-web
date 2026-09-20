export const ACCOUNT_USER = {
  initials: "SJ",
  name: "Somchai Jaidee",
  email: "somchai.j@example.com",
};

/**
 * Fixture สำหรับ Order History — จะถูกลบออกเมื่อทำ ACC-04
 */
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
