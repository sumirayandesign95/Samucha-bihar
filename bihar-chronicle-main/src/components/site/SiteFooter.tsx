import { Link } from "@tanstack/react-router";
import { Facebook, Twitter, Youtube, Instagram, Mail } from "lucide-react";

export function SiteFooter({ categories = [] }: { categories?: { slug: string; name_hi: string }[] }) {
  return (
    <footer className="mt-16 border-t border-border bg-card/50">
      <div className="container mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-display font-bold text-xl">
              स
            </div>
            <div>
              <div className="font-display font-bold text-lg">समूचा बिहार</div>
              <div className="text-xs text-muted-foreground">Samucha Bihar</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            बिहार, भारत और विश्व की हर बड़ी ख़बर — सबसे पहले, सबसे सटीक।
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">श्रेणियाँ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {categories.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:text-primary">
                  {category.name_hi}
                </Link>
              </li>
            ))}
            {!categories.length && <li>कोई श्रेणी उपलब्ध नहीं है</li>}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">कंपनी</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">हमारे बारे में</Link></li>
            <li><Link to="/contact" className="hover:text-primary">संपर्क करें</Link></li>
            <li><Link to="/login" className="hover:text-primary">एडमिन लॉगिन</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">फ़ॉलो करें</h4>
          <p className="text-sm text-muted-foreground">
            सोशल मीडिया पर हमसे जुड़ें और लेटेस्ट अपडेट पाएँ।
          </p>
          <div className="mt-3 flex gap-2">
            {[
              { Icon: Facebook, href: "#", label: "Facebook" },
              { Icon: Twitter, href: "#", label: "Twitter" },
              { Icon: Youtube, href: "#", label: "YouTube" },
              { Icon: Instagram, href: "#", label: "Instagram" },
              { Icon: Mail, href: "mailto:hello@samuchabihar.com", label: "Email" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} समूचा बिहार · सर्वाधिकार सुरक्षित
      </div>
    </footer>
  );
}