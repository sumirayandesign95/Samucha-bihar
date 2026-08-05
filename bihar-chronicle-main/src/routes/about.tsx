import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "हमारे बारे में — समूचा बिहार" },
      { name: "description", content: "समूचा बिहार के बारे में जानें।" },
    ],
  }),
  component: () => (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold border-l-4 border-primary pl-4">
        हमारे बारे में
      </h1>
      <div className="prose dark:prose-invert mt-6 text-lg leading-relaxed">
        <p>
          <strong>समूचा बिहार</strong> एक डिजिटल हिन्दी न्यूज़ प्लेटफ़ॉर्म है जो बिहार,
          भारत और विश्व की हर बड़ी ख़बर को सटीक, निष्पक्ष और तेज़ी से आप तक पहुँचाता है।
        </p>
        <p>
          हमारी टीम राजनीति, खेल, व्यापार, मनोरंजन, शिक्षा, अपराध और तकनीक — हर क्षेत्र
          की ख़बरों पर पैनी नज़र रखती है ताकि आप कभी भी कुछ ज़रूरी मिस न करें।
        </p>
        <p>
          हमारा उद्देश्य है — <em>“सच्ची ख़बर, सही समय पर, सबसे पहले।”</em>
        </p>
      </div>
    </div>
  ),
});