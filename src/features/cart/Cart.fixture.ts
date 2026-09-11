export interface CartItem {
  id: number;
  name: string;
  description: string;
  seller: string;
  price: number;
  quantity: number;
  isChecked: boolean;
  image: string;
}

export const CART_PAGE_FIXTURE: {
  items: CartItem[];
  shippingCost: number;
} = {
  items: [
    {
      id: 1,
      name: "Charizard VMAX #020",
      description: "Darkness Ablaze • Near Mint",
      seller: "CardVaultBKK",
      price: 12900,
      quantity: 1,
      isChecked: true,
      image: "/charizard.jpg",
    },
    {
      id: 2,
      name: "Monkey D. Luffy OP01-003",
      description: "Romance Dawn • Near Mint",
      seller: "Grand Line Cards",
      price: 8450,
      quantity: 1,
      isChecked: true,
      image: "/luffy.jpg",
    }
  ],
  shippingCost: 150,
};

export const CHECKOUT_PAGE_FIXTURE = {
  item: {
    name: 'MEGA Charizard X ex MA [M2a 223/193] (High Class Pack "MEGA Dream ex")',
    price: "฿3,226",
    condition: "PSA 10",
  },
  fees: {
    shipping: "฿597",
    purchase: "฿113",
    authentication: "฿0",
    taxes: "Pay at the door",
    total: "฿3,936",
  },
  addresses: [
    "123 Mock Street, Bangkok 10110",
  ]
} satisfies {
  item: {
    name: string;
    price: string;
    condition: string;
  };
  fees: {
    shipping: string;
    purchase: string;
    authentication: string;
    taxes: string;
    total: string;
  };
  addresses: string[];
};
