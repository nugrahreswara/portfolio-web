import { Navbar } from "@/components/Navbar";
import { PhotoBand } from "@/components/StagePanel";
import { HeroSection } from "@/components/Hero";
import { About } from "@/components/About";
import { Experience, Education } from "@/components/Experience";
import { Skills, Stats } from "@/components/Skills";
import { Achievements, Credentials, Projects } from "@/components/Sections";
import { Contact, Footer } from "@/components/Contact";
import { getPortfolioData } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getPortfolioData();
  return (
    <>
      <Navbar profile={data.profile} />
      <main className="page-margin mx-auto max-w-[1400px] pb-10">
        <HeroSection profile={data.profile} />
        <PhotoBand />
        <div className="mx-auto max-w-[920px]">
          <About profile={data.profile} />
          <Stats />
          <Experience items={data.experiences} />
          <Education items={data.educations} />
          <Skills groups={data.skillGroups} />
          <Projects items={data.projects} />
          <Achievements items={data.achievements} />
          <Credentials certifications={data.certifications} trainings={data.trainings} />
          <Contact profile={data.profile} />
        </div>
        <Footer profile={data.profile} />
      </main>
    </>
  );
}
