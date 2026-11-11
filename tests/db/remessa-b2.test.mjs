import { test, before } from "node:test";
import assert from "node:assert/strict";
import { boot, as, expectError, newUser } from "./harness.mjs";
import { person, institution, scope, member, course, RIGHT } from "./fixtures.mjs";

let db;
before(async () => { db = await boot(); });
const rpc = (u, fn, args = []) => as(db, u.id, d => d.query(`SELECT public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) AS r`, args)).then(r => r.rows[0].r);
const future = (days = 365) => new Date(Date.now() + days * 86400e3).toISOString();
const ymd = days => new Date(Date.now() + days * 86400e3).toISOString().slice(0, 10);
const notes = async (id, like) => (await db.query("SELECT title FROM notifications WHERE user_id=$1 AND title ILIKE $2", [id, like])).rows.length;
const counts = async (id) => Object.fromEntries(await Promise.all(["enrollments", "certificates", "user_competencies", "behavioral_tests", "assessment_attempts", "lesson_views"].map(async t => [t, (await db.query(`SELECT count(*)::int n FROM ${t} WHERE user_id=$1`, [id])).rows[0].n])));

// ------------------------------------------------------------ importação em lote
test("B2 lote: prévia valida linha a linha sem gravar; confirmação grava convites e auditoria; e-mail repetido/pendente é recusado", async () => {
  const ies = await institution(db, "IES Lote");
  await scope(db, ies.id, "ies", "Administração");
  const rows = [
    { line: 2, email: "ok1@aluno.com", nome: "Ana Lima", nivel: "graduação", curso: "Administração", semestre: "3", matricula: "A1", validade: ymd(200) },
    { line: 3, email: "ruim", nome: "Bia", nivel: "graduacao", curso: "Adm", semestre: "1", matricula: "B", validade: ymd(200) },
    { line: 4, email: "ok2@aluno.com", nome: "Caio", nivel: "médio", serie: "2º", turma: "A", validade: ymd(200) },
    { line: 5, email: "ok1@aluno.com", nome: "Ana de novo", nivel: "graduacao", curso: "Administração", semestre: "3", matricula: "A1", validade: ymd(200) },
    { line: 6, email: "sem-mat@aluno.com", nome: "Dani", nivel: "graduacao", curso: "Administração", semestre: "3", validade: ymd(200) },
    { line: 7, email: "passado@aluno.com", nome: "Edu", nivel: "pos", curso: "X", semestre: "1", matricula: "9", validade: "2020-01-01" },
    { line: 8, email: "nivel@aluno.com", nome: "Fê", nivel: "doutorado", validade: ymd(200) },
  ];
  const prev = await rpc(ies.owner, "import_student_invites", [ies.id, JSON.stringify(rows), "alunos.csv", false]);
  assert.equal(prev.accepted, 2); assert.equal(prev.rejected_count, 5); assert.equal(prev.confirmed, false);
  const reasons = Object.fromEntries(prev.rejected.map(r => [r.line, r.reason]));
  assert.match(reasons[3], /E-mail inválido/); assert.match(reasons[5], /repetido/); assert.match(reasons[6], /matrícula/); assert.match(reasons[7], /futura/); assert.match(reasons[8], /Nível/);
  assert.equal((await db.query("SELECT count(*)::int n FROM student_invites WHERE institution_id=$1", [ies.id])).rows[0].n, 0, "prévia não grava");
  const ok = await rpc(ies.owner, "import_student_invites", [ies.id, JSON.stringify(rows), "alunos.csv", true]);
  assert.equal(ok.confirmed, true);
  assert.equal((await db.query("SELECT count(*)::int n FROM student_invites WHERE institution_id=$1", [ies.id])).rows[0].n, 2);
  const log = (await db.query("SELECT meta FROM activity_logs WHERE organization_id=$1 AND action='importacao_alunos'", [ies.id])).rows;
  assert.equal(log.length, 1); assert.equal(log[0].meta.accepted, 2); assert.equal(log[0].meta.rejected, 5);
  const again = await rpc(ies.owner, "import_student_invites", [ies.id, JSON.stringify([rows[0]]), "x.csv", true]);
  assert.match(again.rejected[0].reason, /convite pendente/);
});

test("B2 lote: respeita escopo, exige permissão e nega outros perfis", async () => {
  const ies = await institution(db, "IES Escopo Lote");
  const adm = await scope(db, ies.id, "ies", "Administração");
  await scope(db, ies.id, "ies", "Direito");
  const coord = await member(db, ies, "ies", "ies", ["validar_vinculos"], [adm]);
  const semPerm = await member(db, ies, "ies", "ies", ["relatorios"], []);
  const row = (e, curso) => ({ email: e, nome: "Aluno X", nivel: "graduacao", curso, semestre: "1", matricula: "1", validade: ymd(100) });
  const r = await rpc(coord, "import_student_invites", [ies.id, JSON.stringify([row("a@x.com", "Administração"), row("b@x.com", "Direito"), row("c@x.com", "Curso inexistente")]), "f.csv", true]);
  assert.equal(r.accepted, 1); assert.ok(r.rejected.every(x => /fora do seu escopo/.test(x.reason)));
  await expectError(rpc(semPerm, "import_student_invites", [ies.id, JSON.stringify([row("d@x.com", "Direito")]), "f.csv", true]), /negado|permiss/i);
  const outro = await person(db, "estudante");
  await expectError(rpc(outro, "import_student_invites", [ies.id, JSON.stringify([row("e@x.com", "Direito")]), "f.csv", true]), /negado/i);
  const outraIes = await institution(db, "Outra");
  await expectError(rpc(outraIes.owner, "import_student_invites", [ies.id, JSON.stringify([row("f@x.com", "Direito")]), "f.csv", true]), /negado|permiss/i);
});

test("B2 lote: convite é resgatado pelo mesmo e-mail e vira vínculo validado com origem 'lote'; outro e-mail não o recebe", async () => {
  const ies = await institution(db, "IES Convite");
  await rpc(ies.owner, "import_student_invites", [ies.id, JSON.stringify([{ email: "convidada@aluno.com", nome: "Convidada", nivel: "graduacao", curso: "Direito", semestre: "2", matricula: "77", validade: ymd(120) }]), "c.csv", true]);
  const u = await newUser(db, "convidada@aluno.com");
  await db.query("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [u]);
  const stranger = await newUser(db, "outra@aluno.com"); await db.query("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [stranger]);
  assert.equal(await rpc({ id: stranger }, "claim_student_invites"), 0);
  assert.equal(await rpc({ id: u }, "claim_student_invites"), 1);
  const lp = (await db.query("SELECT institution_id, course_name, registration_number FROM learner_profiles WHERE user_id=$1 AND profile_role='estudante'", [u])).rows[0];
  assert.equal(lp.institution_id, ies.id); assert.equal(lp.registration_number, "77");
  const v = (await db.query("SELECT status, source FROM student_verifications WHERE user_id=$1", [u])).rows[0];
  assert.deepEqual([v.status, v.source], ["validado", "lote"]);
  assert.equal(await rpc({ id: u }, "claim_student_invites"), 0, "não resgata duas vezes");
});

// ------------------------------------------------------------ carência, recusa, aviso, expiração
test("B2 carência: novo Estudante recebe ~30 dias, configuráveis em platform_settings", async () => {
  const u = await person(db, null);
  await rpc(u, "configure_profile", ["estudante", JSON.stringify({ education_level: "medio", institution_name: "Colégio", school_year: "1º", classroom: "A" })]);
  const g = (await db.query("SELECT grace_until FROM learner_profiles WHERE user_id=$1 AND profile_role='estudante'", [u.id])).rows[0].grace_until;
  assert.ok(Math.abs(g - Date.now() - 30 * 86400e3) < 3600e3);
  const st = await rpc(u, "student_status");
  assert.equal(st.eligible, true); assert.equal(st.validated, false);
});

test("B2 recusa: notifica com o motivo, a carência continua correndo e é possível reenviar", async () => {
  const ies = await institution(db, "IES Recusa");
  const a = await person(db, "estudante", { institutionId: ies.id, institutionName: "IES Recusa" });
  await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('student-declarations',$1),('student-declarations',$2)", [`${a.id}/estudante/1.pdf`, `${a.id}/estudante/2.pdf`]);
  const before = (await db.query("SELECT grace_until FROM learner_profiles WHERE user_id=$1 AND profile_role='estudante'", [a.id])).rows[0].grace_until.getTime();
  const v1 = await rpc(a, "submit_student_verification", [`${a.id}/estudante/1.pdf`]);
  await expectError(rpc(ies.owner, "validate_student_verification", [v1, false, "  ", null]), /motivo/);
  await rpc(ies.owner, "validate_student_verification", [v1, false, "Documento ilegível", null]);
  assert.equal(await notes(a.id, "Declaração recusada"), 1);
  assert.match((await db.query("SELECT body FROM notifications WHERE user_id=$1 AND title='Declaração recusada'", [a.id])).rows[0].body, /Documento ilegível.*nova declaração/);
  assert.equal((await db.query("SELECT grace_until FROM learner_profiles WHERE user_id=$1 AND profile_role='estudante'", [a.id])).rows[0].grace_until.getTime(), before, "carência intacta");
  assert.equal((await db.query("SELECT role FROM profiles WHERE id=$1", [a.id])).rows[0].role, "estudante");
  const v2 = await rpc(a, "submit_student_verification", [`${a.id}/estudante/2.pdf`]);
  assert.notEqual(v1, v2);
  await expectError(rpc(ies.owner, "validate_student_verification", [v1, true, null, future()]), /já foi analisado/);
});

test("B2 aviso: 15 dias antes avisa uma única vez; no dia da migração avisa de novo", async () => {
  const a = await person(db, "estudante", { graceUntil: new Date(Date.now() + 10 * 86400e3) });
  const far = await person(db, "estudante", { graceUntil: new Date(Date.now() + 25 * 86400e3) });
  await db.query("SELECT run_student_lifecycle()");
  assert.equal(await notes(a.id, "%termina em%"), 1);
  assert.equal(await notes(far.id, "%termina em%"), 0, "fora da janela de 15 dias");
  await db.query("SELECT run_student_lifecycle()");
  assert.equal(await notes(a.id, "%termina em%"), 1, "não repete");
  await db.query("UPDATE learner_profiles SET grace_until=now()-interval '1 minute' WHERE user_id=$1 AND profile_role='estudante'", [a.id]);
  const r = await db.query("SELECT run_student_lifecycle() r");
  assert.ok(r.rows[0].r.migrated >= 1);
  assert.equal(await notes(a.id, "Sua conta foi migrada%"), 1);
});

test("B2 expiração: fim da carência/validade migra para Geral mantendo todo o histórico; contas de teste não migram; nada é apagado", async () => {
  const c = await course(db, { modules: 1, skills: ["Gestão de Projetos"] });
  const a = await person(db, "estudante", { matching: false });
  await rpc(a, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]);
  for (const l of c.modules[0].lessons) await rpc(a, "record_lesson_view", [l, 60]);
  await rpc(a, "submit_profile_test", ["raciocinio", JSON.stringify([2, 0, 1, 1, 2])]);
  const antes = await counts(a.id);
  assert.ok(antes.certificates >= 2 && antes.enrollments >= 1 && antes.user_competencies >= 1 && antes.behavioral_tests === 1);
  const teste = await person(db, "estudante", { graceUntil: new Date(Date.now() - 86400e3) });
  await db.query("INSERT INTO test_profile_access(user_id,role) VALUES($1,'estudante')", [teste.id]);
  await db.query("UPDATE learner_profiles SET grace_until=now()-interval '1 day' WHERE user_id=$1 AND profile_role='estudante'", [a.id]);
  await db.query("SELECT run_student_lifecycle()");
  assert.equal((await db.query("SELECT role FROM profiles WHERE id=$1", [a.id])).rows[0].role, "geral");
  assert.equal((await db.query("SELECT role FROM profiles WHERE id=$1", [teste.id])).rows[0].role, "estudante", "conta de teste não migra");
  // histórico do Geral = histórico do Estudante (cópia); original preservado
  const depois = (await as(db, a.id, d => d.query("SELECT (SELECT count(*)::int FROM certificates) c, (SELECT count(*)::int FROM enrollments) e, (SELECT count(*)::int FROM my_competencies()) k, (SELECT count(*)::int FROM behavioral_tests) b"))).rows[0];
  assert.deepEqual([depois.c, depois.e, depois.k, depois.b], [antes.certificates, antes.enrollments, antes.user_competencies, antes.behavioral_tests]);
  const orig = (await db.query("SELECT count(*)::int n FROM certificates WHERE user_id=$1 AND profile_role='estudante'", [a.id])).rows[0].n;
  assert.equal(orig, antes.certificates, "registros do perfil Estudante preservados");
  assert.equal((await counts(a.id)).lesson_views, antes.lesson_views, "visualizações preservadas");
  // idempotente
  await db.query("SELECT migrate_learner_role($1,'estudante','geral')", [a.id]);
  assert.equal((await db.query("SELECT count(*)::int n FROM certificates WHERE user_id=$1 AND profile_role='geral'", [a.id])).rows[0].n, antes.certificates);
  // Geral continua aprendendo e emitindo certificado com horas
  const c2 = await course(db, { modules: 1 });
  const r = await rpc(a, "submit_assessment", [c2.modules[0].id, JSON.stringify(RIGHT)]);
  assert.equal(r.certificate, true);
});

test("B2 retorno: Geral que já foi Estudante volta ao validar nova declaração, sem perder histórico nem duplicar", async () => {
  const ies = await institution(db, "IES Retorno");
  const a = await person(db, "estudante", { institutionId: ies.id, institutionName: "IES Retorno" });
  const c = await course(db, { modules: 1 });
  await rpc(a, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]);
  await db.query("UPDATE learner_profiles SET grace_until=now()-interval '1 day' WHERE user_id=$1 AND profile_role='estudante'", [a.id]);
  await db.query("SELECT run_student_lifecycle()");
  assert.equal((await db.query("SELECT role FROM profiles WHERE id=$1", [a.id])).rows[0].role, "geral");
  const st = await rpc(a, "student_status"); assert.equal(st.can_return, true);
  const c2 = await course(db, { modules: 1 });
  await rpc(a, "submit_assessment", [c2.modules[0].id, JSON.stringify(RIGHT)]); // aprendeu como Geral
  await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('student-declarations',$1)", [`${a.id}/estudante/n.pdf`]);
  const v = await rpc(a, "submit_student_verification", [`${a.id}/estudante/n.pdf`]);
  await rpc(ies.owner, "validate_student_verification", [v, true, null, future(200)]);
  assert.equal((await db.query("SELECT role FROM profiles WHERE id=$1", [a.id])).rows[0].role, "estudante");
  const n = (await as(db, a.id, d => d.query("SELECT count(*)::int n FROM certificates"))).rows[0].n;
  assert.equal(n, 4, "2 cursos + 2 módulos, sem duplicar");
  assert.equal((await rpc(a, "student_status")).validated, true);
  // quem nunca foi estudante não pode usar o caminho
  const g = await person(db, "geral");
  await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('student-declarations',$1)", [`${g.id}/estudante/n.pdf`]);
  await expectError(rpc(g, "submit_student_verification", [`${g.id}/estudante/n.pdf`]), /./);
});
