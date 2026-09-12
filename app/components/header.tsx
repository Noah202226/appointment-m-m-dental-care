function Header() {
  return (
    <header className="flex items-center justify-between bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-emerald-50 p-2 rounded-2xl">
          <img
            src="/icons/android-chrome-192x192.png"
            alt="Logo"
            className="h-12 w-auto rounded-2xl"
          />
        </div>
        <div>
          <h1 className="text-2xl font-black text-zinc-800 tracking-tight">
            Manila Dental Arts
          </h1>
          <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">
            v3 appointment booking
          </p>
        </div>
      </div>
      <div className="hidden md:block text-right">
        <p className="text-xs font-bold text-zinc-400 uppercase">Need help?</p>
        <p className="text-sm font-black text-yellow-400">
          📞 (Contact): +639055169516 or maniladentalarts@gmail.com
        </p>
      </div>
    </header>
  );
}

export default Header;
