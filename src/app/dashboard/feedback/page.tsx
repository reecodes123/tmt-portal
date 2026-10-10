import { FeedbackInbox } from "@/components/dashboard/FeedbackInbox";
import { listFeedback } from "@/server/repositories/feedback";

export default async function FeedbackPage() {
  const items = await listFeedback();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">Feedback</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Messages readers have sent through the site.
        </p>
      </div>
      <FeedbackInbox initialItems={items} />
    </div>
  );
}
