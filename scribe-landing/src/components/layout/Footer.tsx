export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-white flex items-center justify-center font-bold text-xs text-black">
            S
          </div>
          <span className="font-semibold text-sm tracking-tight">Scribe</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-white/40">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="mailto:hello@scribe.ai" className="hover:text-white transition-colors">Contact</a>
        </div>

        <div className="text-white/30 text-xs">
          © {new Date().getFullYear()} Scribe
        </div>
      </div>
    </footer>
  );
}
