import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Handshake,
  ShieldCheck,
  Users,
} from 'lucide-react';
import skillbridgeLogo from '../assets/skillbridge_logo.png';
import userGroup from '../assets/user_group.png';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navbar */}
      <nav className={`fixed top-0 left-0 right-0 bg-white z-50 transition-shadow ${scrolled ? 'border-b border-gray-200' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" aria-label="Skill Bridge home" className="h-7 flex items-center">
            <img
              src={skillbridgeLogo}
              alt="Skill Bridge"
              className="h-14 w-auto max-w-none object-contain"
            />
          </Link>
          <div className="flex gap-8 items-center">
            <button 
              onClick={() => scrollToSection('success-stories')}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Our Stories
            </button>
            <button 
              onClick={() => scrollToSection('exchange')}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              The Exchange
            </button>
            <button 
              onClick={() => scrollToSection('journey')}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Community Journey
            </button>
            <Link
              to="/login"
              className="bg-emerald-700 text-white px-6 py-2 rounded-full text-sm hover:bg-emerald-800 transition-colors"
            >
              Join the Community
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white px-6 pb-24 pt-36 sm:pb-28 sm:pt-40">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `
              radial-gradient(circle 600px at 0% 200px, #bbf7d0, transparent),
              radial-gradient(circle 600px at 100% 200px, #bbf7d0, transparent)
            `,
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="mb-7 text-xs font-medium uppercase tracking-[0.22em] text-emerald-700 sm:text-sm">
            A Human-Centered Campus Economy
          </p>
          <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.05] tracking-[-0.035em] text-gray-900 sm:text-6xl lg:text-7xl">
            Trade your skills. Build real experience.{' '}
            <span className="text-emerald-800">Grow together.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
            Join a trusted student community where skills become opportunities,
            ideas become projects, and every collaboration helps build your
            professional reputation.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="rounded-full bg-emerald-700 px-8 py-3 text-white transition-all hover:scale-105 hover:bg-emerald-800"
            >
              Get Started
            </Link>
            <button
              onClick={() => scrollToSection('exchange')}
              className="flex items-center gap-2 px-8 py-3 text-emerald-700 transition-all hover:translate-x-1 hover:text-emerald-900"
            >
              How we exchange <span>→</span>
            </button>
          </div>
          <div className="mx-auto mt-10 flex w-fit items-center gap-4 text-left">
            <img
              src={userGroup}
              alt="SkillBridge student community"
              className="h-10 w-auto object-contain sm:h-11"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                A community of verified students
              </p>
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                Collaborate, contribute, and grow your reputation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories Section */}
      <section
        id="success-stories"
        className="relative overflow-hidden border-t border-emerald-800 bg-emerald-900 px-6 py-16 sm:py-20 lg:py-22"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald-600/15 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-700/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)`,
              backgroundSize: '72px 72px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Success Stories
            </p>
            <h2 className="text-4xl font-medium leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              Where ambition meets{' '}
              <span className="italic text-emerald-200">opportunity.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-emerald-100/75 sm:text-lg sm:leading-8">
              See how students are earning, collaborating, building portfolios,
              and growing their reputation through SkillBridge.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <article className="group flex h-full flex-col rounded-3xl border border-white/70 bg-white p-6 shadow-[0_20px_55px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-2 hover:border-emerald-300 hover:shadow-[0_26px_70px_rgba(16,185,129,0.18)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  Paid Opportunity
                </span>
                <BadgeCheck
                  className="text-emerald-600"
                  size={23}
                  strokeWidth={1.8}
                />
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold text-white ring-4 ring-emerald-50">
                  CS
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Computer Science Student
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Verified SkillBridge member
                  </p>
                </div>
              </div>

              <div className="my-5 h-px bg-gray-200" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  What they did
                </p>
                <p className="mt-2 text-lg font-semibold leading-snug text-gray-900">
                  Built websites for student founders.
                </p>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Outcome
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Earned income while building a professional portfolio with
                  real client work.
                </p>
              </div>

              <div className="mt-auto pt-6">
                <div className="rounded-2xl bg-emerald-900 px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">
                    Highlight
                  </p>
                  <p className="mt-1 text-xl font-semibold">$850 Earned</p>
                </div>
              </div>
            </article>

            <article className="group flex h-full flex-col rounded-3xl border border-white/70 bg-white p-6 shadow-[0_20px_55px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-2 hover:border-emerald-300 hover:shadow-[0_26px_70px_rgba(16,185,129,0.18)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  Skill Credits
                </span>
                <BadgeCheck
                  className="text-emerald-600"
                  size={23}
                  strokeWidth={1.8}
                />
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold text-white ring-4 ring-emerald-50">
                  MS
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Marketing Student
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Verified SkillBridge member
                  </p>
                </div>
              </div>

              <div className="my-5 h-px bg-gray-200" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  What they did
                </p>
                <p className="mt-2 text-lg font-semibold leading-snug text-gray-900">
                  Completed multiple projects for campus organizations.
                </p>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Outcome
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Earned Skill Credits, strengthened their reputation, and
                  unlocked new opportunities.
                </p>
              </div>

              <div className="mt-auto pt-6">
                <div className="rounded-2xl bg-emerald-900 px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">
                    Highlight
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    420 Credits Earned
                  </p>
                </div>
              </div>
            </article>

            <article className="group flex h-full flex-col rounded-3xl border border-white/70 bg-white p-6 shadow-[0_20px_55px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-2 hover:border-emerald-300 hover:shadow-[0_26px_70px_rgba(16,185,129,0.18)] md:col-span-2 lg:col-span-1 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  Skill Exchange
                </span>
                <BadgeCheck
                  className="text-emerald-600"
                  size={23}
                  strokeWidth={1.8}
                />
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold text-white ring-4 ring-emerald-50">
                  DS
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Design Student
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Verified SkillBridge member
                  </p>
                </div>
              </div>

              <div className="my-5 h-px bg-gray-200" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  What they did
                </p>
                <p className="mt-2 text-lg font-semibold leading-snug text-gray-900">
                  Exchanged branding expertise for technical mentorship.
                </p>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Outcome
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Expanded their technical skills and built valuable industry
                  connections through collaboration.
                </p>
              </div>

              <div className="mt-auto pt-6">
                <div className="rounded-2xl bg-emerald-900 px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">
                    Highlight
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    New Career Network
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Journey of Collaboration Section */}
      <section
        id="journey"
        className="border-t border-gray-200 bg-[#F7F8F4] px-6 py-20 sm:py-24 lg:py-28"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div className="relative mx-auto w-full max-w-2xl">
            <div className="absolute -inset-4 rotate-[1.5deg] rounded-[2.5rem] bg-emerald-900/[0.045] sm:-inset-6" />

            <div className="relative rounded-[2rem] border border-emerald-900/10 bg-white px-6 py-9 shadow-[0_10px_35px_rgba(6,78,59,0.05)] sm:px-9 sm:py-10 lg:px-10">
              <h2 className="mb-8 text-3xl font-light italic leading-tight text-gray-900 sm:text-[2.25rem] lg:text-[2.4rem]">
                Your journey of collaboration.
              </h2>

              <div className="space-y-8">
                <div className="group flex gap-5 sm:gap-7">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-emerald-700/40 bg-emerald-50/60 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                    <BookOpen size={21} strokeWidth={1.8} />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">
                      <span className="mr-2 text-emerald-800">01.</span>
                      Share Your Gift
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                      List what you know. Whether it is development, design, writing,
                      or planning, your expertise has value.
                    </p>
                  </div>
                </div>

                <div className="group flex gap-5 sm:gap-7">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-emerald-700/40 bg-emerald-50/60 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                    <Users size={22} strokeWidth={1.8} />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">
                      <span className="mr-2 text-emerald-800">02.</span>
                      Find Your Ask
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                      Find verified students whose skills complement your goals,
                      then connect around meaningful opportunities.
                    </p>
                  </div>
                </div>

                <div className="group flex gap-5 sm:gap-7">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-emerald-700/40 bg-emerald-50/60 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                    <Handshake size={22} strokeWidth={1.8} />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">
                      <span className="mr-2 text-emerald-800">03.</span>
                      Exchange &amp; Grow
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                      Collaborate through a secure workspace, exchange value, gain
                      experience, and build a reputation that lasts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="exchange" className="lg:pl-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-800">
              The Philosophy
            </p>

            <h2 className="mt-6 text-4xl font-light leading-[1.08] tracking-[-0.025em] text-gray-900 sm:text-[2.75rem] lg:text-[3.15rem]">
              Built on trust,
              <span className="block italic text-emerald-800">
                scaled with technology.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
              SkillBridge is more than a marketplace. It combines the rigor of
              academic excellence with modern collaboration tools, creating a
              trusted space where students can learn, contribute, and thrive
              professionally.
            </p>

            <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-8">
              <div>
                <BadgeCheck
                  className="text-emerald-700"
                  size={27}
                  strokeWidth={1.8}
                />
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  Student First
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Every feature is designed around the academic lifecycle and
                  real student ambitions.
                </p>
              </div>

              <div>
                <ShieldCheck
                  className="text-emerald-700"
                  size={27}
                  strokeWidth={1.8}
                />
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  Safe Haven
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Verified identities help ensure you collaborate with genuine
                  students in a trusted community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Pattern Background */}
      <section className="relative overflow-hidden border-t border-emerald-800 bg-emerald-900 px-6 py-20 sm:py-24 lg:py-26">
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.075) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.075) 1px, transparent 1px)`,
            backgroundSize: '96px 96px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-7 flex h-18 w-18 items-center justify-center rounded-full border border-white/15 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-sm">
            <GraduationCap size={32} strokeWidth={1.7} />
          </div>

          <h2 className="mx-auto max-w-4xl text-5xl font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
            Begin your campus legacy today.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-emerald-100/85 sm:text-lg sm:leading-8">
            Join the ethical skill economy of your university. It&apos;s time to
            turn your classroom knowledge into community value.
          </p>

          <Link
            to="/login"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-10 py-4 font-semibold text-emerald-900 transition-all hover:scale-[1.03] hover:bg-emerald-50"
          >
            Register with University Email
          </Link>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/50">
            No fees. Only growth.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-light mb-6">Skill bridge</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Designed for students. By students. Join an ecosystem built to connect classroom knowledge into community value.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide text-gray-500">Community</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-700 hover:text-emerald-700">Success Stories</a></li>
                <li><a href="#" className="text-gray-700 hover:text-emerald-700">Campus Hubs</a></li>
                <li><a href="#" className="text-gray-700 hover:text-emerald-700">Safety Guide</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide text-gray-500">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-700 hover:text-emerald-700">Legal Journals</a></li>
                <li><a href="#" className="text-gray-700 hover:text-emerald-700">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-700 hover:text-emerald-700">Terms of Use</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide text-gray-500">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                  <span className="text-gray-600">𝕏</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                  <span className="text-gray-600">in</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 flex justify-between items-center text-sm text-gray-500">
            <p>© 2026 Skill Bridge. All rights Reserved.</p>
            <div className="flex gap-4">
              <button className="hover:text-emerald-700">↑</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
