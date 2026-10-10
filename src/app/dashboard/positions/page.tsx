import { PositionManager } from "@/components/dashboard/PositionManager";
import { listPositions } from "@/server/repositories/positions";

export default async function PositionsPage() {
  const positions = await listPositions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">
          Editorial Positions
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          The controlled list of titles the Editorial Board form picks from —
          keeps &ldquo;Managing Editor&rdquo; from turning into three slightly
          different strings over time. To assign someone to a title, go to
          Editorial Board.
        </p>
      </div>
      <PositionManager initialPositions={positions} />
    </div>
  );
}
