export function LoadingPage({ message = "Carregando..." }: { message?: string }) {
  return <main id="main-content" className="page-main"><p role="status">{message}</p></main>;
}
