import { test, before } from "node:test";
import assert from "node:assert/strict";
import { boot, as, asAnon, expectError } from "./harness.mjs";
import { person, company, institution, scope, member, course, RIGHT, WRONG } from "./fixtures.mjs";

let db;
before(async () => {
  db = await boot();
});
const rpc = (u, fn, args = []) =>
  as(db, u.id, (d) =>
    d.query(`SELECT public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) AS r`, args),
  ).then((r) => r.rows[0].r);
const monthStart = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
};

// ------------------------------------------------------------ H + E: score e painel do professor (exemplo numérico do relatório)
async function scenarioH(d) {
  const profA = await person(d, "professor"),
    profB = await person(d, "professor");
  const A = await course(d, { instructor: profA.id, modules: 2, title: "Curso A" });
  const B = await course(d, { instructor: profB.id, modules: 1, title: "Curso B" });
  const students = [];
  for (let i = 0; i < 4; i++) students.push(await person(d, "estudante"));
  const watch = async (u, lesson, s = 600) =>
    d.query(
      "INSERT INTO lesson_views(user_id,profile_role,lesson_id,seconds_watched) VALUES($1,'estudante',$2,$3)",
      [u.id, lesson, s],
    );
  const pass = async (u, mod) =>
    d.query(
      "INSERT INTO assessment_attempts(user_id,profile_role,module_id,score,passed) VALUES($1,'estudante',$2,100,true)",
      [u.id, mod],
    );
  const [a1, a2] = A.modules,
    [b1] = B.modules;
  for (const u of students) {
    await watch(u, a1.lessons[0]);
    await watch(u, b1.lessons[0]);
  }
  for (const u of students.slice(0, 2)) await watch(u, a2.lessons[0]);
  for (const u of students.slice(0, 2)) await pass(u, a1.id); // A/m1: 2 de 4 = 50%
  for (const u of students.slice(0, 2)) await pass(u, a2.id); // A/m2: 2 de 2 = 100%
  await pass(students[0], b1.id); // B/m1: 1 de 4 = 25%
  await d.query("INSERT INTO payments(amount_cents,status,paid_at) VALUES(100000,'pago',now())");
  return { profA, profB, A, B, students };
}

test("H: conclusão = média por módulo → por autor; fundo 100% distribuído; exemplo numérico confere", async () => {
  const h = await boot();
  const s = await scenarioH(h);
  const rows = (
    await h.query(
      "SELECT fund_type,owner_id,title,eligible_minutes::float em,completion::float comp,audience::float aud,production::float prod,score::float score,estimated_cents::int cents FROM calculate_author_fund($1::date)",
      [monthStart()],
    )
  ).rows;
  const a = rows.find((r) => r.owner_id === s.profA.id),
    b = rows.find((r) => r.owner_id === s.profB.id);
  assert.equal(a.em, 60);
  assert.equal(b.em, 40);
  assert.ok(Math.abs(a.comp - 0.75) < 1e-9, "taxa A = média(50%,100%)=75% → parcela 0,75");
  assert.ok(Math.abs(b.comp - 0.25) < 1e-9);
  assert.ok(
    Math.abs(a.aud - 0.6) < 1e-9 && Math.abs(a.prod - 30 / 45) < 1e-9,
    "produção só conta vídeos com audiência",
  );
  assert.ok(Math.abs(a.score - (0.55 * 0.6 + 0.25 * (30 / 45) + 0.2 * 0.75)) < 1e-9);
  assert.ok(Math.abs(a.score + b.score - 1) < 1e-9, "normalização mantida");
  assert.equal(a.cents + b.cents, 25000, "fundo de 25% de R$ 1.000,00 distribuído por inteiro");
  assert.deepEqual([a.cents, b.cents], [16167, 8833]);
  console.log(
    "EXEMPLO H:",
    JSON.stringify({
      A: {
        audiencia: a.aud,
        producao: a.prod,
        conclusao: a.comp,
        score: a.score,
        centavos: a.cents,
      },
      B: {
        audiencia: b.aud,
        producao: b.prod,
        conclusao: b.comp,
        score: b.score,
        centavos: b.cents,
      },
    }),
  );
});

test("H: vídeo sem visualização no mês não entra na produção; sessões < 20s não contam", async () => {
  const h = await boot();
  const prof = await person(h, "professor");
  const other = await person(h, "professor");
  const C = await course(h, { instructor: prof.id, modules: 1 });
  const D = await course(h, { instructor: other.id, modules: 1 });
  const u = await person(h, "estudante");
  await h.query(
    "INSERT INTO lesson_views(user_id,profile_role,lesson_id,seconds_watched) VALUES($1,'estudante',$2,600),($1,'estudante',$3,19)",
    [u.id, C.modules[0].lessons[0], D.modules[0].lessons[0]],
  );
  const rows = (
    await h.query("SELECT owner_id, production::float p FROM calculate_author_fund($1::date)", [
      monthStart(),
    ])
  ).rows;
  assert.equal(rows.length, 1, "curso só com sessão de 19s não tem audiência");
  assert.equal(rows[0].owner_id, prof.id);
  assert.equal(rows[0].p, 1, "somente a aula assistida entra");
});

test("E: painel do professor traz dados reais (vídeos, módulos, minutos, conclusão, score, conta) sem dados de alunos", async () => {
  const h = await boot();
  const s = await scenarioH(h);
  const dash = (await as(h, s.profA.id, (d) => d.query("SELECT teacher_dashboard() r"))).rows[0].r;
  assert.equal(dash.courses, 1);
  assert.equal(Number(dash.watched_minutes), 60);
  assert.equal(dash.modules.length, 2, "todos os módulos");
  assert.deepEqual(
    dash.modules.map((m) => [m.started, m.approved, m.completion_rate]),
    [
      [4, 2, 50],
      [2, 2, 100],
    ],
  );
  assert.equal(Number(dash.completion_rate), 75);
  assert.equal(dash.top_videos[0].minutes, 40);
  assert.ok(Math.abs(Number(dash.score) - 0.6467) < 1e-3);
  assert.equal(Number(dash.estimated_cents), 16167);
  assert.equal(Number(dash.fund_cents), 25000);
  assert.equal(dash.account.paid_cents, 0);
  assert.equal(dash.account.has_payout_account, false);
  const txt = JSON.stringify(dash);
  for (const st of s.students)
    assert.ok(!txt.includes(st.id) && !txt.includes(st.email), "nenhum dado de aluno");
  const other = (await as(h, s.profB.id, (d) => d.query("SELECT teacher_dashboard() r"))).rows[0].r;
  assert.ok(!JSON.stringify(other).includes("Curso A"), "professor vê apenas o próprio conteúdo");
  await expectError(
    as(h, s.students[0].id, (d) => d.query("SELECT teacher_dashboard()")),
    /Acesso negado/,
  );
  await expectError(
    asAnon(h, (d) => d.query("SELECT teacher_dashboard()")),
    /./,
  );
});

// ------------------------------------------------------------ G: relatório agregado da IES
async function cohort(d, ies, n, { scopeId = null, matchingOn = 0, working = 0 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++)
    out.push(
      await person(d, "estudante", {
        institutionId: ies.id,
        scopeId,
        matching: i < matchingOn,
        works: i < working,
        area: null,
      }),
    );
  return out;
}
test("G: grupos com menos de 5 viram 'dados insuficientes' (com supressão complementar); sem linhas individuais", async () => {
  const ies = await institution(db, "IES Relatório");
  const alunos = await cohort(db, ies, 7, { matchingOn: 2, working: 6 });
  const r = await rpc(ies.owner, "ies_aggregate_report", [ies.id]);
  assert.equal(r.insufficient, false);
  assert.equal(r.students, 7);
  const m = Object.fromEntries(r.employability.matching.map((x) => [x.label, x]));
  assert.equal(m["Matching ativado"].n, null);
  assert.equal(m["Matching ativado"].suppressed, true);
  assert.equal(
    m["Matching desativado"].n,
    null,
    "5 de 7: suprimido também (senão 7-5 revelaria os 2)",
  );
  const w = Object.fromEntries(r.socioeconomic.working.map((x) => [x.label, x]));
  assert.equal(w["Não trabalha"].n, null, "1 aluno suprimido");
  assert.equal(w["Trabalha"].n, null, "complementar suprimido");
  const txt = JSON.stringify(r);
  for (const a of alunos) assert.ok(!txt.includes(a.id) && !txt.includes(a.email));
  const ies2 = await institution(db, "IES Pequena");
  await cohort(db, ies2, 4);
  const small = await rpc(ies2.owner, "ies_aggregate_report", [ies2.id]);
  assert.equal(small.insufficient, false);
  assert.equal(small.small_cohort, true);
  assert.equal(small.students, 4, "totais sempre aparecem");
  assert.ok(
    small.employability.matching.every((x) => x.suppressed && x.n === null),
    "quebras por grupo continuam suprimidas",
  );
  assert.deepEqual(small.competencies, []);
});

test("G: grupos grandes aparecem; competências com menos de 5 pessoas são omitidas", async () => {
  const ies = await institution(db, "IES Grande");
  const alunos = await cohort(db, ies, 12, { matchingOn: 6, working: 5 });
  const sk = (
    await db.query(
      "INSERT INTO skills(name,slug) VALUES('Excel IES','excel-ies'),('Raro IES','raro-ies') RETURNING id,slug",
    )
  ).rows;
  for (const a of alunos)
    await db.query(
      "INSERT INTO user_competencies(user_id,profile_role,skill_id,level,origin) VALUES($1,'estudante',$2,40,'curso')",
      [a.id, sk[0].id],
    );
  for (const a of alunos.slice(0, 3))
    await db.query(
      "INSERT INTO user_competencies(user_id,profile_role,skill_id,level,origin) VALUES($1,'estudante',$2,40,'teste')",
      [a.id, sk[1].id],
    );
  const r = await rpc(ies.owner, "ies_aggregate_report", [ies.id]);
  assert.deepEqual(
    r.employability.matching.map((x) => [x.label, x.n]),
    [
      ["Matching ativado", 6],
      ["Matching desativado", 6],
    ],
  );
  assert.deepEqual(
    r.competencies.map((x) => [x.label, x.n]),
    [["Excel IES", 12]],
  );
  assert.deepEqual(
    r.socioeconomic.working.map((x) => [x.label, x.n]),
    [
      ["Não trabalha", 7],
      ["Trabalha", 5],
    ],
  );
});

test("G: subperfil com escopo vê só o próprio escopo; sem permissão, outro perfil e outra IES são negados", async () => {
  const ies = await institution(db, "IES Escopo Rel");
  const s1 = await scope(db, ies.id, "ies", "Curso 1"),
    s2 = await scope(db, ies.id, "ies", "Curso 2");
  await cohort(db, ies, 6, { scopeId: s1 });
  await cohort(db, ies, 3, { scopeId: s2 });
  const c1 = await member(db, ies, "ies", "ies", ["relatorios"], [s1]);
  const c2 = await member(db, ies, "ies", "ies", ["relatorios"], [s2]);
  const semPerm = await member(db, ies, "ies", "ies", ["conteudo"], []);
  assert.equal((await rpc(ies.owner, "ies_aggregate_report", [ies.id])).students, 9);
  assert.equal((await rpc(c1, "ies_aggregate_report", [ies.id])).students, 6);
  const r2 = await rpc(c2, "ies_aggregate_report", [ies.id]);
  assert.equal(r2.students, 3, "totais do escopo pequeno aparecem");
  assert.ok(
    r2.socioeconomic.working.every((x) => x.n === null),
    "grupos suprimidos",
  );
  await expectError(rpc(semPerm, "ies_aggregate_report", [ies.id]), /acesso institucional/);
  await expectError(
    rpc(await person(db, "estudante"), "ies_aggregate_report", [ies.id]),
    /acesso institucional/,
  );
  const outra = await institution(db, "Outra IES");
  await expectError(rpc(outra.owner, "ies_aggregate_report", [ies.id]), /acesso institucional/);
  await expectError(
    asAnon(db, (d) => d.query("SELECT ies_aggregate_report($1)", [ies.id])),
    /./,
  );
});

// ------------------------------------------------------------ F1/F3: histórico e testes
test("F1: arquivo do histórico é privado do dono; valida extensão; extração só por servidor e só aceita competências do catálogo", async () => {
  const u = await person(db, "estudante"),
    other = await person(db, "estudante"),
    prof = await person(db, "professor");
  const path = `${u.id}/estudante/historico.pdf`;
  await db.query(
    "INSERT INTO storage.objects(bucket_id,name,metadata) VALUES('academic-history',$1,'{\"size\":\"1000\"}')",
    [path],
  );
  await expectError(
    rpc(u, "register_academic_document", [`${u.id}/estudante/x.exe`]),
    /Arquivo inválido/,
  );
  await expectError(
    rpc(u, "register_academic_document", [`${other.id}/estudante/historico.pdf`]),
    /Arquivo inválido/,
  );
  await db.query(
    "INSERT INTO storage.objects(bucket_id,name,metadata) VALUES('academic-history',$1,'{\"size\":\"20000000\"}')",
    [`${u.id}/estudante/grande.pdf`],
  );
  await expectError(
    rpc(u, "register_academic_document", [`${u.id}/estudante/grande.pdf`]),
    /10 MB/,
  );
  const id = await rpc(u, "register_academic_document", [path]);
  const seen = async (x) =>
    (
      await as(db, x.id, (d) =>
        d.query("SELECT name FROM storage.objects WHERE bucket_id='academic-history'"),
      )
    ).rows.length;
  assert.equal(await seen(u), 2);
  assert.equal(await seen(other), 0);
  assert.equal(await seen(prof), 0);
  assert.equal(
    (await as(db, other.id, (d) => d.query("SELECT 1 FROM academic_documents"))).rows.length,
    0,
  );
  await expectError(
    as(db, u.id, (d) => d.query("SELECT apply_academic_extraction($1,ARRAY['Python'])", [id])),
    /permission|denied|permiss/i,
  );
  await db.query(
    "INSERT INTO skills(name,slug) VALUES('Python Histórico','python-historico') ON CONFLICT DO NOTHING",
  );
  const n = (
    await db.query(
      "SELECT apply_academic_extraction($1,ARRAY['python historico','Religião: católica','Raça'])",
      [id],
    )
  ).rows[0].apply_academic_extraction;
  assert.equal(n, 1);
  const comp = (
    await as(db, u.id, (d) => d.query("SELECT name,origin,verified FROM my_competencies()"))
  ).rows;
  assert.deepEqual(
    comp.map((c) => [c.name, c.origin, c.verified]),
    [["Python Histórico", "historico", false]],
  );
  assert.deepEqual(
    (await db.query("SELECT extracted_skills FROM academic_documents WHERE id=$1", [id])).rows[0]
      .extracted_skills,
    ["Python Histórico"],
    "atributos sensíveis descartados",
  );
});

test("F3: testes são pontuados no servidor, sem gabarito no navegador; vocacional só no ensino médio; escrita direta bloqueada", async () => {
  const u = await person(db, "estudante", { level: "graduacao" });
  const t = await rpc(u, "get_profile_test", ["raciocinio"]);
  assert.ok(!JSON.stringify(t).includes("answer"), "gabarito não é enviado");
  const r = await rpc(u, "submit_profile_test", ["raciocinio", JSON.stringify([2, 0, 1, 1, 2])]);
  assert.equal(r.result.score, 100);
  const r2 = await rpc(u, "submit_profile_test", ["raciocinio", JSON.stringify([0, 0, 0, 0, 0])]);
  assert.equal(r2.result.score, 20);
  await expectError(
    rpc(u, "submit_profile_test", ["raciocinio", JSON.stringify([2, 0, 1])]),
    /todas as perguntas/,
  );
  await expectError(
    rpc(u, "submit_profile_test", ["raciocinio", JSON.stringify([9, 0, 1, 1, 2])]),
    /inválida/,
  );
  const c = await rpc(u, "submit_profile_test", [
    "comportamental",
    JSON.stringify([5, 5, 3, 3, 1, 1, 4, 4]),
  ]);
  assert.deepEqual(c.result.dimensions, {
    "Trabalho em equipe": 100,
    Comunicação: 60,
    Organização: 20,
    Resiliência: 80,
  });
  assert.equal(c.label, "Trabalho em equipe");
  await expectError(rpc(u, "get_profile_test", ["vocacional"]), /ensino médio/);
  const medio = await person(db, "estudante", { level: "medio" });
  const v = await rpc(medio, "submit_profile_test", [
    "vocacional",
    JSON.stringify([5, 5, 1, 1, 1, 1, 3, 3]),
  ]);
  assert.equal(v.label, "Tecnologia");
  const geral = await person(db, "geral", { level: "medio" });
  assert.ok(
    (await rpc(geral, "get_profile_test", ["vocacional"])).questions.length === 8,
    "regra segue o nível de ensino informado",
  );
  await expectError(
    as(db, u.id, (d) =>
      d.query(
        "INSERT INTO behavioral_tests(user_id,result,test_type) VALUES($1,'{\"score\":100}','raciocinio')",
        [u.id],
      ),
    ),
    /policy|permission/i,
  );
  await expectError(
    as(db, u.id, (d) => d.query("UPDATE behavioral_tests SET profile_label='X'")),
    /policy|permission/i,
  );
  await expectError(
    as(db, u.id, (d) => d.query("DELETE FROM behavioral_tests")),
    /policy|permission/i,
  );
  await expectError(
    as(db, u.id, (d) => d.query("SELECT * FROM profile_tests")),
    /permission|denied/i,
  );
  const prof = await person(db, "professor");
  await expectError(
    rpc(prof, "submit_profile_test", ["raciocinio", JSON.stringify([2, 0, 1, 1, 2])]),
    /Acesso negado/,
  );
  // isolamento: resultados de um perfil não aparecem no outro login
  assert.equal(
    (await as(db, geral.id, (d) => d.query("SELECT 1 FROM behavioral_tests"))).rows.length,
    0,
  );
});

test("F3: teste gera competências (origem 'teste') usadas pelo matching", async () => {
  const co = await company(db);
  await db.query(
    "INSERT INTO skills(name,slug) VALUES('Raciocínio lógico','raciocinio-logico') ON CONFLICT DO NOTHING",
  );
  const u = await person(db, "estudante", { matching: true });
  const job = (
    await db.query(
      "INSERT INTO jobs(company_id,title,required_skills,job_type) VALUES($1,'Analista',ARRAY['Raciocínio lógico'],'externa') RETURNING id",
      [co.id],
    )
  ).rows[0].id;
  await rpc(u, "submit_profile_test", ["raciocinio", JSON.stringify([2, 0, 1, 1, 2])]);
  assert.equal(
    (await as(db, u.id, (d) => d.query("SELECT 1 FROM matches WHERE job_id=$1", [job]))).rows
      .length,
    1,
  );
});

// ------------------------------------------------------------ F4/F5: empresa
test("F4: licenças/faturamento exigem a permissão específica sem escopo; desligada por padrão para subperfis", async () => {
  const co = await company(db);
  const emp = await person(db, "colaborador");
  await db.query(
    "INSERT INTO company_employees(company_id,user_id,full_name,email) VALUES($1,$2,'E','e@x')",
    [co.id, emp.id],
  );
  const plan = (
    await db.query(
      "INSERT INTO plans(code,name,audience,price_month_cents) VALUES('empresa_x','Empresa X','empresa',9900) RETURNING id",
    )
  ).rows[0].id;
  const sub = (
    await db.query(
      "INSERT INTO subscriptions(user_id,plan_id,company_id,status,seats,amount_cents) VALUES($1,$2,$3,'ativa',10,99000) RETURNING id",
      [co.owner.id, plan, co.id],
    )
  ).rows[0].id;
  await db.query(
    "INSERT INTO payments(user_id,subscription_id,amount_cents,status,paid_at) VALUES($1,$2,99000,'pago',now())",
    [co.owner.id, sub],
  );
  const b = await rpc(co.owner, "company_billing", [co.id]);
  assert.equal(b.seats_used, 1);
  assert.equal(b.subscription.seats, 10);
  assert.equal(b.subscription.plan, "Empresa X");
  assert.equal(b.payments.length, 1);
  const rh = await member(db, co, "empresa", "empresa", ["colaboradores", "relatorios"], []);
  await expectError(rpc(rh, "company_billing", [co.id]), /Faturamento exige permissão/);
  const fin = await member(db, co, "empresa", "empresa", ["faturamento"], []);
  assert.equal((await rpc(fin, "company_billing", [co.id])).seats_used, 1);
  const finEscopo = await member(
    db,
    co,
    "empresa",
    "empresa",
    ["faturamento"],
    [await scope(db, co.id, "empresa", "Depto", "departamento")],
  );
  await expectError(rpc(finEscopo, "company_billing", [co.id]), /Faturamento exige permissão/);
  await expectError(rpc(emp, "company_billing", [co.id]), /Faturamento exige permissão/);
  const outra = await company(db, "Outra");
  await expectError(rpc(outra.owner, "company_billing", [co.id]), /Faturamento exige permissão/);
});

test("F5: relatório da empresa é agregado e respeita o escopo do subperfil", async () => {
  const co = await company(db);
  const d1 = await scope(db, co.id, "empresa", "Comercial", "departamento"),
    d2 = await scope(db, co.id, "empresa", "Financeiro", "departamento");
  const c = await course(db, { modules: 1, skills: ["Negociação"] });
  const mk = async (sc) => {
    const u = await person(db, "colaborador");
    await db.query(
      "INSERT INTO company_employees(company_id,user_id,full_name,email,scope_id) VALUES($1,$2,'F','f@x',$3)",
      [co.id, u.id, sc],
    );
    await rpc(u, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]);
    return u;
  };
  const e1 = await mk(d1),
    e2 = await mk(d1),
    e3 = await mk(d2);
  await db.query("INSERT INTO jobs(company_id,title,job_type) VALUES($1,'Vaga','externa')", [
    co.id,
  ]);
  const all = await rpc(co.owner, "company_report", [co.id]);
  assert.equal(all.employees, 3);
  assert.equal(all.certificates, 6);
  assert.equal(Number(all.hours), 6);
  assert.equal(all.jobs.open, 1);
  assert.equal(all.scoped, false);
  const gestor = await member(db, co, "empresa", "empresa", ["relatorios"], [d1]);
  const sc = await rpc(gestor, "company_report", [co.id]);
  assert.equal(sc.employees, 2);
  assert.equal(sc.scoped, true);
  assert.equal(sc.jobs, null, "vagas só para quem não tem restrição");
  assert.ok(!JSON.stringify(sc).includes(e3.id) && !JSON.stringify(sc).includes(e1.id));
  await expectError(
    rpc(await member(db, co, "empresa", "empresa", ["candidatos"], []), "company_report", [co.id]),
    /acesso da empresa/,
  );
  await expectError(rpc(e1, "company_report", [co.id]), /acesso da empresa/);
});

// ------------------------------------------------------------ F6/F7: IES
test("F6: vincular/remover professor exige 'professores', registra log e notifica; professor inexistente é recusado", async () => {
  const ies = await institution(db, "IES Prof");
  const prof = await person(db, "professor", { name: "Prof Z" });
  const gestor = await member(db, ies, "ies", "ies", ["professores"], []);
  const sem = await member(db, ies, "ies", "ies", ["relatorios"], []);
  const link = await rpc(gestor, "ies_link_teacher", [ies.id, prof.email.toUpperCase()]);
  await expectError(
    rpc(gestor, "ies_link_teacher", [ies.id, "ninguem@x.com"]),
    /Professor não encontrado/,
  );
  await expectError(
    rpc(gestor, "ies_link_teacher", [ies.id, (await person(db, "estudante")).email]),
    /Professor não encontrado/,
  );
  await expectError(rpc(sem, "ies_link_teacher", [ies.id, prof.email]), /Permissão necessária/);
  const list = (
    await as(db, gestor.id, (d) => d.query("SELECT * FROM ies_list_teachers($1)", [ies.id]))
  ).rows;
  assert.equal(list.length, 1);
  assert.equal(list[0].status, "ativo");
  assert.equal(
    (
      await db.query(
        "SELECT 1 FROM notifications WHERE user_id=$1 AND title='Vínculo com instituição'",
        [prof.id],
      )
    ).rows.length,
    1,
  );
  await expectError(rpc(sem, "ies_unlink_teacher", [link]), /Permissão necessária/);
  await rpc(gestor, "ies_unlink_teacher", [link]);
  assert.equal(
    (await as(db, gestor.id, (d) => d.query("SELECT status FROM ies_teachers"))).rows[0].status,
    "removido",
    "histórico mantido",
  );
  assert.deepEqual(
    (
      await db.query(
        "SELECT action FROM activity_logs WHERE organization_id=$1 ORDER BY created_at",
        [ies.id],
      )
    ).rows.map((r) => r.action),
    ["professor_vinculado", "professor_desvinculado"],
  );
  assert.equal(
    (await as(db, (await institution(db)).owner.id, (d) => d.query("SELECT 1 FROM ies_teachers")))
      .rows.length,
    0,
    "outra IES não vê",
  );
  assert.equal(
    (await as(db, (await person(db, "estudante")).id, (d) => d.query("SELECT 1 FROM ies_teachers")))
      .rows.length,
    0,
  );
});

test("F7: lista de cursos respeita escopo; mover curso exige permissão na origem e no destino", async () => {
  const ies = await institution(db, "IES Cursos");
  const s1 = await scope(db, ies.id, "ies", "Adm"),
    s2 = await scope(db, ies.id, "ies", "Dir");
  const c1 = await course(db, { institutionId: ies.id, modules: 1, title: "Curso Adm" }),
    c2 = await course(db, { institutionId: ies.id, modules: 1, title: "Curso Dir" });
  await db.query("UPDATE courses SET scope_id=$2 WHERE id=$1", [c1.id, s1]);
  await db.query("UPDATE courses SET scope_id=$2 WHERE id=$1", [c2.id, s2]);
  const gestor1 = await member(db, ies, "ies", "ies", ["cursos"], [s1]);
  const list = async (u) =>
    (
      await as(db, u.id, (d) => d.query("SELECT title FROM ies_list_courses($1)", [ies.id]))
    ).rows.map((r) => r.title);
  assert.deepEqual(await list(ies.owner), ["Curso Adm", "Curso Dir"]);
  assert.deepEqual(await list(gestor1), ["Curso Adm"]);
  await expectError(rpc(gestor1, "ies_set_course_scope", [c1.id, s2]), /neste escopo/);
  await expectError(rpc(gestor1, "ies_set_course_scope", [c2.id, s1]), /neste escopo/);
  await expectError(
    rpc(await member(db, ies, "ies", "ies", ["relatorios"], []), "ies_list_courses", [ies.id]),
    /Permissão necessária/,
  );
  await rpc(ies.owner, "ies_set_course_scope", [c1.id, s2]);
  assert.deepEqual(await list(gestor1), [], "saiu do escopo do gestor");
  assert.equal(
    (await db.query("SELECT 1 FROM activity_logs WHERE action='curso_escopo_alterado'")).rows
      .length >= 1,
    true,
  );
  const outro = await institution(db, "Outra IES");
  const s3 = await scope(db, outro.id, "ies", "X");
  await expectError(
    rpc(outro.owner, "ies_set_course_scope", [c1.id, s3]),
    /Escopo inválido|neste escopo/,
  );
});

// ------------------------------------------------------------ I
test("I1: cadastro de professor só pela equipe Upgrade, com log; I3: troca de perfis de teste desligada por padrão", async () => {
  const admin = await person(db, "geral");
  await db.query("INSERT INTO user_roles(user_id,role) VALUES($1,'admin')", [admin.id]);
  const alvo = await person(db, "geral");
  await expectError(rpc(alvo, "admin_register_professor", [alvo.email]), /equipe Upgrade/);
  await rpc(admin, "admin_register_professor", [alvo.email.toUpperCase()]);
  assert.equal(
    (await db.query("SELECT role FROM profiles WHERE id=$1", [alvo.id])).rows[0].role,
    "professor",
  );
  assert.equal(
    (await db.query("SELECT meta FROM activity_logs WHERE action='professor_habilitado'")).rows[0]
      .meta.role_before,
    "geral",
  );
  await expectError(rpc(admin, "admin_register_professor", ["nao@existe.com"]), /Nenhuma conta/);
  // troca de perfis de teste
  const t = await person(db, "estudante");
  await db.query(
    "INSERT INTO test_profile_access(user_id,role) VALUES($1,'geral'),($1,'estudante')",
    [t.id],
  );
  await expectError(rpc(t, "switch_test_profile", ["geral"]), /desativada/);
  await db.query("UPDATE platform_settings SET test_profile_switch_enabled=true");
  await rpc(t, "switch_test_profile", ["geral"]);
  assert.equal(
    (await db.query("SELECT role FROM profiles WHERE id=$1", [t.id])).rows[0].role,
    "geral",
  );
  await db.query("UPDATE platform_settings SET test_profile_switch_enabled=false");
  await expectError(rpc(t, "switch_test_profile", ["estudante"]), /desativada/);
  assert.equal(await rpc(t, "test_switch_enabled"), false);
});

test("I3: só a equipe altera a chave de troca; I2/CNPJ: formato validado e opcional", async () => {
  const u = await person(db, "estudante");
  const upd = await as(db, u.id, (d) =>
    d.query("UPDATE platform_settings SET test_profile_switch_enabled=true RETURNING 1"),
  );
  assert.equal(upd.rows.length, 0);
  const co = await company(db);
  await db.query("UPDATE companies SET cnpj='12345678000199' WHERE id=$1", [co.id]);
  await expectError(
    db.query("UPDATE companies SET cnpj='12.345.678/0001-99' WHERE id=$1", [co.id]),
    /companies_cnpj_format/,
  );
  await db.query("UPDATE companies SET cnpj=NULL WHERE id=$1", [co.id]);
});
