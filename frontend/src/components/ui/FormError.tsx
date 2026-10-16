export function FormError({ title, children }: { title: string; children: string }) {
  return (
    <div className="form-error" role="alert">
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
}
