import { useEffect, useState, type FormEvent } from "react";
import { SearchIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

const quickLinks = [
  { label: "Pokémon", to: "/pokemon" },
  { label: "One Piece", to: "/one-piece" },
  { label: "ตะกร้าสินค้า", to: "/cart" },
  { label: "เกี่ยวกับเรา", to: "/about" },
];

export function NotFoundPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "ไม่พบหน้านี้ | Pegasus TCG";
    return () => { document.title = previousTitle; };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  }

  return (
    <section className="flex min-h-[620px] flex-col items-center bg-muted px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
      <div className="flex w-full max-w-xl flex-col items-center">
        <div aria-hidden="true" className="flex h-40 items-center justify-center gap-2 sm:h-[190px] sm:gap-5">
          <span className="text-[104px] font-black leading-none tracking-[-0.04em] text-primary sm:text-[148px]">4</span>
          <div className="relative h-[142px] w-[120px] shrink-0 sm:h-[190px] sm:w-40">
            <div className="absolute left-2 top-3 h-[120px] w-[86px] -rotate-9 rounded-xl border-[1.5px] border-border bg-card sm:left-2 sm:top-4 sm:h-[156px] sm:w-28" />
            <div className="absolute left-7 top-2 h-[120px] w-[86px] rotate-6 rounded-xl border-[2.5px] border-primary bg-card shadow-lg sm:left-9 sm:top-3 sm:h-[156px] sm:w-28">
              <div className="absolute inset-x-1.5 top-1.5 flex h-[79px] items-center justify-center rounded-lg bg-primary/10 text-[44px] font-black text-primary sm:inset-x-2 sm:top-2 sm:h-[104px] sm:text-[56px]">?</div>
              <div className="absolute bottom-5 left-2 h-1.5 w-1/2 rounded-full bg-border sm:bottom-6" />
              <div className="absolute bottom-2.5 left-2 h-1.5 w-1/3 rounded-full bg-border sm:bottom-3" />
            </div>
          </div>
          <span className="text-[104px] font-black leading-none tracking-[-0.04em] text-primary sm:text-[148px]">4</span>
        </div>

        <div className="mt-7 space-y-2.5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">ERROR 404 · PAGE NOT FOUND</p>
          <h1 className="text-2xl font-bold text-foreground sm:text-[30px]">ไม่พบหน้าที่คุณกำลังหา</h1>
          <p className="text-sm leading-[1.6] text-muted-foreground">
            การ์ดใบนี้อาจถูกย้ายไปที่อื่น ถูกลบไปแล้ว หรือลิงก์อาจพิมพ์ผิด<br className="hidden sm:block" />
            ลองค้นหาสิ่งที่ต้องการอีกครั้ง หรือกลับไปเริ่มที่หน้าแรก
          </p>
        </div>

        <form onSubmit={handleSearch} role="search" className="mt-8 w-full max-w-[400px]">
          <InputGroup className="h-10 rounded-lg border-input bg-background">
            <InputGroupAddon className="pl-2 text-muted-foreground"><SearchIcon className="size-4" /></InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="ค้นหาการ์ด สินค้า หรือร้านค้า"
              placeholder="ค้นหาการ์ด สินค้า หรือร้านค้า"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="text-sm"
            />
          </InputGroup>
        </form>

        <div className="mt-4 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button size="lg" role="link" nativeButton={false} render={<Link to="/" />}>กลับหน้าแรก</Button>
          <Button size="lg" variant="outline" role="link" nativeButton={false} render={<Link to="/products" />}>ดูสินค้าทั้งหมด</Button>
        </div>

        <nav aria-label="ลิงก์ลัด" className="mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[13px]">
          <span className="mr-1 text-muted-foreground">หรือไปที่</span>
          {quickLinks.map(({ label, to }) => (
            <Button key={to} variant="link" size="sm" role="link" nativeButton={false} render={<Link to={to} />} className="px-2.5 no-underline">
              {label}
            </Button>
          ))}
        </nav>
      </div>
    </section>
  );
}
