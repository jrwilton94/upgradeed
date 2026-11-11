// Evidência executável para os itens da Parte 9 que não são cobertos pelos outros arquivos de teste.
// Itens 15 (menu/rota por tela) e 21 (celular) NÃO são testáveis aqui: ver docs/relatorio-remessa.md.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { boot, as, expectError } from "./harness.mjs";
import { person, company, institution, scope, member, course, RIGHT } from "./fixtures.mjs";

let db;
before(async () => { db = await boot(); });
const rpc = (u, fn, args = []) => as(db, u.id, d => d.query(`SELECT public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) AS r`, args)).then(r => r.rows[0].r);
const count = async (u, sql, args = []) => { try { return (await as(db, u.id, d => d.query(sql, args))).rows.length; } catch (e) { if (/permission denied/i.test(e.message)) return 0; throw e; } };

test("P9-01: professor não lê dado algum de usuário por consulta direta nem por função", async () => {
  const aluno = await person(db, "estudante", { matching: true });
  const prof = await person(db, "professor");
  const c = await course(db, { instructor: prof.id, modules: 1, skills: ["Lógica P9"] });
  await rpc(aluno, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]);
  await db.query("INSERT INTO lesson_views(user_id,profile_role,lesson_id,seconds_watched) VALUES($1,'estudante',$2,600)", [aluno.id, c.modules[0].lessons[0]]);
  await rpc(aluno, "submit_profile_test", ["raciocinio", JSON.stringify(RIGHT.concat([1, 1, 2]).slice(0, 5))]).catch(() => {});
  for (const t of ["enrollments", "certificates", "lesson_views", "learner_profiles", "user_competencies", "behavioral_tests", "matches", "notifications", "student_verifications", "employability_preferences", "assessment_attempts", "academic_documents"]) {
    assert.equal(await count(prof, `SELECT 1 FROM ${t} WHERE user_id=$1`, [aluno.id]), 0, `professor não vê ${t}`);
  }
  assert.equal(await count(prof, "SELECT 1 FROM profiles WHERE id=$1", [aluno.id]), 0, "nem o perfil");
  await expectError(rpc(prof, "my_competencies"), /./).catch(() => {});
  assert.equal((await as(db, prof.id, d => d.query("SELECT * FROM my_competencies()"))).rows.length, 0);
  await expectError(rpc(prof, "student_status"), /./).catch(() => {});
  await expectError(rpc(prof, "get_profile_test", ["raciocinio"]), /Acesso negado/);
  assert.equal(await count(prof, "SELECT 1 FROM storage.objects WHERE bucket_id IN ('student-declarations','academic-history')"), 0);
});

test("P9-02: IES só recebe agregados (relatório sem linhas individuais; tabelas de alunos fechadas)", async () => {
  const ies = await institution(db, "IES P9-02");
  const alunos = [];
  for (let i = 0; i < 6; i++) alunos.push(await person(db, "estudante", { institutionId: ies.id }));
  const rel = await rpc(ies.owner, "ies_aggregate_report", [ies.id]);
  const txt = JSON.stringify(rel);
  for (const a of alunos) assert.ok(!txt.includes(a.id) && !txt.includes(a.email));
  for (const t of ["enrollments", "certificates", "lesson_views", "user_competencies", "behavioral_tests", "matches"]) {
    assert.equal(await count(ies.owner, `SELECT 1 FROM ${t} WHERE user_id=$1`, [alunos[0].id]), 0, `IES não vê ${t}`);
  }
  assert.equal(await count(ies.owner, "SELECT 1 FROM learner_profiles WHERE user_id=$1", [alunos[0].id]), 0);
  assert.equal(await count(ies.owner, "SELECT 1 FROM profiles WHERE id=$1", [alunos[0].id]), 0);
});

test("P9-03: colaborador não vê vaga externa (consulta direta) nem recebe sugestão externa", async () => {
  const co = await company(db);
  const colab = await person(db, "colaborador", { matching: true });
  await db.query("UPDATE profiles SET company_id=$2 WHERE id=$1", [colab.id, co.id]);
  await db.query("INSERT INTO company_employees(company_id,user_id,full_name,email) VALUES($1,$2,'C','c@x')", [co.id, colab.id]);
  const ext = (await db.query("INSERT INTO jobs(company_id,title,job_type,status) VALUES($1,'Externa','externa','aberta') RETURNING id", [co.id])).rows[0].id;
  const int = (await db.query("INSERT INTO jobs(company_id,title,job_type,status) VALUES($1,'Interna','interna','aberta') RETURNING id", [co.id])).rows[0].id;
  const seen = (await as(db, colab.id, d => d.query("SELECT id FROM jobs"))).rows.map(r => r.id);
  assert.ok(!seen.includes(ext), "externa invisível ao colaborador");
  assert.ok(seen.includes(int), "interna da própria empresa visível");
  await db.query("SELECT create_matches($1,NULL)", [ext]);
  assert.equal(await count(colab, "SELECT 1 FROM matches WHERE job_id=$1", [ext]), 0);
});

test("P9-04: colaborador desligado migra para Perfil Geral mantendo o histórico (inclui competências e testes)", async () => {
  const co = await company(db);
  const c = await course(db, { modules: 1, skills: ["Compet Desligamento"] });
  const colab = await person(db, "colaborador");
  await db.query("UPDATE profiles SET company_id=$2 WHERE id=$1", [colab.id, co.id]);
  const empId = (await db.query("INSERT INTO company_employees(company_id,user_id,full_name,email) VALUES($1,$2,'C','col@x') RETURNING id", [co.id, colab.id])).rows[0].id;
  await rpc(colab, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]);
  await rpc(colab, "submit_profile_test", ["raciocinio", JSON.stringify([2, 0, 1, 1, 2])]);
  const antes = (await db.query("SELECT (SELECT count(*)::int FROM certificates WHERE user_id=$1) c,(SELECT count(*)::int FROM enrollments WHERE user_id=$1) e,(SELECT count(*)::int FROM user_competencies WHERE user_id=$1) k,(SELECT count(*)::int FROM behavioral_tests WHERE user_id=$1) b", [colab.id])).rows[0];
  await rpc(co.owner, "manage_company", [co.id, "offboard", JSON.stringify({ id: empId })]);
  assert.equal((await db.query("SELECT role FROM profiles WHERE id=$1", [colab.id])).rows[0].role, "geral");
  const depois = (await as(db, colab.id, d => d.query("SELECT (SELECT count(*)::int FROM certificates) c,(SELECT count(*)::int FROM enrollments) e,(SELECT count(*)::int FROM my_competencies()) k,(SELECT count(*)::int FROM behavioral_tests) b"))).rows[0];
  assert.deepEqual(depois, antes, "histórico íntegro no Perfil Geral");
  assert.equal(await count(colab, "SELECT 1 FROM company_employees WHERE ended_at IS NULL"), 0, "acesso da empresa revogado");
});

test("P9-05: empresa só obtém perfil de quem aceitou a vaga; sugestão pendente não vaza", async () => {
  const co = await company(db);
  const c = await course(db, { modules: 1, skills: ["Compet P9-05"] });
  const aceita = await person(db, "estudante", { matching: true }), pendente = await person(db, "estudante", { matching: true });
  for (const u of [aceita, pendente]) await rpc(u, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]);
  const job = (await db.query("INSERT INTO jobs(company_id,title,required_skills,job_type) VALUES($1,'V',ARRAY['Compet P9-05'],'externa') RETURNING id", [co.id])).rows[0].id;
  await rpc(co.owner, "generate_job_matches", [job]);
  const m = (await as(db, aceita.id, d => d.query("SELECT id FROM matches WHERE job_id=$1", [job]))).rows[0].id;
  await rpc(aceita, "respond_match", [m, true]);
  const perfis = (await as(db, co.owner.id, d => d.query("SELECT full_name,email FROM accepted_candidate_profiles($1)", [co.id]))).rows;
  assert.equal(perfis.length, 1);
  assert.ok(!perfis.some(p => p.email === pendente.email));
  assert.equal(await count(co.owner, "SELECT 1 FROM profiles WHERE id=$1", [pendente.id]), 0, "sem busca livre de candidatos");
  assert.equal(await count(co.owner, "SELECT 1 FROM matches WHERE user_id=$1", [pendente.id]), 0);
  assert.equal(await count(co.owner, "SELECT 1 FROM learner_profiles WHERE user_id=$1", [pendente.id]), 0);
});

test("P9-12: módulo com menos de uma hora é recusado na publicação", async () => {
  const prof = await person(db, "professor"), admin = await person(db, "geral");
  await db.query("INSERT INTO user_roles(user_id,role) VALUES($1,'admin')", [admin.id]);
  const id = await rpc(prof, "save_course_content", [null, JSON.stringify({ title: "Curso curto", modules: [{ title: "M1", hours: 1, game: [{ question: "q", answer: "a" }], lessons: [{ title: "A1", duration_min: 15, position: 1, video_path: "https://x.com/v.mp4" }, { title: "A2", duration_min: 15, position: 2, video_path: "https://x.com/v.mp4" }] }] })]);
  const status = async () => (await db.query("SELECT status,published FROM courses WHERE id=$1", [id])).rows[0];
  let refused = false;
  try { await rpc(prof, "course_action", [id, "submit"]); await rpc(admin, "course_action", [id, "approve"]); } catch (e) { refused = /hora|aula|avalia/i.test(e.message); }
  const s = await status();
  assert.ok(refused || s.published === false, `módulo de 30 min não pode ficar publicado (status=${s.status}, published=${s.published})`);
  assert.equal(s.published, false);
});

test("P9-14: o mesmo usuário assistindo o mesmo vídeo cinco vezes no dia conta uma vez (e <20s não conta)", async () => {
  const db = await boot();
  const rpc = (u, fn, args = []) => as(db, u.id, d => d.query(`SELECT public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) AS r`, args));
  const prof = await person(db, "professor"); const outro = await person(db, "professor");
  const c = await course(db, { instructor: prof.id, modules: 1 }); const d2 = await course(db, { instructor: outro.id, modules: 1 });
  const u = await person(db, "estudante"), v = await person(db, "estudante");
  for (let i = 0; i < 5; i++) await rpc(u, "record_lesson_view", [c.modules[0].lessons[0], 900]);
  await rpc(v, "record_lesson_view", [d2.modules[0].lessons[0], 19]);
  const d = new Date(); const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const r = (await db.query("SELECT owner_id, eligible_minutes::float em FROM calculate_author_fund($1::date)", [m])).rows;
  assert.equal(r.length, 1, "visualização de 19s não entra");
  assert.equal(r[0].owner_id, prof.id);
  assert.equal(r[0].em, 15, "5 × 15 min no mesmo dia = 15 min");
});

test("P9-16/17/18: escopo, não-escalonamento e auditoria de subperfis", async () => {
  const co = await company(db);
  const A = await scope(db, co.id, "empresa", "Depto A", "departamento"), B = await scope(db, co.id, "empresa", "Depto B", "departamento");
  const ea = await person(db, "colaborador"), eb = await person(db, "colaborador");
  await db.query("INSERT INTO company_employees(company_id,user_id,full_name,email,scope_id) VALUES($1,$2,'A','a@x',$3),($1,$4,'B','b@x',$5)", [co.id, ea.id, A, eb.id, B]);
  const gestorA = await member(db, co, "empresa", "empresa", ["colaboradores", "competencias", "subperfis"], [A]);
  const vis = (await as(db, gestorA.id, d => d.query("SELECT user_id FROM company_employees"))).rows.map(r => r.user_id);
  assert.deepEqual(vis, [ea.id], "16: não vê o departamento B");
  await expectError(rpc(gestorA, "manage_company", [co.id, "offboard", JSON.stringify({ id: (await db.query("SELECT id FROM company_employees WHERE user_id=$1", [eb.id])).rows[0].id })]), /./);
  const novo = await person(db, "geral");
  await expectError(rpc(gestorA, "manage_organization_access", [co.id, "empresa", "save", JSON.stringify({ email: novo.email, full_name: "Novo", permissions: ["faturamento"], scope_ids: [A] })]), /maior que o seu/);
  await expectError(rpc(gestorA, "manage_organization_access", [co.id, "empresa", "save", JSON.stringify({ email: novo.email, full_name: "Novo", permissions: ["colaboradores"], scope_ids: [B] })]), /maior que o seu/);
  await expectError(rpc(gestorA, "manage_organization_access", [co.id, "empresa", "save", JSON.stringify({ email: novo.email, full_name: "Novo", permissions: ["colaboradores"], scope_ids: [] })]), /maior que o seu/);
  await rpc(gestorA, "manage_organization_access", [co.id, "empresa", "save", JSON.stringify({ email: novo.email, full_name: "Novo", permissions: ["colaboradores"], scope_ids: [A] })]);
  const logs = (await db.query("SELECT action FROM activity_logs WHERE user_id=$1 AND organization_id=$2", [gestorA.id, co.id])).rows.map(r => r.action);
  assert.ok(logs.includes("acesso_save"), "18: ação do subperfil registrada");
});

test("P9-19: nenhum campo de raça, gênero, idade, religião ou saúde existe no banco", async () => {
  const r = await db.query(`SELECT table_name||'.'||column_name c FROM information_schema.columns WHERE table_schema='public' AND column_name ~* '(^|_)(raca|race|etnia|ethnicity|cor_pele|genero|gender|sexo|sex|idade|age|birth|birthdate|nascimento|religiao|religion|saude|health|deficiencia|disability)(_|$)'`);
  assert.deepEqual(r.rows, []);
});

test("P9-22: nenhum usuário, curso, matrícula, certificado, visualização ou declaração existente é perdido na migração", async () => {
  const ids = {}; const base = {};
  const TABLES = ["profiles", "courses", "enrollments", "certificates", "lesson_views", "student_verifications", "learner_profiles"];
  const mdb = await boot({ seedAfter: { tag: "0015", fn: async d => {
    for (const k of ["a", "b", "c"]) { ids[k] = (await d.query("INSERT INTO auth.users(email) VALUES($1) RETURNING id", [`${k}@mig.com`])).rows[0].id; await d.query("UPDATE profiles SET role='estudante' WHERE id=$1", [ids[k]]); await d.query("INSERT INTO learner_profiles(user_id,profile_role,institution_name) VALUES($1,'estudante','X')", [ids[k]]); }
    ids.course = (await d.query("INSERT INTO courses(title,slug,hours) VALUES('Legado','legado-p9',10) RETURNING id")).rows[0].id;
    const l = (await d.query("INSERT INTO lessons(course_id,title,duration_min,position) VALUES($1,'A',10,1) RETURNING id", [ids.course])).rows[0].id;
    for (const k of ["a", "b"]) {
      await d.query("INSERT INTO enrollments(user_id,course_id,profile_role,progress) VALUES($1,$2,'estudante',100)", [ids[k], ids.course]);
      await d.query("INSERT INTO certificates(user_id,course_id,profile_role,hours,code) VALUES($1,$2,'estudante',10,$3)", [ids[k], ids.course, `COD${k}`]);
      await d.query("INSERT INTO lesson_views(user_id,profile_role,lesson_id,seconds_watched) VALUES($1,'estudante',$2,300)", [ids[k], l]);
    }
    await d.query("INSERT INTO student_verifications(user_id,file_path,status) VALUES($1,'p.pdf','pendente')", [ids.a]);
    for (const t of TABLES) base[t] = (await d.query(`SELECT count(*)::int n FROM ${t}`)).rows[0].n;
  } } });
  const n = async t => (await mdb.query(`SELECT count(*)::int n FROM ${t}`)).rows[0].n;
  for (const t of TABLES) assert.equal(await n(t), base[t], `${t}: nenhuma linha perdida ou criada indevidamente`);
  const cert = (await mdb.query("SELECT code,hours::float h FROM certificates ORDER BY code")).rows;
  assert.deepEqual(cert, [{ code: "CODa", h: 10 }, { code: "CODb", h: 10 }]);
  const log = (await mdb.query("SELECT metric,value::int v FROM data_migration_log ORDER BY id")).rows;
  assert.ok(log.some(r => r.metric.startsWith("antes:")), "contagens 'antes' registradas");
  assert.ok(log.some(r => r.metric.startsWith("depois:")), "contagens 'depois' registradas");
  const afterRow = k => log.find(r => r.metric === `depois:${k}`)?.v;
  assert.equal(afterRow("certificates"), base.certificates); assert.equal(afterRow("lesson_views"), base.lesson_views);
});
