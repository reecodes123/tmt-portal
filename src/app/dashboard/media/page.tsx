import { MediaGrid } from "@/components/dashboard/MediaGrid";
import { listMedia } from "@/server/repositories/media";
import { getCurrentUser } from "@/server/auth";

export default async function MediaPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const items = await listMedia();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">
          Media Library
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Images and PDFs used across articles. Only Admins can delete uploads.
        </p>
      </div>
      <MediaGrid initialItems={items} viewerRole={user.role} />
    </div>
  );
}
