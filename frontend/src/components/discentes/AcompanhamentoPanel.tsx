import { useCallback, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useApiResource } from "../../hooks/useApiResource";
import { createRegistro, createTermo, downloadTermo, listRegistros, listTermos } from "../../services/acompanhamento";
import type { Registro } from "../../services/acompanhamento";
import { formatDate } from "../../lib/format";
import { Field, SelectField, TextareaField } from "../ui/Field";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Pagination } from "../ui/Pagination";
import { ResourceMessage } from "../ui/ResourceMessage";
import styles from "./AcompanhamentoPanel.module.css";

const kindLabels: Record<Registro["kind"], string> = { ATENDIMENTO: "Atendimento", CONTRIBUICAO: "Contribuição",
  ENCAMINHAMENTO: "Encaminhamento", ACOMPANHAMENTO: "Acompanhamento", OBSERVACAO: "Observação operacional" };

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function documentBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

export function AcompanhamentoPanel({ discenteId }: { discenteId: number }) {
  const { session } = useAuth();
  const [page, setPage] = useState(1);
  const [termoPage, setTermoPage] = useState(1);
  const load = useCallback((token: string, signal: AbortSignal) => listRegistros(token, discenteId, page, signal), [discenteId, page]);
  const loadTermos = useCallback((token: string, signal: AbortSignal) => listTermos(token, discenteId, termoPage, signal), [discenteId, termoPage]);
  const registros = useApiResource(load);
  const termos = useApiResource(loadTermos);
  const [modal, setModal] = useState<"registro" | "termo" | null>(null);
  const [kind, setKind] = useState<Registro["kind"]>("ATENDIMENTO");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [reportId, setReportId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);
  function open(value: "registro" | "termo") {
    setModal(value); setDate(today()); setDescription(""); setReportId(""); setFile(null); setError(""); setSuccess("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving.current || !session) return;
    saving.current = true; setBusy(true); setError("");
    try {
      if (modal === "registro") {
        await createRegistro(session.access_token, discenteId, { kind, occurred_on: date, description: description.trim(), report_id: reportId ? Number(reportId) : null });
        registros.reload(); setPage(1);
      } else {
        if (!file || !file.name.toLowerCase().endsWith(".pdf") || file.size > 5 * 1024 * 1024) throw new Error("Selecione um PDF de até 5 MB.");
        await createTermo(session.access_token, discenteId, { acknowledged_on: date, file_name: file.name, document_base64: await documentBase64(file) });
        termos.reload(); setTermoPage(1);
      }
      setModal(null); setFile(null); setSuccess("Registro salvo com sucesso.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível salvar o registro."); }
    finally { saving.current = false; setBusy(false); }
  }
  async function download(id: number) {
    if (!session || downloading !== null) return;
    setDownloading(id); setDownloadError("");
    try {
      const blob = await downloadTermo(session.access_token, discenteId, id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `termo-ciencia-${id}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) { setDownloadError(reason instanceof Error ? reason.message : "Não foi possível baixar o termo."); }
    finally { setDownloading(null); }
  }
  return <section className={styles.panel} aria-label="Acompanhamento do discente">
    {success && <p role="status" className={styles.success}>{success}</p>}
    <h2>Atendimentos e contribuições</h2>
    <div className={styles.actions}><Button onClick={() => open("registro")}>Registrar atendimento ou contribuição</Button></div>
    {registros.loading || registros.error ? <ResourceMessage loading={registros.loading} error={registros.error} onRetry={registros.reload} />
      : registros.data && <>
        {!registros.data.items.length && <p>Nenhum atendimento ou contribuição registrado.</p>}
        {registros.data.items.map((item) => <article className={styles.record} key={item.id}>
          <h3>{kindLabels[item.kind]} — {formatDate(item.occurred_on)}</h3>
          <p className={styles.description}>{item.description}</p>
          <p>Registrado por {item.author_name}{item.report_id ? <> · <a href={`/relatorios/${item.report_id}`}>Relatório #{item.report_id}</a></> : null}</p>
        </article>)}
        <Pagination total={registros.data.total} page={page} pageSize={registros.data.page_size} onChange={setPage} label="registros" busy={registros.loading} />
      </>}
    <h2>Termos de Ciência</h2>
    <p>Anexe o documento que registra a ciência do discente. O sistema não substitui a assinatura do documento.</p>
    <div className={styles.actions}><Button onClick={() => open("termo")}>Registrar Termo de Ciência</Button></div>
    {downloadError && <p role="alert">{downloadError}</p>}
    {termos.loading || termos.error ? <ResourceMessage loading={termos.loading} error={termos.error} onRetry={termos.reload} />
      : termos.data && <>
        {!termos.data.items.length && <p>Nenhum Termo de Ciência registrado.</p>}
        {termos.data.items.map((item) => <article className={styles.record} key={item.id}>
          <h3>{item.file_name}</h3><p>Ciência em {formatDate(item.acknowledged_on)} · Registrado por {item.author_name}</p>
          <Button variant="outline" disabled={downloading !== null} onClick={() => void download(item.id)}>{downloading === item.id ? "Baixando…" : "Baixar documento"}</Button>
        </article>)}
        <Pagination total={termos.data.total} page={termoPage} pageSize={termos.data.page_size} onChange={setTermoPage} label="termos" busy={termos.loading} />
      </>}
    {modal && <Modal title={modal === "registro" ? "Registrar atendimento ou contribuição" : "Registrar Termo de Ciência"} busy={busy} onClose={() => setModal(null)}>
      <form className={styles.form} onSubmit={save}><fieldset disabled={busy}>
        {modal === "registro" && <SelectField id="registro-kind" label="Tipo de registro" value={kind} onChange={(value) => setKind(value as Registro["kind"])}>
          <option value="ATENDIMENTO">Atendimento</option><option value="CONTRIBUICAO">Contribuição</option>
          <option value="ENCAMINHAMENTO">Encaminhamento</option><option value="ACOMPANHAMENTO">Acompanhamento</option><option value="OBSERVACAO">Observação operacional</option>
        </SelectField>}
        <Field id="registro-date" label={modal === "registro" ? "Data da ação" : "Data da ciência"} type="date" required max={today()} value={date} onChange={(e) => setDate(e.target.value)} />
        {modal === "registro" ? <>
          <TextareaField id="registro-description" label="Descrição da ação" required maxLength={20000} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} hint="Não registre diagnósticos, laudos ou informações clínicas." />
          <Field id="registro-report" label="Número do relatório vinculado (opcional)" type="number" min={1} max={Number.MAX_SAFE_INTEGER} step={1} value={reportId} onChange={(e) => setReportId(e.target.value)} hint="Use o número do relatório deste discente, exibido na URL ao abri-lo." />
        </> : <Field id="termo-file" label="Documento PDF" type="file" accept="application/pdf,.pdf" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} hint="Até 5 MB. Registros anteriores são preservados." />}
        {error && <p role="alert">{error}</p>}
        <div className={styles.actions}><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">{busy ? "Salvando…" : "Salvar registro"}</Button></div>
      </fieldset></form>
    </Modal>}
  </section>;
}
