export default function Logo({ large = false }: { large?: boolean }) {
  return (
    <img
      className={`max-logo ${large ? "large" : ""}`}
      src="/favicon.svg"
      alt="MAX"
    />
  );
}
