import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/media")({ component: MediaAdmin });

function MediaAdmin() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const safeName = file.name.replace(/[^\w.-]/g, "_");
      const path = `${file.type.startsWith("video/") ? "videos" : "images"}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("news-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("news-images").getPublicUrl(path);
      setUrl(data.publicUrl);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-bold">Media Library</h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <input type="file" accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        {busy && <p className="mt-3 text-sm text-muted-foreground">Uploading...</p>}
        {url && <div className="mt-4 rounded-md bg-muted p-3 text-sm break-all">{url}</div>}
      </div>
      <p className="text-sm text-muted-foreground">Use the generated public URL in article featured image, gallery, or embedded content fields.</p>
    </div>
  );
}
