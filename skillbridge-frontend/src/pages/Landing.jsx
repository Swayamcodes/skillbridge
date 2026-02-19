import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
          <h1 className="text-xl font-light tracking-wide">Skill bridge</h1>
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
      <div className="pt-32 pb-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-600 mb-6 tracking-wide uppercase">A Human-Centered Campus Economy</p>
          <h2 className="text-6xl font-light mb-4 leading-tight">
            Trade Skills.
          </h2>
          <h2 className="text-6xl italic font-light mb-4 leading-tight text-emerald-800">
            Earn Together.
          </h2>
          <h2 className="text-6xl font-light mb-8 leading-tight">
            Build the Future.
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Move beyond the transaction. Join a prestigious network of verified students building real-world projects through mentorship and meaningful skill exchange.
          </p>
          <div className="flex gap-4 justify-center items-center">
            <Link
              to="/login"
              className="bg-emerald-700 text-white px-8 py-3 rounded-full hover:bg-emerald-800 transition-all hover:scale-105"
            >
              Get Started
            </Link>
            <button
              onClick={() => scrollToSection('exchange')}
              className="text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-2"
            >
              How we exchange <span>→</span>
            </button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-3 text-sm text-gray-500">
            <p className="uppercase tracking-wide">Verified Contributors</p>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
              <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
              <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white"></div>
            </div>
            <p>Join 2,440+ students building their legacy</p>
          </div>
        </div>
      </div>

      {/* Success Stories Section */}
      <div id="success-stories" className="bg-white py-20 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Our Success Stories</p>
              <h2 className="text-4xl font-light">
                Where ambition meets
              </h2>
              <h2 className="text-4xl italic font-light text-emerald-800">
                opportunity.
              </h2>
            </div>
            <button className="text-sm text-emerald-700 hover:text-emerald-900">
              View all journals →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-12 mb-4 h-80 flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="text-center text-white">
                  <div className="text-6xl font-light mb-4 opacity-50">SUCCESS</div>
                  <div className="w-16 h-1 bg-white mx-auto"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span className="uppercase tracking-wide">Web Development</span>
              </div>
              <h3 className="text-xl font-light mb-2">Elena Richardson</h3>
              <p className="text-sm text-gray-500 mb-2 italic">Computer Science</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Exchanged frontend coding for professional photography. Now running a fullservice creative agency.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg p-12 mb-4 h-80 flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="text-center text-white">
                  <h3 className="text-5xl font-bold mb-4">SUCCESS</h3>
                  <p className="text-sm uppercase tracking-wider">...small marginal</p>
                  <p className="text-sm uppercase tracking-wider">safe bets never</p>
                  <p className="text-sm uppercase tracking-wider">win big...</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span className="uppercase tracking-wide">Financial Literacy</span>
              </div>
              <h3 className="text-xl font-light mb-2">David Chen</h3>
              <p className="text-sm text-gray-500 mb-2 italic">Economics major</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Built a fintech-grade earning system for campus transactions, earning over 5,000 Skill Credits.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group cursor-pointer">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-12 mb-4 h-80 flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="text-center text-white">
                  <p className="text-lg mb-4 italic leading-relaxed">
                    "...success might not deliver
                  </p>
                  <p className="text-5xl font-light italic mb-4">urgent</p>
                  <p className="text-lg italic">to having..."</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span className="uppercase tracking-wide">Grand Strategy</span>
              </div>
              <h3 className="text-xl font-light mb-2">Aisha Mbeki</h3>
              <p className="text-sm text-gray-500 mb-2 italic">Marketing &Strategy</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Consulted for 12 campus startups. Just verified assignments secured her a summer internship.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Journey of Collaboration Section */}
      <div id="journey" className="bg-gray-50 py-20 px-6 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-light italic mb-4">Your journey of collaboration.</h2>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-emerald-600 transition-all hover:shadow-lg group">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <span className="text-emerald-700 text-xl">✓</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-light mb-3">01. Share Your Gift</h3>
                  <p className="text-gray-600 leading-relaxed">
                    List your unique talent or Pythons, ceramics, copywriting—whatever drives you. Set your price in credits or cash, and be discovered.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-emerald-600 transition-all hover:shadow-lg group">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <span className="text-emerald-700 text-xl">🔍</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-light mb-3">02. Find Your Ask</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Got something you're missing? Graphic talent, voice actor, data wiz—find it here. Apply, get approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-emerald-600 transition-all hover:shadow-lg group">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <span className="text-emerald-700 text-xl">💫</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-light mb-3">03. Exchange & Grow</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Facilitate protected financial (or talent) workspace. Exchange value, earn skills, and get experiences. Build the reputation you'll carry forever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div id="exchange" className="bg-white py-20 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">The Philosophy</p>
              <h2 className="text-4xl font-light mb-4">Built on trust,</h2>
              <h2 className="text-4xl italic font-light text-emerald-800 mb-6">scaled with technology.</h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Skill Bridge isn't just a typical gig board. We've combined the rigor of academic excellence with the agility of modern freelancing to create a place where every student can thrive professionally.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-lg">🛡️</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Student First</h3>
                    <p className="text-sm text-gray-600">
                      Every feature made specifically for the campus lifestyle.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-lg">🔒</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Safe Haven</h3>
                    <p className="text-sm text-gray-600">
                      Verified students, escrow lock in funds, safe community where every student can thrive.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Built in trust, scaled with technology.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section with Pattern Background */}
      <div className="relative bg-emerald-900 py-24 px-6 overflow-hidden border-t border-emerald-800">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
            <span className="text-3xl">🎓</span>
          </div>
          <h2 className="text-5xl font-light text-white mb-4 italic">
            Begin your campus legacy today.
          </h2>
          <p className="text-emerald-100 text-lg mb-10 leading-relaxed">
            Join the ethical skill economy of your university. It's time to turn your classroom knowledge into community value.
          </p>
          <Link
            to="/login"
            className="inline-block bg-white text-emerald-900 px-10 py-4 rounded-full hover:bg-gray-100 transition-all hover:scale-105 font-medium"
          >
            Register with University Email
          </Link>
          <p className="text-emerald-200 text-sm mt-6">
            NO FEES. JUST GROWTH →
          </p>
        </div>
      </div>

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