import { test, before } from "node:test";
import assert from "node:assert/strict";
import { boot, as, asAnon, expectError } from "./harness.mjs";
import { person, company, institution, scope, member, course, RIGHT, WRONG } from "./fixtures.mjs";

let db;
before(async () => { db = await boot(); });
const rpc = (u, fn, args = []) => as(db, u.id, d => d.query(`SELECT public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) AS r`, args)).then(r => r.rows[0].r);

// ---------------------------------------------------------------- A. vínculo à IES parceira
test("A: cadastro grava institution_id quando a instituição é parceira e inicia a carência", async () => {
  const ies = await institution(db, "Faculdade Parceira");
  const u = await person(db, null);
  await rpc(u, "configure_profile", ["estudante", JSON.stringify({ education_level: "graduacao", institution_id: ies.id, course_name: "Administração", semester: "3", registration_number: "123" })]);
  const lp = (await db.query("SELECT institution_id, institution_name, grace_until FROM learner_profiles WHERE user_id=$1 AND profile_role='estudante'", [u.id])).rows[0];
  assert.equal(lp.institution_id, ies.id);
  assert.equal(lp.institution_name, "Faculdade Parceira");
  assert.ok(lp.grace_until > new Date(Date.now() + 29 * 86400e3), "carência de ~30 dias");
  assert.equal((await db.query("SELECT institution_id FROM profiles WHERE id=$1", [u.id])).rows[0].institution_id, null, "profiles.institution_id é só de quem é IES");
});

test("A: instituição não parceira (texto livre) fica sem institution_id; id inexistente é recusado; campos por nível continuam obrigatórios", async () => {
  const u = await person(db, null);
  await rpc(u, "configure_profile", ["estudante", JSON.stringify({ education_level: "medio", institution_name: "Colégio X", school_year: "2º", classroom: "B" })]);
  assert.equal((await db.query("SELECT institution_id FROM learner_profiles WHERE user_id=$1", [u.id])).rows[0].institution_id, null);
  const v = await person(db, null);
  await expectError(rpc(v, "configure_profile", ["estudante", JSON.stringify({ education_level: "medio", institution_id: "00000000-0000-0000-0000-000000000000", school_year: "2º", classroom: "B" })]), /Instituição parceira não encontrada/);
  const w = await person(db, null);
  await expectError(rpc(w, "configure_profile", ["estudante", JSON.stringify({ education_level: "graduacao", institution_name: "UFX", course_name: "Direito", semester: "2" })]), /número de matrícula/);
  const x = await person(db, null);
  await expectError(rpc(x, "configure_profile", ["estudante", JSON.stringify({ education_level: "medio", institution_name: "Colégio" })]), /Série e turma/);
});

test("A: busca de instituições ignora caixa e acentos e exige 2 caracteres", async () => {
  await institution(db, "Universidade São Paulo Teste");
  const u = await person(db, "geral");
  const r = await as(db, u.id, d => d.query("SELECT name FROM search_institutions('sao paulo teste')"));
  assert.ok(r.rows.some(x => x.name === "Universidade São Paulo Teste"));
  assert.equal((await as(db, u.id, d => d.query("SELECT * FROM search_institutions('a')"))).rows.length, 0);
});

test("A: migração de dados vincula por nome exato (sem caixa/acentos) e registra contagens", async () => {
  const seeded = {};
  const mdb = await boot({ seedAfter: { tag: "0016", fn: async d => {
    const o = (await d.query("INSERT INTO auth.users(email) VALUES('o@x.com') RETURNING id")).rows[0].id;
    seeded.inst = (await d.query("INSERT INTO institutions(name,owner_id) VALUES('Faculdade Águia',$1) RETURNING id", [o])).rows[0].id;
    await d.query("INSERT INTO institutions(name,owner_id) VALUES('Dupla',$1),('DUPLA',$1)", [o]);
    for (const [k, nm] of [["a", "faculdade aguia"], ["b", "FACULDADE ÁGUIA "], ["c", "Outra Escola"], ["d", "dupla"]]) {
      seeded[k] = (await d.query("INSERT INTO auth.users(email) VALUES($1) RETURNING id", [`${k}@x.com`])).rows[0].id;
      await d.query("UPDATE profiles SET role='estudante' WHERE id=$1", [seeded[k]]);
      await d.query("INSERT INTO learner_profiles(user_id,profile_role,institution_name,course_name) VALUES($1,'estudante',$2,'Administração')", [seeded[k], nm]);
    }
    await d.query("INSERT INTO student_verifications(user_id,file_path,status) VALUES($1,'p','pendente')", [seeded.a]);
  } } });
  const rows = (await mdb.query("SELECT user_id, institution_id FROM learner_profiles")).rows;
  const by = id => rows.find(r => r.user_id === id).institution_id;
  assert.equal(by(seeded.a), seeded.inst);
  assert.equal(by(seeded.b), seeded.inst);
  assert.equal(by(seeded.c), null, "sem correspondência");
  assert.equal(by(seeded.d), null, "ambíguo (duas instituições com o mesmo nome normalizado) não vincula");
  assert.equal((await mdb.query("SELECT institution_id FROM student_verifications WHERE user_id=$1", [seeded.a])).rows[0].institution_id, seeded.inst, "declaração pendente passa à fila da IES");
  const log = Object.fromEntries((await mdb.query("SELECT metric,value FROM data_migration_log WHERE migration='0017'")).rows.map(r => [r.metric, Number(r.value)]));
  assert.equal(log["learner_profiles vinculados a uma instituição"], 2);
  assert.equal(log["learner_profiles sem correspondência única (ficam sem vínculo)"], 2);
});

test("A: declaração de aluno de IES parceira vai para a fila da IES; não parceira, para a equipe Upgrade", async () => {
  const ies = await institution(db, "IES Fila");
  const outra = await institution(db, "Outra IES");
  const prof = await person(db, "professor");
  const admin = await person(db, "geral");
  await db.query("INSERT INTO user_roles(user_id,role) VALUES($1,'admin')", [admin.id]);
  const aluno = await person(db, "estudante", { institutionId: ies.id, institutionName: "IES Fila" });
  const livre = await person(db, "estudante", { institutionName: "Escola Livre" });
  for (const a of [aluno, livre]) await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('student-declarations',$1)", [`${a.id}/estudante/d.pdf`]);
  const v1 = await rpc(aluno, "submit_student_verification", [`${aluno.id}/estudante/d.pdf`]);
  const v2 = await rpc(livre, "submit_student_verification", [`${livre.id}/estudante/d.pdf`]);
  const visible = async u => (await as(db, u.id, d => d.query("SELECT id FROM student_verifications"))).rows.map(r => r.id);
  assert.ok((await visible(ies.owner)).includes(v1), "IES vê a declaração do seu aluno");
  assert.ok(!(await visible(ies.owner)).includes(v2));
  assert.ok(!(await visible(outra.owner)).includes(v1), "outra IES não vê");
  assert.deepEqual(await visible(prof), [], "professor não vê declarações");
  assert.ok((await visible(admin)).includes(v2) && !(await visible(admin)).includes(v1), "equipe Upgrade só vê as não parceiras");
  // arquivo da declaração: só quem valida
  const objs = async u => (await as(db, u.id, d => d.query("SELECT name FROM storage.objects WHERE bucket_id='student-declarations'"))).rows.map(r => r.name);
  assert.ok((await objs(ies.owner)).includes(`${aluno.id}/estudante/d.pdf`));
  assert.ok(!(await objs(outra.owner)).includes(`${aluno.id}/estudante/d.pdf`));
  assert.deepEqual(await objs(prof), []);
  await expectError(rpc(outra.owner, "validate_student_verification", [v1, true, null, new Date(Date.now() + 86400e3).toISOString()]), /Validação não autorizada/);
  await expectError(rpc(admin, "validate_student_verification", [v1, true, null, new Date(Date.now() + 86400e3).toISOString()]), /Validação não autorizada/);
  await rpc(ies.owner, "validate_student_verification", [v1, true, null, new Date(Date.now() + 86400e3 * 365).toISOString()]);
});

test("A: subperfil da IES com escopo de curso só vê declarações do seu curso", async () => {
  const ies = await institution(db, "IES Escopo");
  const adm = await scope(db, ies.id, "ies", "Administração");
  const dir = await scope(db, ies.id, "ies", "Direito");
  const coord = await member(db, ies, "ies", "ies", ["validar_vinculos"], [adm]);
  const aAdm = await person(db, "estudante", { institutionId: ies.id, scopeId: adm });
  const aDir = await person(db, "estudante", { institutionId: ies.id, scopeId: dir });
  for (const a of [aAdm, aDir]) await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('student-declarations',$1)", [`${a.id}/estudante/d.pdf`]);
  const vAdm = await rpc(aAdm, "submit_student_verification", [`${aAdm.id}/estudante/d.pdf`]);
  const vDir = await rpc(aDir, "submit_student_verification", [`${aDir.id}/estudante/d.pdf`]);
  const seen = (await as(db, coord.id, d => d.query("SELECT id FROM student_verifications"))).rows.map(r => r.id);
  assert.ok(seen.includes(vAdm) && !seen.includes(vDir));
  await expectError(rpc(coord, "validate_student_verification", [vDir, true, null, new Date(Date.now() + 86400e3).toISOString()]), /Validação não autorizada/);
});

// ---------------------------------------------------------------- B1 + C. certificados
for (const role of ["estudante", "geral", "colaborador"]) {
  test(`B1/C: ${role} emite certificado do módulo e do curso com horas, sem declaração ou vínculo`, async () => {
    const c = await course(db, { modules: 2, skills: ["Excel Avançado"] });
    const u = await person(db, role);
    if (role === "colaborador") { const co = await company(db); await db.query("INSERT INTO company_employees(company_id,user_id,full_name,email) VALUES($1,$2,'N','n@x')", [co.id, u.id]); }
    // sem nenhuma declaração
    assert.equal((await db.query("SELECT count(*)::int n FROM student_verifications WHERE user_id=$1", [u.id])).rows[0].n, 0);
    const r1 = await rpc(u, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]);
    assert.equal(r1.passed, true); assert.equal(r1.certificate, true); assert.equal(r1.course_certificate, false);
    const mid = (await db.query("SELECT kind,hours,complementary,code FROM certificates WHERE user_id=$1 AND profile_role=$2", [u.id, role])).rows;
    assert.equal(mid.length, 1); assert.equal(mid[0].kind, "modulo"); assert.equal(Number(mid[0].hours), 1); assert.equal(mid[0].complementary, true); assert.ok(mid[0].code);
    const r2 = await rpc(u, "submit_assessment", [c.modules[1].id, JSON.stringify(RIGHT)]);
    assert.equal(r2.course_certificate, true);
    const all = (await db.query("SELECT kind,hours,module_id,code FROM certificates WHERE user_id=$1 ORDER BY kind", [u.id])).rows;
    assert.deepEqual(all.map(x => x.kind), ["curso", "modulo", "modulo"]);
    assert.equal(Number(all[0].hours), 2); assert.equal(all[0].module_id, null);
    assert.equal(new Set(all.map(x => x.code)).size, 3, "cada certificado tem código próprio");
    // reaprovação não duplica
    await rpc(u, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]);
    assert.equal((await db.query("SELECT count(*)::int n FROM certificates WHERE user_id=$1", [u.id])).rows[0].n, 3);
    // competências do curso concedidas e verificadas
    const comp = await as(db, u.id, d => d.query("SELECT name,level,origin,verified FROM my_competencies()"));
    assert.deepEqual(comp.rows.map(x => [x.name, x.origin, x.verified]), [["Excel Avançado", "curso", true]]);
  });
}

test("C: reprovação não emite certificado; parâmetro _complementary não existe mais", async () => {
  const c = await course(db, { modules: 1 });
  const u = await person(db, "estudante");
  const r = await rpc(u, "submit_assessment", [c.modules[0].id, JSON.stringify(WRONG)]);
  assert.equal(r.passed, false);
  assert.equal((await db.query("SELECT count(*)::int n FROM certificates WHERE user_id=$1", [u.id])).rows[0].n, 0);
  await expectError(as(db, u.id, d => d.query("SELECT submit_assessment($1,$2,true)", [c.modules[0].id, JSON.stringify(RIGHT)])), /does not exist|não existe/i);
});

test("C: certificado não é emitido por tempo de vídeo nem por inserção direta do cliente", async () => {
  const c = await course(db, { modules: 1 });
  const u = await person(db, "estudante");
  for (const l of c.modules[0].lessons) await rpc(u, "record_lesson_view", [l, 900]);
  assert.equal((await db.query("SELECT count(*)::int n FROM certificates WHERE user_id=$1", [u.id])).rows[0].n, 0);
  await expectError(as(db, u.id, d => d.query("INSERT INTO certificates(user_id,course_id,hours) VALUES($1,$2,1)", [u.id, c.id])), /Certificação exige avaliação|policy|permission/i);
});

test("B1: migração marca certificados existentes como complementary=true preservando hours, code e issued_at", async () => {
  const seeded = {};
  const mdb = await boot({ seedAfter: { tag: "0019", fn: async d => {
    seeded.u = (await d.query("INSERT INTO auth.users(email) VALUES('c@x.com') RETURNING id")).rows[0].id;
    await d.query("UPDATE profiles SET role='estudante' WHERE id=$1", [seeded.u]);
    seeded.c = (await d.query("INSERT INTO courses(title,slug) VALUES('Legado','legado') RETURNING id")).rows[0].id;
    await d.query("INSERT INTO certificates(user_id,course_id,profile_role,hours,code,issued_at,complementary) VALUES($1,$2,'estudante',12,'CODIGO12345','2026-03-01T10:00:00Z',false)", [seeded.u, seeded.c]);
  } } });
  const row = (await mdb.query("SELECT hours,code,issued_at,complementary,kind,legacy FROM certificates WHERE user_id=$1", [seeded.u])).rows[0];
  assert.equal(Number(row.hours), 12); assert.equal(row.code, "CODIGO12345"); assert.equal(row.issued_at.toISOString(), "2026-03-01T10:00:00.000Z");
  assert.equal(row.complementary, true); assert.equal(row.kind, "curso"); assert.equal(row.legacy, true);
  const comp = (await mdb.query("SELECT count(*)::int n FROM user_competencies WHERE user_id=$1", [seeded.u])).rows[0].n;
  assert.equal(comp, 0, "curso sem competências cadastradas não gera competências");
});

// ---------------------------------------------------------------- D. matching
test("D: sugestões só para compatíveis, gravadas no perfil do candidato, com motivos e sem duplicar", async () => {
  const co = await company(db);
  const c = await course(db, { modules: 1, skills: ["Python"] });
  const comp = await person(db, "estudante", { matching: true });
  const semComp = await person(db, "estudante", { matching: true });
  const desligado = await person(db, "estudante", { matching: false });
  for (const u of [comp, desligado]) { await rpc(u, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]); }
  const job = (await db.query("INSERT INTO jobs(company_id,title,required_skills,job_type,area) VALUES($1,'Dev',ARRAY['python'],'externa','Tecnologia') RETURNING id", [co.id])).rows[0].id;
  // Compat. por competência: só vira sugestão a competência do curso concluído
  assert.equal(await rpc(co.owner, "generate_job_matches", [job]), 1 - 0, "apenas o candidato compatível com matching ligado");
  const mine = await as(db, comp.id, d => d.query("SELECT reasons,status,profile_role FROM matches"));
  assert.equal(mine.rows.length, 1); assert.equal(mine.rows[0].profile_role, "estudante");
  assert.match(mine.rows[0].reasons[0], /competências exigidas.*Python/i);
  assert.equal((await as(db, semComp.id, d => d.query("SELECT 1 FROM matches"))).rows.length, 0);
  assert.equal((await as(db, desligado.id, d => d.query("SELECT 1 FROM matches"))).rows.length, 0);
  assert.equal(await rpc(co.owner, "generate_job_matches", [job]), 0, "não duplica");
  assert.equal((await as(db, comp.id, d => d.query("SELECT 1 FROM notifications WHERE title='Nova oportunidade sugerida'"))).rows.length, 1);
});

test("D: vaga sem competências obrigatórias usa a área pretendida; ligar o matching gera sugestões; desligar esconde e impede aceitar", async () => {
  const co = await company(db);
  const job = (await db.query("INSERT INTO jobs(company_id,title,required_skills,job_type,area) VALUES($1,'Analista',ARRAY[]::text[],'externa','Marketing Digital') RETURNING id", [co.id])).rows[0].id;
  const mesma = await person(db, "geral", { area: "marketing  digital", matching: false });
  const outra = await person(db, "geral", { area: "Finanças", matching: false });
  await rpc(mesma, "set_matching", [true]); await rpc(outra, "set_matching", [true]);
  const ms = await as(db, mesma.id, d => d.query("SELECT id,reasons FROM matches WHERE job_id=$1", [job]));
  assert.equal(ms.rows.length, 1); assert.match(ms.rows[0].reasons[0], /área que você pretende/);
  assert.equal((await as(db, outra.id, d => d.query("SELECT 1 FROM matches WHERE job_id=$1", [job]))).rows.length, 0);
  await rpc(mesma, "set_matching", [false]);
  assert.equal((await as(db, mesma.id, d => d.query("SELECT 1 FROM matches WHERE job_id=$1", [job]))).rows.length, 0, "pendentes somem ao desligar");
  await expectError(rpc(mesma, "respond_match", [ms.rows[0].id, true]), /Sugestão indisponível|Matching desativado/);
  await rpc(mesma, "set_matching", [true]);
  assert.equal((await as(db, mesma.id, d => d.query("SELECT 1 FROM matches WHERE job_id=$1", [job]))).rows.length, 1, "religar não duplica");
});

test("D: concluir curso com competência nova gera sugestões; empresa só vê perfil após aceite; colaborador não recebe vaga externa", async () => {
  const co = await company(db);
  const job = (await db.query("INSERT INTO jobs(company_id,title,required_skills,job_type) VALUES($1,'Analista SQL',ARRAY['SQL Dados'],'externa') RETURNING id", [co.id])).rows[0].id;
  const c = await course(db, { modules: 1, skills: ["SQL Dados"] });
  const aluno = await person(db, "estudante", { matching: true });
  assert.equal((await as(db, aluno.id, d => d.query("SELECT 1 FROM matches"))).rows.length, 0);
  await rpc(aluno, "submit_assessment", [c.modules[0].id, JSON.stringify(RIGHT)]);
  const m = await as(db, aluno.id, d => d.query("SELECT id FROM matches WHERE job_id=$1", [job]));
  assert.equal(m.rows.length, 1, "módulo/curso concluído gerou a sugestão");
  assert.equal((await as(db, co.owner.id, d => d.query("SELECT 1 FROM matches"))).rows.length, 0, "empresa não vê sugestão pendente");
  await rpc(aluno, "respond_match", [m.rows[0].id, true]);
  assert.equal((await as(db, co.owner.id, d => d.query("SELECT 1 FROM matches"))).rows.length, 1, "após aceite a empresa recebe");
  // colaborador nunca participa de matching externo
  const colab = await person(db, "colaborador", { matching: true });
  await db.query("INSERT INTO company_employees(company_id,user_id,full_name,email) VALUES($1,$2,'C','c@x')", [co.id, colab.id]);
  const c2 = await course(db, { modules: 1, skills: ["SQL Dados"] });
  await rpc(colab, "submit_assessment", [c2.modules[0].id, JSON.stringify(RIGHT)]);
  await db.query("SELECT create_matches(NULL,$1)", [colab.id]);
  assert.equal((await as(db, colab.id, d => d.query("SELECT 1 FROM matches"))).rows.length, 0);
});
