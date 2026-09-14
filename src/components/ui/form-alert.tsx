/** Form-level error, announced when it appears. */
export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-control border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
      {children}
    </p>
  );
}
