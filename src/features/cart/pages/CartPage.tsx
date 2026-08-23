import { useState } from "react"
import { Lock, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function CartPage() {
  const [items, setItems] = useState([
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
  ])

  const increaseQuantity = (id: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
  }

  const decreaseQuantity = (id: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))
  }

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const toggleCheck = (id: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item))
  }

  const toggleAll = () => {
    const allChecked = items.length > 0 && items.every(item => item.isChecked)
    setItems(prev => prev.map(item => ({ ...item, isChecked: !allChecked })))
  }

  const removeSelected = () => {
    setItems(prev => prev.filter(item => !item.isChecked))
  }

  const formatPrice = (price: number) => `฿${price.toLocaleString()}`

  const checkedItems = items.filter(item => item.isChecked)
  const subtotal = checkedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const shipping = 150
  const total = subtotal > 0 ? subtotal + shipping : 0
  const allChecked = items.length > 0 && items.every(item => item.isChecked)

  return (
    <div className="bg-[#F4F4F5] flex-1 font-sans">
      <main className="max-w-[1200px] w-full mx-auto px-6 py-12 flex flex-col gap-8">
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
                  <Checkbox 
                    id="select-all" 
                    checked={allChecked} 
                    onCheckedChange={toggleAll}
                  />
                  <label htmlFor="select-all" className="text-base font-medium cursor-pointer text-foreground">
                    Select All ({items.length} items)
                  </label>
                </div>
                <button 
                  className="text-[#C62828] text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={removeSelected}
                  disabled={checkedItems.length === 0}
                >
                  Remove Selected
                </button>
              </CardContent>
            </Card>

            {/* Items */}
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border">
                Your cart is empty.
              </div>
            ) : (
              items.map((item) => (
                <Card key={item.id} className="rounded-xl border shadow-none bg-white p-0 !py-0 gap-0">
                  <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex items-center gap-4 sm:gap-6 self-start sm:self-auto h-full mt-2 sm:mt-0">
                      <Checkbox 
                        checked={item.isChecked} 
                        onCheckedChange={() => toggleCheck(item.id)}
                      />
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
                      <button 
                        className="text-[#C62828] text-sm font-medium hover:underline text-left w-fit mt-auto"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:h-32 py-1 w-full sm:w-auto mt-4 sm:mt-0">
                      <div className="text-2xl font-bold text-foreground">{formatPrice(item.price)}</div>
                      <div className="flex items-center rounded-full border border-border px-4 py-1.5 gap-4">
                        <button 
                          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                          onClick={() => decreaseQuantity(item.id)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-4 text-center font-medium">{item.quantity}</span>
                        <button 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => increaseQuantity(item.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="rounded-xl border shadow-none bg-white p-6 !py-6 flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-foreground">Order Summary</h2>
              
              <div className="flex flex-col gap-4 text-base">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Subtotal ({checkedItems.length} items)</span>
                  <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Estimated Shipping</span>
                  <span className="font-medium text-foreground">{subtotal > 0 ? formatPrice(shipping) : "฿0"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Tax</span>
                  <span className="font-medium text-foreground">Included</span>
                </div>
              </div>

              <Separator className="my-2 bg-border/50" />

              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-bold text-foreground">Total</span>
                <span className="text-4xl font-bold text-[#0052cc]">{formatPrice(total)}</span>
              </div>

              <Button 
                className="w-full bg-[#0052cc] hover:bg-[#0052cc]/90 text-white font-semibold text-lg py-6 rounded-full shadow-md"
                disabled={checkedItems.length === 0}
              >
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
    </div>
  )
}
