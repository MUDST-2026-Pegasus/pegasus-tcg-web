import { Star } from "lucide-react";
import { useEffect } from "react";
import aboutHero from "@/assets/about/about-hero.jpeg";
import teamGroup from "@/assets/about/team-group.jpeg";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { aboutTeam } from "@/features/about/about.fixture";
import { cn } from "@/lib/utils";

const SENIOR_TITLE = /\b(FOUNDER|CEO|LEAD|SENIOR|EXPERT)\b/;
const ASSOCIATE_TITLE = /\bASSOCIATE\b/;

function seniorTitlesFirst(role: string) {
  return role
    .split(" · ")
    .sort(
      (a, b) => Number(SENIOR_TITLE.test(b)) - Number(SENIOR_TITLE.test(a)),
    );
}

export function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-muted">
        <img
          src={aboutHero}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-10"
        />
        <div className="relative mx-auto flex min-h-[304px] max-w-[1280px] flex-col items-center justify-center px-6 py-16 text-center sm:px-12 sm:py-24">
          <h1 className="text-[clamp(1.75rem,2vw_+_1rem,2.25rem)] leading-tight font-bold text-foreground">
            เติบโตไปด้วยกันกับชุมชน TCG
          </h1>
          <p className="mt-6 max-w-[768px] text-[clamp(1rem,0.3vw_+_0.95rem,1.125rem)] leading-relaxed text-foreground/80">
            Pegasus TCG คือพื้นที่สำหรับนักสะสม ผู้เล่น และคนรักการ์ด
            ที่คุณสามารถค้นหา ซื้อขาย และติดตามมูลค่าการ์ดใบโปรดได้
            บนแพลตฟอร์มที่ปลอดภัย สะดวก และโปร่งใส
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-16 sm:px-12 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-[clamp(1.5rem,1vw_+_1.25rem,1.875rem)] leading-tight font-bold text-foreground">
              เรื่องราวของเรา
            </h2>
            <p className="text-[clamp(1rem,0.3vw_+_0.95rem,1.125rem)] leading-relaxed text-foreground/80">
              Pegasus TCG เริ่มต้นจากกลุ่มคนรักการ์ดที่แลกเปลี่ยนการ์ดกัน
              ในการแข่งขันช่วงสุดสัปดาห์ เราเคยพบกับความยุ่งยากในการซื้อขาย
              ทั้งแหล่งซื้อขายที่กระจัดกระจาย มาตรฐานการประเมินที่แตกต่างกัน
              และราคาที่ไม่ชัดเจน
            </p>
            <p className="text-[clamp(1rem,0.3vw_+_0.95rem,1.125rem)] leading-relaxed text-foreground/80">
              เราจึงสร้าง Pegasus ขึ้นด้วยความตั้งใจที่จะทำให้งานอดิเรกที่เรารัก
              โปร่งใสและน่าเชื่อถือยิ่งขึ้น เป้าหมายของเราเรียบง่าย:
              สร้างแพลตฟอร์มที่เราเองก็อยากมีตั้งแต่เริ่มสะสมการ์ด
              และเป็นพื้นที่ให้ชุมชนนักสะสมได้เติบโตไปด้วยกัน
            </p>
          </div>
          <Card className="overflow-hidden rounded-xl p-px shadow-sm [--card-spacing:0px]">
            <CardContent className="p-0">
              <img
                src={teamGroup}
                alt="ภาพประกอบทีม Pegasus ในบรรยากาศกรีกโบราณ"
                className="aspect-video w-full object-cover"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pt-12 pb-16 sm:px-12 lg:pt-[46px] lg:pb-14">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-[clamp(1.5rem,1vw_+_1.25rem,1.875rem)] leading-tight font-bold text-foreground">
            พบกับทีมงาน
          </h2>
          <p className="max-w-[672px] text-[clamp(1rem,0.3vw_+_0.95rem,1.125rem)] leading-relaxed text-foreground/80">
            พบกับทีมงานเบื้องหลังกองทัพ Pegasus ผู้ร่วมสร้างประสบการณ์
            การสะสมการ์ดให้ดียิ่งขึ้น
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-x-12 sm:grid-cols-2 xl:grid-cols-4">
          {aboutTeam.map((member, index) => (
            <article
              key={`${member.name}-${index}`}
              className="@container flex min-w-0 flex-col items-center pb-14 text-center"
            >
              <Avatar
                className={cn(
                  "size-40 shadow-sm sm:size-44",
                  member.stars >= 4 &&
                    "ring-4 ring-amber-400 ring-offset-2 ring-offset-background",
                )}
              >
                <AvatarImage src={member.image} alt={member.name} />
                <AvatarFallback>
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-5 whitespace-nowraptext-[clamp(0.75rem,5.5cqw,1.25rem)] leading-snug font-bold text-foreground">
                {member.name}
              </h3>
              <div className="mt-3 flex flex-col items-center gap-2">
                <div
                  role="img"
                  aria-label={`ยศ ${member.stars} ดาว`}
                  className="flex items-center gap-0.5"
                >
                  {Array.from({ length: member.stars }, (_, star) => (
                    <Star
                      key={star}
                      aria-hidden
                      className="size-5 fill-amber-400 text-amber-500 drop-shadow-sm"
                    />
                  ))}
                </div>
                <ul className="flex flex-col items-center gap-1.5 sm:min-h-[5.75rem]">
                  {seniorTitlesFirst(member.role).map((title) => {
                    const isSenior = SENIOR_TITLE.test(title);
                    return (
                      <li
                        key={title}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs leading-snug font-bold tracking-wide",
                          isSenior
                            ? "bg-linear-to-r from-amber-300 via-yellow-200 to-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-500/50"
                            : ASSOCIATE_TITLE.test(title)
                              ? "bg-linear-to-r from-slate-300 via-slate-100 to-slate-400 text-slate-800 shadow-sm ring-1 ring-slate-400/60"
                              : "bg-linear-to-r from-sky-300 via-cyan-100 to-blue-300 text-blue-950 shadow-sm ring-1 ring-sky-500/50",
                        )}
                      >
                        {isSenior && (
                          <Star aria-hidden className="size-3 shrink-0 fill-current" />
                        )}
                        {title}
                        {isSenior && (
                          <Star aria-hidden className="size-3 shrink-0 fill-current" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-foreground/70">
                {member.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
