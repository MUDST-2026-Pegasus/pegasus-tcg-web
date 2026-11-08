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
          <h1 className="text-[32px] leading-10 font-bold tracking-[-0.64px] text-foreground">
            เติบโตไปด้วยกันกับชุมชน TCG
          </h1>
          <p className="mt-6 max-w-[768px] text-base leading-6 text-muted-foreground">
            Pegasus TCG คือพื้นที่สำหรับนักสะสม ผู้เล่น และคนรักการ์ด
            ที่คุณสามารถค้นหา ซื้อขาย และติดตามมูลค่าการ์ดใบโปรดได้
            บนแพลตฟอร์มที่ปลอดภัย สะดวก และโปร่งใส
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-16 sm:px-12 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl leading-8 font-bold text-foreground">
              เรื่องราวของเรา
            </h2>
            <p className="text-base leading-6 text-muted-foreground">
              Pegasus TCG เริ่มต้นจากกลุ่มคนรักการ์ดที่แลกเปลี่ยนการ์ดกัน
              ในการแข่งขันช่วงสุดสัปดาห์ เราเคยพบกับความยุ่งยากในการซื้อขาย
              ทั้งแหล่งซื้อขายที่กระจัดกระจาย มาตรฐานการประเมินที่แตกต่างกัน
              และราคาที่ไม่ชัดเจน
            </p>
            <p className="text-base leading-6 text-muted-foreground">
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
          <h2 className="text-2xl leading-8 font-bold text-foreground">
            พบกับทีมงาน
          </h2>
          <p className="max-w-[672px] text-base leading-6 text-muted-foreground">
            พบกับทีมงานเบื้องหลังกองทัพ Pegasus ผู้ร่วมสร้างประสบการณ์
            การสะสมการ์ดให้ดียิ่งขึ้น
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {aboutTeam.map((member, index) => (
            <article
              key={`${member.name}-${index}`}
              className="flex flex-col items-center text-center"
            >
              <Avatar className="size-40 shadow-sm sm:size-44">
                <AvatarImage src={member.image} alt={member.name} />
                <AvatarFallback>
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-4 text-lg leading-6 font-bold text-foreground">
                {member.name}
              </h3>
              <p className="mt-1 text-xs leading-4 font-medium text-primary">
                {member.role}
              </p>
              <p className="mt-3 max-w-[278px] text-sm leading-5 text-muted-foreground">
                {member.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
