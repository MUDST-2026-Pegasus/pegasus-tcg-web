import { Search, ShoppingCart, User, Lock, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function CartPage() {
  const cartItems = [
    {
      id: 1,
      name: "Charizard VMAX #020",
      description: "Darkness Ablaze • Near Mint",
      seller: "CardVaultBKK",
      price: "฿12,900",
      quantity: 1,
      image: "/charizard.jpg", // Mock image path
    },
    {
      id: 2,
      name: "Monkey D. Luffy OP01-003",
      description: "Romance Dawn • Near Mint",
      seller: "Grand Line Cards",
      price: "฿8,450",
      quantity: 1,
      image: "/luffy.jpg", // Mock image path
    }
  ]

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col font-sans">
      {/* Header */}
      <header className="border-b bg-[#F4F4F5] border-border/50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold text-[#0052cc] uppercase tracking-wider">PEGASUS</div>
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground">HOME</a>
            <a href="#" className="hover:text-foreground">ALL PRODUCTS</a>
            <a href="#" className="hover:text-foreground">SALE</a>
            <a href="#" className="hover:text-foreground">NEW ARRIVALS</a>
            <a href="#" className="hover:text-foreground">POKEMON</a>
            <a href="#" className="hover:text-foreground">ONE PIECE</a>
          </nav>
          <div className="flex items-center gap-6 text-[#0052cc]">
            <Search className="w-5 h-5 cursor-pointer" />
            <ShoppingCart className="w-5 h-5 cursor-pointer" />
            <User className="w-5 h-5 cursor-pointer" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-foreground">Shopping Cart</h1>
          <p className="text-muted-foreground text-lg">Review your items and complete your purchase.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Select All */}
            <Card className="rounded-xl border shadow-none bg-white p-0 !py-0 gap-0">
              <CardContent className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox id="select-all" defaultChecked />
                  <label htmlFor="select-all" className="text-base font-medium cursor-pointer text-foreground">
                    Select All (2 items)
                  </label>
                </div>
                <button className="text-[#C62828] text-sm font-medium hover:underline">
                  Remove Selected
                </button>
              </CardContent>
            </Card>

            {/* Items */}
            {cartItems.map((item) => (
              <Card key={item.id} className="rounded-xl border shadow-none bg-white p-0 !py-0 gap-0">
                <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="flex items-center gap-4 sm:gap-6 self-start sm:self-auto h-full mt-2 sm:mt-0">
                    <Checkbox defaultChecked />
                    <div className="w-24 h-32 bg-[#F9F9F9] border border-border/50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between h-32 py-1 w-full">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-xl text-foreground">{item.name}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                      <p className="text-sm mt-1 text-foreground">
                        Seller: <a href="#" className="text-[#0052cc] hover:underline">{item.seller}</a>
                      </p>
                    </div>
                    <button className="text-[#C62828] text-sm font-medium hover:underline text-left w-fit mt-auto">
                      Remove
                    </button>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:h-32 py-1 w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="text-2xl font-bold text-foreground">{item.price}</div>
                    <div className="flex items-center rounded-full border border-border px-4 py-1.5 gap-4">
                      <button className="text-muted-foreground hover:text-foreground">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-4 text-center font-medium">{item.quantity}</span>
                      <button className="text-muted-foreground hover:text-foreground">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="rounded-xl border shadow-none bg-white p-6 !py-6 flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-foreground">Order Summary</h2>
              
              <div className="flex flex-col gap-4 text-base">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Subtotal (2 items)</span>
                  <span className="font-medium text-foreground">฿21,350</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Estimated Shipping</span>
                  <span className="font-medium text-foreground">฿150</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Tax</span>
                  <span className="font-medium text-foreground">Included</span>
                </div>
              </div>

              <Separator className="my-2 bg-border/50" />

              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-bold text-foreground">Total</span>
                <span className="text-4xl font-bold text-[#0052cc]">฿21,500</span>
              </div>

              <Button className="w-full bg-[#0052cc] hover:bg-[#0052cc]/90 text-white font-semibold text-lg py-6 rounded-full shadow-md">
                Proceed to Checkout
              </Button>

              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium mt-2">
                <Lock className="w-4 h-4" />
                <span>Secure Checkout Guarantee</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-[#F4F4F5] border-border/50 py-10 mt-auto">
         <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
               <div className="text-2xl font-bold text-[#0052cc] uppercase tracking-wider">PEGASUS</div>
               <p className="text-xs text-muted-foreground font-medium">© 2026 PEGASUS TCG. ALL RIGHTS RESERVED.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-sm text-muted-foreground font-medium">
               <a href="#" className="hover:text-foreground hover:underline underline-offset-4">Terms of Service</a>
               <a href="#" className="hover:text-foreground hover:underline underline-offset-4">Privacy Policy</a>
               <a href="#" className="hover:text-foreground hover:underline underline-offset-4">Shipping Info</a>
               <a href="#" className="hover:text-foreground hover:underline underline-offset-4">Authenticity Guarantee</a>
               <a href="#" className="hover:text-foreground hover:underline underline-offset-4">Contact Us</a>
            </div>
         </div>
      </footer>
    </div>
  )
}
