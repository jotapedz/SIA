import { useEffect, useState } from "react";
import type { Discente } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../services/api";
import { Button } from "../ui/Button";
import styles from "./DiscentePhoto.module.css";

export function DiscentePhoto({ discente, preview }: { discente?: Discente; preview?: string | null }) {
  const { session } = useAuth();
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const name = discente?.social_name || discente?.full_name || "Discente";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  useEffect(() => {
    setUrl(""); setFailed(false);
    if (preview !== undefined || !discente?.photo_path || !session) return;
    const controller = new AbortController();
    async function load() {
      try {
        const data = await apiRequest<{ url: string | null }>(`/v1/discentes/${discente!.id}/foto`, session!.access_token, { signal: controller.signal });
        if (!controller.signal.aborted) { setUrl(data.url || ""); setFailed(false); }
      } catch {
        if (!controller.signal.aborted) { setUrl(""); setFailed(true); }
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 240000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [discente?.id, discente?.photo_path, session?.access_token, preview, attempt]);
  const source = preview === undefined ? url : preview;
  return <div className={styles.container}>
    {source && !failed ? <img className={styles.photo} src={source} alt={`Foto de ${name}`} onError={() => setFailed(true)} />
      : <span className={styles.placeholder} role="img" aria-label={`Sem foto disponível de ${name}`}>{initials}</span>}
    {failed && <><span className={styles.hint}>Não foi possível carregar a foto.</span>
      {preview === undefined && <Button variant="text" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</Button>}</>}
  </div>;
}

export function DiscentePhotoPicker({ discente, value, onChange, onBusy }: {
  discente?: Discente; value: string | null | undefined; onChange: (value: string | null | undefined) => void; onBusy: (busy: boolean) => void;
}) {
  const [error, setError] = useState("");
  useEffect(() => () => onBusy(false), [onBusy]);
  return <div className={styles.picker}>
    <DiscentePhoto discente={discente} preview={value} />
    <div className={styles.controls}>
      <label htmlFor="discente-photo">Foto do discente (opcional)</label>
      <input id="discente-photo" type="file" accept="image/jpeg,image/png" aria-describedby="discente-photo-hint discente-photo-error"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024 || file.size === 0) {
            setError("Selecione uma imagem JPG ou PNG de até 2 MB."); return;
          }
          setError(""); onBusy(true);
          const reader = new FileReader();
          reader.onload = () => { onChange(String(reader.result)); onBusy(false); };
          reader.onerror = () => { setError("Não foi possível ler a imagem. Selecione o arquivo novamente."); onBusy(false); };
          reader.readAsDataURL(file);
        }} />
      <span id="discente-photo-hint" className={styles.hint}>JPG ou PNG, até 2 MB. A foto será exibida em formato circular.</span>
      <span id="discente-photo-error" className={styles.error} role="status">{error}</span>
      <div className={styles.actions}>
        {(typeof value === "string" || (value === undefined && discente?.photo_path)) && <Button variant="text" onClick={() => { onChange(null); setError(""); }}>Remover foto</Button>}
        {value !== undefined && <Button variant="text" onClick={() => { onChange(undefined); setError(""); }}>Desfazer alteração da foto</Button>}
      </div>
    </div>
  </div>;
}
