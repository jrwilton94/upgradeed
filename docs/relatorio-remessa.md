# Relatório da remessa — ajustes das nove partes (blocos A–I)

Branch: `ajustes-remessa-9-partes` · Nada foi publicado ou aplicado no Lovable: as migrações `0016`–`0025` só rodam quando o Lovable as aplicar após o merge.

**Como foi verificado (e o que não foi).** As regras de banco (RLS, funções, migrações de dados) foram executadas em PostgreSQL real via PGlite com *stubs* do Supabase (`auth`, `storage`, `pg_cron`): `tests/db`, `npm test` dentro dessa pasta, **48 testes, todos passando**. Não é o Supabase real. `npx tsc --noEmit` e `npm run build` passam. **Não** foram feitos percursos reais em telas, nem verificação em celular, nem chamadas ao Supabase hospedado.

## 1. Criado

| Item | O quê |
|---|---|
| Migrações | `0016` fundações (log de migração, `platform_settings`, CNPJ/status, carência) · `0017` vínculo estudante↔IES · `0018` `user_competencies` · `0019` motor único de matching · `0020` certificados por módulo/curso · `0021` ciclo de elegibilidade do Estudante + importação CSV · `0022` score (conclusão por módulo), painel do professor, relatório agregado da IES · `0023` histórico acadêmico, testes de perfil, faturamento/relatórios da empresa, professores/cursos da IES, `admin_register_professor`, trava do seletor de teste · `0024` correção do desligamento (histórico completo ao virar Geral) |
| Funções (DB) | `search_institutions`, `student_status`, `import_student_invites`, `claim_student_invites`, `migrate_learner_role`, `run_student_lifecycle` (+ agenda `pg_cron` protegida), `create_matches`, `my_competencies`, `teacher_dashboard`, `ies_aggregate_report`, `ies_suppress`, `get_profile_test`, `submit_profile_test`, `register_academic_document`, `apply_academic_extraction` (somente servidor), `company_billing`, `company_report`, `ies_link_teacher/unlink/list`, `ies_list_courses`, `ies_set_course_scope`, `admin_register_professor`, `test_switch_enabled` |
| Tabelas | `data_migration_log`, `platform_settings`, `student_import_batches`, `student_invites`, `user_competencies`, `academic_documents`, `profile_tests`, `ies_teachers` · bucket privado `academic-history` |
| Telas | `/ies/relatorios`, `/ies/professores`, `/ies/cursos`, `/empresa/faturamento`, `/empresa/relatorios`; componentes de importação CSV, seletor de instituição parceira, painel de competências/testes/histórico |
| Servidor | rota `POST /api/public/run-student-lifecycle` (segredo `STUDENT_LIFECYCLE_SECRET`), alternativa ao `pg_cron` |
| Testes | `tests/db/*.test.mjs` (blocos A–D, B2, E–I, Parte 9) |

## 2. Alterado (antes → depois)

- `submit_assessment(módulo, respostas, _complementary)` → `submit_assessment(módulo, respostas)`: certificado do módulo e do curso **sempre com horas**, sem depender de declaração.
- Certificados: unicidade `(usuário, curso, perfil)` → índices parciais por tipo (`curso` / `módulo`); legados marcados `complementary=true`, `kind='curso'`.
- Matching: cálculo no navegador (`src/lib/matching.ts`) → motor único no banco (`create_matches`), também ao ligar o matching e ao ganhar competência nova; painéis leem só `matches`.
- Declaração estudantil: exigência na emissão de horas → apenas comprova elegibilidade ao Perfil Estudante; carência de 30 dias (configurável), aviso 15 dias antes e no dia, migração a Geral com histórico, retorno ao Estudante com nova declaração validada.
- Fila de validação: IES parceira valida os seus alunos (respeitando escopo); equipe Upgrade só vê instituições não parceiras.
- Painel do professor: colunas estáticas de `courses` → `teacher_dashboard()` (vídeos mais vistos, todos os módulos, minutos, conclusão por módulo, score/fundo do mês, saldo/recebimentos). Colunas antigas mantidas.
- Score: conclusão = média por módulo (aprovados ÷ iniciantes no mês) → por autor; produção só de vídeos com audiência; normalização mantida.
- `behavioral_tests`: escrita direta pelo navegador bloqueada; resultado só via `submit_profile_test`.
- `switch_test_profile`: exige `platform_settings.test_profile_switch_enabled` (padrão **desligado**).
- Cadastro de professor: `UPDATE` direto em `profiles` → `admin_register_professor` com log. Fundos: envolto em `AdminGate`. CNPJ opcional (14 dígitos) e status em empresas/IES.
- `types.ts`, `_journal.json`/snapshots (stubs no padrão existente) e `routeTree.gen.ts` atualizados.

### Defeitos encontrados e corrigidos no caminho
1. `least(NULL, x)` em `calculate_author_fund`: sessão < 20 s contava como o vídeo inteiro (violava a regra de 20 s). Corrigido na `0022`.
2. Sugestões gravadas com `profile_role='empresa'` (trigger sobrescrevia) → corrigido na `0016`.
3. Desligamento de colaborador não copiava competências/testes e transformava certificado de módulo em "curso" → `0024` (teste P9-04).
4. `submit_assessment` antigo podia rebaixar progresso após troca de perfil → usa `greatest` e conta tentativas entre perfis.

## 3. Mantido
Usuários, cursos, aulas, matrículas, certificados, visualizações, declarações, códigos e datas de emissão; identidade visual, FAQs, nomes (`Profissional` = `geral`), subperfis/auditoria da remessa anterior, RLS por `profile_role`; migrações `0001`–`0015` intactas.

## 4. Removido (com motivo)
- `src/lib/matching.ts` e o checkbox "Emitir com horas complementares": regra B1/D (sem cálculo no cliente; horas sempre).
- Assinatura antiga de `submit_assessment` (`DROP FUNCTION` só da assinatura, substituída): remove o parâmetro `_complementary`.
- `ON CONFLICT DO NOTHING` na emissão: trocado por verificação de existência (ver dúvida 8).
- **Nenhum** `DELETE`, `DROP TABLE` ou `DROP COLUMN`.

## 5. Migrações de dados (contagens)
Cada migração grava em `data_migration_log` as contagens "antes:" (0016) e "depois:" (0023) de perfis, cursos, matrículas, certificados, visualizações, declarações e perfis de aprendizado, além de: alunos vinculados a instituição, sem correspondência/ambíguos, declarações redirecionadas, escopos resolvidos, competências criadas, certificados marcados. **Os números reais só existem quando o Lovable aplicar as migrações**: consulte `SELECT * FROM data_migration_log ORDER BY id;`. Em banco de teste vazio (só o catálogo de 12 cursos) os valores são 0 / 12 → 12. Nos testes com dados semeados (P9-22, A) as contagens antes = depois.

## 6. Pendências e dúvidas (com a decisão tomada)
1. **Extração de histórico acadêmico por IA (F1):** não há infraestrutura de IA; entregue arquivo privado + tabela + função de aplicação só-servidor que aceita apenas nomes do catálogo. Nenhum resultado simulado. Retenção/expurgo do arquivo **não** implementado.
2. **`pg_cron`:** a agenda diária é criada só se a extensão existir; senão use a rota `/api/public/run-student-lifecycle` com `STUDENT_LIFECYCLE_SECRET` (configurar e agendar externamente). Sem um dos dois, a migração/aviso do Estudante não roda sozinha.
3. **Seletor de perfis de teste desligado por padrão:** a conta de teste não alterna perfis até a equipe executar `UPDATE platform_settings SET test_profile_switch_enabled = true;` (decisão 6).
4. **Escopo por nome:** `learner_profiles.scope_id` é resolvido pelo nome do curso informado; nomes sem correspondência ficam sem escopo (visíveis só a quem não tem restrição).
5. **Planos:** plano de estudante → `geral_mensal`, aplicado no próximo ciclo; mapeamento a confirmar.
6. **Competência de curso:** nível 40 por curso certificado (valor provisório); testes geram competências "não verificadas" (origem `teste`); conteúdo dos testes é um conjunto mínimo a revisar pedagogicamente.
7. **Turmas (F7):** sem entidade própria; o escopo (curso/campus/centro) faz o papel. Vínculo de professor à IES é só cadastro (sem aceite do professor; ele recebe notificação) e não dá acesso aos cursos dele.
8. **Emissão sem `ON CONFLICT`:** substituída por verificação de existência dentro de `submit_assessment` (corrida entre duas requisições simultâneas é barrada pelos índices únicos parciais).
9. **Relatório socioeconômico (G):** limitado a atributos não sensíveis existentes (trabalha, busca emprego, nível de ensino); supressão k<5 com supressão complementar **apenas nas quebras por grupo**. Desde a `0025`, os totais (estudantes, horas, conclusão) aparecem sempre, mesmo com menos de 5 estudantes; nesse caso a tela avisa e as quebras ficam como "Dados insuficientes". O corte (5) e a supressão complementar podem ser revistos com o jurídico (LGPD).
10. **Bucket `student-declarations`:** sua criação não está no repositório (veio do Lovable); o bucket `academic-history` é criado pela `0023`.
11. **Lint:** o baseline de 2.325 problemas (2.318 erros de formatação + 7 avisos) foi zerado em commit separado só de formatação (`667acbb`); restam 7 avisos `react-refresh/only-export-components` em componentes de UI, que não afetam produção.
12. **A confirmar com você:** como o Lovable aplica `drizzle/migrations` e se `0014`/`0015` já foram aplicados; `.lovable/north-star/` foi mantido.
13. **Exemplo numérico da normalização (H)** — mês com R$ 1.000,00 pagos, fundo de professores 25% = R$ 250,00; pesos 55/25/20. Autor A (2 módulos: 50% e 100% de conclusão → taxa 75%; 60 min de 100; 2 de 3 vídeos produzidos com audiência) e autor B (1 módulo, 25%; 40 min):
   audiência A 0,60 / B 0,40; produção A 0,667 / B 0,333; conclusão A 0,75 / B 0,25 (taxas já somam 1,00).
   Score A = 0,55·0,60 + 0,25·0,667 + 0,20·0,75 = **0,6467**; B = 0,55·0,40 + 0,25·0,333 + 0,20·0,25 = **0,3533**; soma 1,00 (normalização inalterada).
   Repasse: A R$ 161,67 · B R$ 88,33 (R$ 250,00 integralmente distribuídos). Valores reproduzidos em `remessa-e-i.test.mjs`.

## 7. Checklist da Parte 9 (22 itens)

Os itens 8–11 foram **reavaliados pela nova regra do bloco B** (declaração só comprova elegibilidade ao Perfil Estudante; certificados com horas nunca dependem dela). O texto original deles ("declaração pedida na primeira emissão", "bloqueia horas") foi **substituído**, não descumprido.

| # | Item | Situação | Evidência |
|---|---|---|---|
| 1 | Professor sem acesso a dados de usuário | **Atendido** | `part9` P9-01 (consultas diretas e funções retornam vazio/negado) |
| 2 | IES só agregados; nenhuma tela/exportação individual | **Atendido** | P9-02; `remessa-e-i` G (relatório e CSV usam a mesma função agregada) |
| 3 | Colaborador não vê/recebe vaga externa | **Atendido** | P9-03; D (sem matching externo) |
| 4 | Desligado migra a Geral com histórico íntegro | **Atendido** | P9-04 (+ correção `0024`) |
| 5 | Empresa não lista candidatos que não aceitaram | **Atendido** | P9-05 |
| 6 | Certificado só após aprovação | **Atendido** | `remessa-a-d` C (reprovação, inserção direta, tempo de vídeo) |
| 7 | Matrícula (grad/pós) e série/turma (médio) | **Atendido** | A (`configure_profile`) |
| 8 | Cadastro conclui sem declaração *(nova regra B)* | **Atendido** | A, B2 carência |
| 9 | Sem vínculo validado: estuda, recebe vagas e emite certificado com horas *(nova regra B)* | **Atendido** | B1/C (estudante/geral/colaborador sem declaração), D |
| 10 | Vínculo expirado *(nova regra B: migra a Geral, sem bloquear horas)* | **Atendido** | B2 expiração/aviso/retorno |
| 11 | Declaração visível só a quem valida | **Atendido** | A (tabela e arquivo; professor, outra IES e escopo fora negados) |
| 12 | Módulo < 1 h recusado na publicação | **Atendido** | P9-12 |
| 13 | Visualização < 20 s não conta no score | **Atendido** | H (corrigido bug `least(NULL)`), P9-14 |
| 14 | Mesmo vídeo 5× no dia conta uma vez | **Atendido** | P9-14 |
| 15 | Subperfil sem permissão não vê o menu nem acessa a rota | **Não marcado como atendido** | Negação nos dados/funções testada (F4–F7, G, B2); **menu e rota direta por tela não foram testados** |
| 16 | Escopo do depto A não vê o B | **Atendido** | P9-16 (empresa), A/G/F7 (IES) |
| 17 | Subperfil não concede o que não tem | **Atendido** | P9-17 |
| 18 | Toda ação de subperfil no log | **Não marcado como atendido** | Registro provado para acesso, importação, vínculo de professor, escopo de curso, cadastro de professor, empresa; **não provado exaustivamente para toda ação** |
| 19 | Sem campos de raça/gênero/idade/religião/saúde | **Atendido** | P9-19 (varredura de colunas do schema público) |
| 20 | Desligar matching para sugestões na hora | **Atendido** | D (pendentes somem e não é possível aceitar) |
| 21 | Telas funcionam no celular | **Não atendido (não verificado)** | Sem teste em dispositivo/viewport; telas novas usam grade responsiva e foram só compiladas |
| 22 | Nada existente perdido na migração | **Atendido (em teste)** | P9-22 e A/B1 com dados semeados; contagens reais aparecerão em `data_migration_log` ao aplicar |

Resumo: 19 atendidos, 2 não marcados (15, 18) e 1 não atendido/verificado (21).
