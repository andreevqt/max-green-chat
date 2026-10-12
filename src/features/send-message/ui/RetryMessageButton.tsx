import { RotateCcw } from "lucide-react";

export default function RetryMessageButton({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <button onClick={onRetry}>
      <RotateCcw size={13} /> Повторить
    </button>
  );
}
