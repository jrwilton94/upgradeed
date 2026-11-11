// Fábricas de dados para os testes de banco. Escrevem como superusuário (equivale ao service_role).
import { newUser } from "./harness.mjs";

let seq = 0;
const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

export async function person(db, role, opts = {}) {
  const email = opts.email ?? `${role ?? "novo"}-${uid()}@teste.com`;
  const id = await newUser(db, email);
  if (role) await db.query("UPDATE profiles SET role=$2, full_name=$3 WHERE id=$1", [id, role, opts.name ?? email.split("@")[0]]);
  if (["estudante", "geral", "colaborador"].includes(role)) {
    await db.query(`INSERT INTO learner_profiles(user_id,profile_role,education_level,target_area,matching_enabled,grace_until,institution_id,institution_name,course_name,scope_id,works,seeks_job)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING`,
      [id, role, opts.level ?? "graduacao", opts.area ?? null, opts.matching ?? false, role === "estudante" ? (opts.graceUntil ?? new Date(Date.now() + 30 * 86400e3)) : null, opts.institutionId ?? null, opts.institutionName ?? null, opts.course ?? null, opts.scopeId ?? null, opts.works ?? false, opts.seeks ?? false]);
    await db.query("UPDATE profiles SET matching_enabled=$2 WHERE id=$1", [id, opts.matching ?? false]);
  }
  return { id, email };
}

export async function company(db, name = "Empresa Teste") {
  const owner = await person(db, "empresa");
  const c = (await db.query("INSERT INTO companies(name,code,owner_id) VALUES($1,$2,$3) RETURNING id", [name, `C${uid()}`.slice(0, 10).toUpperCase(), owner.id])).rows[0].id;
  await db.query("UPDATE profiles SET company_id=$2 WHERE id=$1", [owner.id, c]);
  return { id: c, owner };
}

export async function institution(db, name = "Instituição Teste") {
  const owner = await person(db, "ies");
  const i = (await db.query("INSERT INTO institutions(name,owner_id) VALUES($1,$2) RETURNING id", [name, owner.id])).rows[0].id;
  await db.query("UPDATE profiles SET institution_id=$2 WHERE id=$1", [owner.id, i]);
  return { id: i, owner };
}

export async function scope(db, orgId, type, name, kind = "curso") {
  return (await db.query("INSERT INTO organization_scopes(organization_id,organization_type,name,kind) VALUES($1,$2,$3,$4) RETURNING id", [orgId, type, name, kind])).rows[0].id;
}

/** Subperfil de organização com permissões e escopo. */
export async function member(db, org, type, role, permissions, scopeIds = []) {
  const u = await person(db, role);
  await db.query(`INSERT INTO organization_memberships(organization_id,organization_type,user_id,full_name,email,function_title,permissions,scope_ids,created_by)
    VALUES($1,$2,$3,'Subperfil',$4,'Função',$5,$6,$7)`, [org.id, type, u.id, u.email, permissions, scopeIds, org.owner.id]);
  return u;
}

/** Curso publicado e válido (módulos de 1h: 4 aulas de 15 min; jogo e avaliação). */
export async function course(db, { instructor = null, institutionId = null, modules = 2, skills = [], title } = {}) {
  const cid = (await db.query("INSERT INTO courses(title,slug,instructor_id,institution_id,hours) VALUES($1,$2,$3,$4,$5) RETURNING id", [title ?? `Curso ${uid()}`, `curso-${uid()}`, instructor, institutionId, modules])).rows[0].id;
  const mods = [];
  for (let i = 1; i <= modules; i++) {
    const m = (await db.query("INSERT INTO course_modules(course_id,title,position,hours,game) VALUES($1,$2,$3,1,'[{\"question\":\"Q\",\"answer\":\"A\"}]'::jsonb) RETURNING id", [cid, `Módulo ${i}`, i])).rows[0].id;
    const lessons = [];
    for (let l = 1; l <= 4; l++) lessons.push((await db.query("INSERT INTO lessons(course_id,module_id,title,duration_min,position,video_path) VALUES($1,$2,$3,15,$4,'https://cdn.teste.com/v.mp4') RETURNING id", [cid, m, `Aula ${l}`, l])).rows[0].id);
    await db.query(`INSERT INTO module_assessments(module_id,questions,minimum_score) VALUES($1,'[{"question":"1+1?","options":["1","2"],"answer":1},{"question":"2+2?","options":["4","5"],"answer":0}]'::jsonb,70)`, [m]);
    mods.push({ id: m, lessons });
  }
  for (const name of skills) {
    const slug = name.toLowerCase().replace(/\W+/g, "-");
    const sid = (await db.query("INSERT INTO skills(name,slug) VALUES($1,$2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id", [name, slug])).rows[0].id;
    await db.query("INSERT INTO course_skills(course_id,skill_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [cid, sid]);
  }
  await db.query("UPDATE courses SET published=true,status='publicado',media_approved=true WHERE id=$1", [cid]);
  return { id: cid, modules: mods };
}

export const RIGHT = [1, 0];
export const WRONG = [0, 1];
