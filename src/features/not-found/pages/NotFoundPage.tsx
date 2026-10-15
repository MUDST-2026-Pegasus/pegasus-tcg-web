import { useEffect, useState, type FormEvent } from "react";
import { SearchIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import "./not-found.css";

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
    <section className="not-found-page flex min-h-[620px] flex-col items-center bg-muted px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
      <div className="flex w-full max-w-xl flex-col items-center">
        <div aria-hidden="true" className="not-found-illustration">
          <span className="not-found-digit">4</span>
          <div className="not-found-card-stack">
            <div className="not-found-card-back" />
            <div className="not-found-card-front">
              <div className="not-found-card-art">?</div>
              <div className="not-found-card-line not-found-card-line-long" />
              <div className="not-found-card-line not-found-card-line-short" />
            </div>
          </div>
          <span className="not-found-digit">4</span>
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
