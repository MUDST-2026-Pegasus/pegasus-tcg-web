import registerBackground from "@/assets/auth/register-background.jpg";
import registerHeader from "@/assets/auth/register-header.jpg";

export const STORE_PROFILE_FIXTURE = {
  store: {
    initials: "Nx",
    name: "Nx Gallery - Card Game & Board Game Cafe",
    coverImage: registerHeader,
    coverImageAlt: "Nx Gallery store interior",
  },
  stats: [
    { key: "products", label: "Products", value: "971", detail: undefined },
    { key: "followers", label: "Followers", value: "49.6k", detail: undefined },
    { key: "rating", label: "Rating", value: "4.9", detail: "(169.5k)" },
    { key: "chat", label: "Chat Performance", value: "99%", detail: undefined },
    { key: "joined", label: "Joined", value: "8 years ago", detail: undefined },
  ],
  tabs: ["Home", "All Products", "Sale (Clearance)", "New Arrivals", "Beyblade X", "Pokémon"],
  products: [
    { name: "Mega Evolution Pitch Black Booster Box [ENG]", price: "฿2,450", category: "Sealed", image: registerHeader },
    { name: "Pokemon Booster Box (Thai)", price: "฿1,800", category: "Sealed", image: registerBackground },
    { name: "Disney Lorcana Booster Box", price: "฿4,200", category: "Sealed", image: registerHeader },
    { name: "Dragon Shield Matte Sleeves", price: "฿350", category: "Accessories", image: registerBackground },
    { name: "[BOT] Battle of Talingchan - Kudson Deck", price: "฿290", category: "Deck", image: registerBackground },
  ],
} as const;
