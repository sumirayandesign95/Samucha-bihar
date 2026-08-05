import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListTags, adminRenameTag, adminDeleteTag } from "@/lib/admin.functions";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/tags")({ component: TagsAdmin });

function TagsAdmin() {
  const listFn = useServerFn(adminListTags);
  const renameFn = useServerFn(adminRenameTag);
  const deleteFn = useServerFn(adminDeleteTag);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-tags"], queryFn: () => listFn() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-tags"] });
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
  };
  const rename = async (from: string) => {
    const to = prompt(`Rename tag "${from}" to:`, from);
    if (!to || to === from) return;
    await renameFn({ data: { from, to: to.trim() } });
    invalidate();
  };
  const remove = async (name: string) => {
    if (!confirm(`Remove tag "${name}" from all articles?`)) return;
    await deleteFn({ data: { name } });
    invalidate();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-bold">Tag Management</h1>
      <p className="text-sm text-muted-foreground">Tags come from the tag field on each article. Use rename or delete to update every article that uses a tag.</p>
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4">
        {data.map((tag) => (
          <div key={tag.name} className="inline-flex items-center gap-1 rounded-full bg-muted pl-3 pr-1 py-0.5 text-sm">
            <Link to="/search" search={{ q: tag.name }} className="hover:text-primary">
              #{tag.name} <span className="text-xs opacity-70">{tag.count}</span>
            </Link>
            <button onClick={() => rename(tag.name)} className="rounded-full p-1 hover:bg-background" title="Rename">
              <Pencil className="h-3 w-3" />
            </button>
            <button onClick={() => remove(tag.name)} className="rounded-full p-1 text-destructive hover:bg-background" title="Delete">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {!data.length && <p className="text-sm text-muted-foreground">No tags yet.</p>}
      </div>
    </div>
  );
}
