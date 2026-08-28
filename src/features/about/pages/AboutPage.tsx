import aboutHero from "@/assets/about/about-hero.jpeg";
import ourStory from "@/assets/about/our-story.jpeg";
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
            Empowering the TCG Community
          </h1>
          <p className="mt-6 max-w-[768px] text-base leading-6 text-muted-foreground">
            Pegasus TCG is the premier destination for collectors, players, and
            enthusiasts. We provide a secure, efficient, and transparent
            marketplace to discover, trade, and track the value of your most
            prized trading cards.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-16 sm:px-12 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl leading-8 font-bold text-foreground">
              Our Story
            </h2>
            <p className="text-base leading-6 text-muted-foreground">
              What began as a passionate group of local hobbyists trading cards
              over weekend tournaments has evolved into Pegasus TCG. We
              experienced firsthand the friction of fragmented marketplaces,
              inconsistent grading standards, and opaque pricing.
            </p>
            <p className="text-base leading-6 text-muted-foreground">
              Driven by a desire to bring clarity and trust to the hobby we
              love, we built Pegasus. Our goal was simple: create the platform
              we wished existed when we started collecting. Today, we stand as
              a leading marketplace, empowering thousands of collectors
              worldwide.
            </p>
          </div>
          <Card className="rounded-xl p-px shadow-sm [--card-spacing:0px]">
            <CardContent className="p-0">
              <img
                src={ourStory}
                alt="Pegasus team collaborating in an office"
                className="aspect-video w-full object-cover"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pt-12 pb-16 sm:px-12 lg:pt-[46px] lg:pb-14">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl leading-8 font-bold text-foreground">
            Meet the Team
          </h2>
          <p className="max-w-[672px] text-base leading-6 text-muted-foreground">
            The dedicated professionals working behind the scenes to elevate
            your collecting experience.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {aboutTeam.map((member, index) => (
            <article
              key={`${member.name}-${index}`}
              className="flex flex-col items-center text-center"
            >
              <Avatar className="size-32 shadow-sm">
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
import { useEffect } from "react";
