export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="error" style={{ padding: "8px 0" }}>
      {message}
    </div>
  );
}
