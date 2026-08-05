import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "संपर्क करें — समूचा बिहार" },
      { name: "description", content: "समूचा बिहार से संपर्क करें।" },
    ],
  }),
  component: () => (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold border-l-4 border-primary pl-4">
        संपर्क करें
      </h1>
      <p className="mt-4 text-muted-foreground">
        ख़बरें भेजने, सुझाव देने या किसी अन्य सहायता के लिए हमसे संपर्क करें।
      </p>
      <div className="mt-8 grid gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">ईमेल</div>
          <div className="mt-1 font-semibold">contact@samuchabihar.com</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">पता</div>
          <div className="mt-1 font-semibold">पटना, बिहार, भारत</div>
        </div>
      </div>
    </div>
  ),
});