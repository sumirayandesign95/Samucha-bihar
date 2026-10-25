import { Link } from "@tanstack/react-router";
import { MapPin, Newspaper, ArrowRight } from "lucide-react";

export function SiteFooter({ categories = [] }: { categories?: { slug: string; name_hi: string }[] }) {
  return (
    <footer className="mt-16 border-t border-border bg-[#171b22] text-white">
      <div className="container mx-auto grid max-w-7xl gap-9 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo of samucha bihar.png" alt="समूचा बिहार" className="h-12 w-12 rounded-md object-contain" width="48" height="48" />
            <div>
              <strong className="font-display text-xl font-bold">समूचा बिहार</strong>
              <span className="block text-[10px] tracking-widest text-white/60">हिंदी डिजिटल समाचार</span>
            </div>
          </Link>
          <p className="mt-4 text-sm leading-8 text-white/70">बिहार की स्थानीय खबरों के साथ देश-दुनिया की महत्वपूर्ण जानकारी।</p>
        </div>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold"><Newspaper className="h-4 w-4 text-red-400" /> समाचार</h2>
          <ul className="space-y-3 text-sm text-white/70">
            {categories.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:text-white">{category.name_hi}</Link>
              </li>
            ))}
            {!categories.length && <li>खबरों की श्रेणियाँ जल्द दिखाई देंगी।</li>}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold"><MapPin className="h-4 w-4 text-red-400" /> अपना इलाका</h2>
          <ul className="space-y-3 text-sm text-white/70">
            <li><Link to="/districts" className="inline-flex items-center gap-1 font-bold text-white hover:underline">बिहार के 38 जिले <ArrowRight className="h-3.5 w-3.5" /></Link></li>
            {[
              { slug: "patna", name: "पटना" },
              { slug: "gaya", name: "गया" },
              { slug: "muzaffarpur", name: "मुजफ्फरपुर" },
              { slug: "bhagalpur", name: "भागलपुर" },
            ].map((item) => (
              <li key={item.slug}>
                <Link to="/district/$slug" params={{slug:item.slug}} search={{city:undefined}} className="hover:text-white">{item.name} की खबरें</Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-bold">समूचा बिहार</h2>
          <ul className="space-y-3 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-white">हमारे बारे में</Link></li>
            <li><Link to="/contact" className="hover:text-white">संपर्क करें / समाचार भेजें</Link></li>
            <li><Link to="/bookmarks" className="hover:text-white">सहेजी गई खबरें</Link></li>
          </ul>
          <p className="mt-5 text-xs leading-6 text-white/50">आधिकारिक सोशल मीडिया लिंक उपलब्ध होने पर यहाँ जोड़े जाएँगे।</p>
        </section>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} समूचा बिहार · सर्वाधिकार सुरक्षित
      </div>
    </footer>
  );
}
