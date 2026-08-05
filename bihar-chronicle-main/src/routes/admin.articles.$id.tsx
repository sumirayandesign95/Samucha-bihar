import { createFileRoute } from "@tanstack/react-router";
import { ArticleEditor } from "@/components/admin/ArticleEditor";

export const Route = createFileRoute("/admin/articles/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <ArticleEditor id={id} />;
  },
});