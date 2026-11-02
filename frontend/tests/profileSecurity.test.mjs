import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/services/profileSecurity.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const { emailUpdateErrorMessage, redefinePassword, validateNewPassword } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

async function test(name, run) { await run(); console.log(`ok - ${name}`); }

await test("distingue endereço recusado de envio não autorizado", () => {
  assert.match(emailUpdateErrorMessage({ code: "email_address_invalid" }), /endereço atual e o novo/);
  assert.match(emailUpdateErrorMessage({ code: "email_address_not_authorized" }), /envio de confirmação não está autorizado/);
});
await test("limites de envio orientam aguardar sem culpar o endereço", () => {
  assert.match(emailUpdateErrorMessage({ code: "over_email_send_rate_limit" }), /limite de envio/);
  assert.match(emailUpdateErrorMessage({ code: "over_request_rate_limit" }), /Muitas solicitações/);
});
await test("preserva a indicação de e-mail já utilizado e sessão inválida", () => {
  for (const code of ["email_exists", "user_already_exists"]) assert.match(emailUpdateErrorMessage({ code }), /já está em uso/);
  for (const code of ["session_expired", "session_not_found", "bad_jwt"]) assert.match(emailUpdateErrorMessage({ code }), /Entre novamente/);
});
await test("timeout evita incentivar reenvios antes de conferir a confirmação", () => {
  assert.match(emailUpdateErrorMessage({ code: "request_timeout" }), /antes de repetir/);
});
await test("falhas desconhecidas não são diagnosticadas como endereço inválido ou SMTP", () => {
  for (const code of [undefined, "unexpected_failure", "novo_codigo"]) {
    assert.match(emailUpdateErrorMessage({ code }), /verificar a falha/);
    assert.doesNotMatch(emailUpdateErrorMessage({ code }), /endereço.*inválido|SMTP/);
  }
});

await test("recusa a senha atual quando o serviço retorna same_password", async () => {
  let calls = 0;
  const auth = { updateUser: async () => { calls++; return { error: { code: "same_password" } }; } };
  await assert.rejects(redefinePassword(auth, "senha-ficticia", "senha-ficticia"), {
    code: "same_password", message: "A nova senha deve ser diferente da senha atual.",
  });
  assert.equal(calls, 1);
});
await test("senhas diferentes não são enviadas ao serviço", async () => {
  const auth = { updateUser: async () => { assert.fail("não deve enviar"); } };
  await assert.rejects(redefinePassword(auth, "senha-ficticia", "outra-senha"), { code: "validation" });
});
await test("valida tamanho mínimo e limite em bytes", () => {
  assert.notEqual(validateNewPassword("12345", "12345"), "");
  assert.notEqual(validateNewPassword("á".repeat(37), "á".repeat(37)), "");
  assert.equal(validateNewPassword("senha-ficticia", "senha-ficticia"), "");
});
await test("envia a nova senha e o código apenas quando informado", async () => {
  const calls = [];
  const auth = { updateUser: async (value) => { calls.push(value); return { error: null }; } };
  await redefinePassword(auth, "senha-ficticia", "senha-ficticia");
  await redefinePassword(auth, "senha-ficticia", "senha-ficticia", " 123456 ");
  assert.deepEqual(calls, [{ password: "senha-ficticia" }, { password: "senha-ficticia", nonce: "123456" }]);
});
await test("preserva a exigência de confirmação de identidade", async () => {
  for (const code of ["reauthentication_needed", "reauthentication_not_valid"]) {
    const auth = { updateUser: async () => ({ error: { code } }) };
    await assert.rejects(redefinePassword(auth, "senha-ficticia", "senha-ficticia"), { code });
  }
});
await test("falhas do serviço não são tratadas como sucesso", async () => {
  const auth = { updateUser: async () => ({ error: { code: "weak_password" } }) };
  await assert.rejects(redefinePassword(auth, "senha-ficticia", "senha-ficticia"), { code: "weak_password" });
});
