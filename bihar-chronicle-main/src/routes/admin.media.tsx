import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, UploadCloud } from "lucide-react";

export const Route = createFileRoute("/admin/media")({ component: MediaAdmin });

function MediaAdmin() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const upload = async (file: File) => {
    setErrorMessage("");
    setUrl("");
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setErrorMessage("केवल फोटो और वीडियो अपलोड करें।");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("फ़ाइल 50 MB से बड़ी है। छोटी फ़ाइल चुनें।");
      return;
    }
    setBusy(true);
    try {
      const safeName = file.name.replace(/[^\w.-]/g, "_").slice(-100);
      const randomId = crypto.randomUUID();
      const path = `${file.type.startsWith("video/") ? "videos" : "images"}/${randomId}-${safeName}`;
      const { error } = await supabase.storage.from("news-images").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("news-images").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "फ़ाइल अपलोड नहीं हो सकी। दोबारा कोशिश करें।");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold tracking-wider text-primary">SAMUCHA BIHAR · MEDIA</p>
        <h1 className="mt-1 font-display text-3xl font-bold">मीडिया लाइब्रेरी</h1>
        <p className="mt-2 text-sm text-muted-foreground">खबरों के लिए फोटो और वीडियो जोड़ें।</p>
      </div>
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center hover:border-primary">
          <UploadCloud className="h-8 w-8 text-primary" />
          <span className="text-sm font-bold">फोटो या वीडियो चुनें</span>
          <span className="text-xs text-muted-foreground">एक फ़ाइल, अधिकतम 50 MB</span>
          <input type="file" accept="image/*,video/*" disabled={busy} className="max-w-full text-xs" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file); e.target.value="";}} />
        </label>
        {busy && <p role="status" className="text-sm text-muted-foreground">फ़ाइल अपलोड हो रही है…</p>}
        {errorMessage && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{errorMessage}</p>}
        {url && <div className="space-y-3 rounded-lg bg-muted p-4">
          <p className="text-sm font-bold">अपलोड सफल — फ़ाइल का लिंक</p>
          <p className="break-all text-xs text-muted-foreground">{url}</p>
          <button type="button" onClick={()=>navigator.clipboard.writeText(url)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Copy className="h-4 w-4"/> लिंक कॉपी करें</button>
        </div>}
      </div>
      <p className="text-sm leading-7 text-muted-foreground">अपलोड के बाद मिला लिंक खबर की मुख्य तस्वीर, गैलरी या वीडियो वाले हिस्से में उपयोग करें।</p>
    </main>
  );
}
