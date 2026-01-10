export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div style={{ padding: "12px 0", color: "#475569", fontSize: 14 }}>
      {label}
    </div>
  );
}
