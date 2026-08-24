import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, Plus } from "lucide-react";
import { Field, FieldTitle } from "@/components/ui/field";

export function CheckoutPage() {
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [tempShipping, setTempShipping] = useState<string | null>(null);
  const [tempPayment, setTempPayment] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<string[]>([]);

  const handleShippingOpenChange = (open: boolean) => {
    if (open) setTempShipping(selectedShipping);
    setIsShippingOpen(open);
  };

  const handlePaymentOpenChange = (open: boolean) => {
    if (open) setTempPayment(selectedPayment);
    setIsPaymentOpen(open);
  };

  return (
    <div className="min-h-screen bg-[#f8f8fa] py-10 px-4 flex flex-col items-center">
      <div className="text-center mb-6 flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">Review & Purchase</h1>
        <p className="text-muted-foreground text-sm">Please review your order details below.</p>
      </div>

      <div className="w-full max-w-[600px] flex flex-col gap-6">
        <Card className="rounded-xl border-0 shadow-[0_2px_8px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
          <CardContent className="p-0">
            {/* Item Section */}
            <div className="p-6 flex items-center gap-4">
              <div className="w-[84px] h-[104px] bg-[#f4f4f5] flex items-center justify-center shrink-0 rounded-md border border-border/50">
                 {/* Mock card image based on screenshot colors */}
                 <div className="w-[52px] h-[72px] bg-gradient-to-b from-orange-400 to-yellow-300 border-[3px] border-white shadow-sm flex flex-col">
                    <div className="h-1/2 bg-white/20"></div>
                 </div>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-sm sm:text-base leading-snug text-foreground">
                  MEGA Charizard X ex MA [M2a 223/193] (High Class Pack "MEGA Dream ex")
                </h2>
                <p className="text-[#0066cc] font-medium text-sm mt-1">
                  ฿3,226 <span className="text-muted-foreground font-normal">/ PSA 10</span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Shipping Address */}
            <Dialog open={isShippingOpen} onOpenChange={handleShippingOpenChange}>
              <DialogTrigger className="flex justify-between items-center w-full px-6 py-4 cursor-pointer group hover:bg-muted/30 transition-colors bg-transparent border-0 outline-none text-left">
                <span className="font-medium text-sm text-foreground">Shipping Address</span>
                <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                  <span>{selectedShipping ? selectedShipping : "please enter your address"}</span>
                  <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md gap-6 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    Select address <span className="text-xs text-muted-foreground font-normal">0 of 10</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2">
                  {addresses.length === 0 ? (
                    <div className="flex flex-col items-center py-6 gap-6">
                      <p className="text-sm text-muted-foreground">You don't have any addresses yet.</p>
                      <button 
                        onClick={() => {
                          const newAddr = "123 Mock Street, Bangkok 10110";
                          setAddresses([newAddr]);
                          setTempShipping(newAddr);
                        }}
                        className="w-full border border-dashed border-border rounded-xl p-4 text-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4 text-blue-600" /> Add New Address
                      </button>
                    </div>
                  ) : (
                    <RadioGroup value={tempShipping || ""} onValueChange={setTempShipping} className="gap-3">
                      {addresses.map(addr => (
                        <Field key={addr} orientation="horizontal" className="items-center justify-between rounded-xl border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <FieldTitle className="font-medium text-sm">{addr}</FieldTitle>
                          <RadioGroupItem value={addr} />
                        </Field>
                      ))}
                    </RadioGroup>
                  )}
                </div>
                <DialogFooter className="sm:justify-end">
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto rounded-full px-8 border-gray-300"
                    onClick={() => {
                      if (tempShipping) {
                        setSelectedShipping(tempShipping);
                        setIsShippingOpen(false);
                      } else {
                        setIsShippingOpen(false);
                      }
                    }}
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Separator />

            {/* Payment Method */}
            <Dialog open={isPaymentOpen} onOpenChange={handlePaymentOpenChange}>
              <DialogTrigger className="flex justify-between items-center w-full px-6 py-4 cursor-pointer group hover:bg-muted/30 transition-colors bg-transparent border-0 outline-none text-left">
                <span className="font-medium text-sm text-foreground">Payment Method</span>
                <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                  <span>{selectedPayment === "qr" ? "Qr Payment" : "Not Selected"}</span>
                  <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md gap-6 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-base">Select a payment method</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                  <RadioGroup value={tempPayment || ""} onValueChange={setTempPayment} className="gap-3">
                    <Field orientation="horizontal" className="items-center justify-between rounded-xl border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-black text-white text-[10px] font-bold w-9 h-6 flex items-center justify-center rounded uppercase">QR</div>
                        <FieldTitle className="font-medium text-sm">Qr Payment</FieldTitle>
                      </div>
                      <RadioGroupItem value="qr" />
                    </Field>
                  </RadioGroup>
                </div>
                <div className="mt-2">
                  <Button 
                    className="w-full rounded-full bg-[#0066cc] hover:bg-[#005bb5] text-white font-medium" 
                    onClick={() => {
                      if (tempPayment) {
                        setSelectedPayment(tempPayment);
                        setIsPaymentOpen(false);
                      }
                    }}
                  >
                    CONFIRM
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Separator />

            {/* Breakdown Section */}
            <div className="px-6 py-5 flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Fee</span>
                <span>฿597</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Purchase Fee</span>
                <span>฿113</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Authentication Fee</span>
                <span>฿0</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Duty & Taxes</span>
                <span>Pay at the door</span>
              </div>
            </div>

            <Separator />

            {/* Total Section */}
            <div className="px-6 py-5 flex justify-between items-center">
              <span className="font-bold text-lg text-foreground">Total</span>
              <span className="font-bold text-[28px] font-heading text-foreground">฿3,936</span>
            </div>
          </CardContent>
        </Card>

        <Button 
          disabled={!selectedShipping || !selectedPayment} 
          className="w-full h-[52px] rounded-xl text-base font-semibold disabled:bg-[#e4e4e7] disabled:text-[#a1a1aa] disabled:opacity-100 transition-colors bg-[#0066cc] hover:bg-[#005bb5] text-white"
        >
          Purchase
        </Button>
      </div>
    </div>
  );
}
