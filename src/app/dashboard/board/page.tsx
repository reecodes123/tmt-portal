import Link from "next/link";
import { BoardManager } from "@/components/dashboard/BoardManager";
import { listBoardMembers } from "@/server/repositories/boardMembers";
import { listPositions } from "@/server/repositories/positions";

export default async function BoardPage() {
  const [members, positions] = await Promise.all([
    listBoardMembers(),
    listPositions(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">
          Editorial Board
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage the org chart shown on the public Editorial Board page. Not the
          same as login accounts — see Users. Titles come from{" "}
          <Link href="/dashboard/positions" className="text-tmt-orange hover:underline">
            Positions
          </Link>
          .
        </p>
      </div>
      <BoardManager initialMembers={members} positions={positions} />
    </div>
  );
}
