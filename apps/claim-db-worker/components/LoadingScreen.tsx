import { LoadingMark } from "@/components/brand/Brand";

export default function LoadingScreen() {
  return (
    <div className="mb-4 flex h-full w-full flex-col items-center justify-center rounded-2xl border border-border bg-paper p-4">
      <LoadingMark label="Setting up your temporary database..." />
    </div>
  );
}
