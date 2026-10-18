# Upgrade Educação — adequação às nove partes

## Objetivo
Adaptar o projeto existente, sem refazê-lo e sem apagar usuários, cursos, matrículas, certificados ou histórico. Preservar páginas, identidade visual, FAQs e funções já conformes. Manter o nome público **Profissional** para o perfil interno `geral`.

## 1. Segurança e isolamento dos seis perfis
- Revisar as permissões tanto nas telas e endereços diretos quanto no acesso aos dados; ocultar um menu não substitui autorização.
- Preservar a separação de matrículas e certificados já existente e completar o isolamento de competências, progresso, avaliações, preferências, testes e sugestões dos perfis de teste que compartilham um login.
- Impedir Professor e IES de acessar dados de estudantes pelas páginas de aprendizado ou vagas. Professor acessa apenas seu conteúdo, desempenho e recebimentos.
- Proteger atribuição de perfis privilegiados e vínculos organizacionais: privilégios não poderão ser obtidos alterando o próprio cadastro.

## 2. Subperfis de Empresa e IES — prioridade da remessa
- Criar gestão de acessos com nome, e-mail, função, status, último acesso, permissões independentes e escopo.
- Adicionar criação/edição, suspensão e remoção de acesso, sem apagar histórico; contas usam acesso individual, sem compartilhar senha do titular.
- Implementar todas as permissões listadas no documento, agrupadas por tema. Dados bancários e faturamento estarão desligados por padrão.
- Cadastrar departamentos/unidades/centros de custo e cursos/campi/centros para definir os escopos. Escopo vazio representa toda a organização.
- Aplicar as mesmas restrições a listagens, detalhes, ações e exportações. Um gestor delegado não poderá conceder permissões ou ampliar escopos além do próprio acesso.
- Permitir transferência da titularidade somente pelo titular atual, para uma conta elegível da organização.
- Registrar ações autorizadas em auditoria, com filtros por pessoa, ação e período; alterações de acesso terão efeito imediato.

## 3. Cadastro e vínculo estudantil
- Estudante: cadastro em duas etapas, com campos condicionais de escolaridade e informações profissionais. Graduação/pós exigem matrícula, curso e semestre; ensino médio exige série e turma.
- Profissional: cadastro de escolaridade e objetivos de mercado, sem declaração ou matrícula obrigatória.
- Colaborador: vínculo criado pela empresa, não adquirido apenas digitando um código público.
- Permitir histórico acadêmico opcional com extração assistida de competências, excluindo dados sensíveis do resultado persistido.
- Solicitar declaração apenas na primeira emissão com horas complementares. Criar envio, pendência, validação, recusa com motivo, reenvio, validade e renovação.
- Manter aprendizado e sugestões acessíveis antes da validação; certificados sem horas complementares não dependerão da declaração.
- Criar fila administrativa para instituições não parceiras e fila restrita de validação para instituições parceiras, conforme a decisão de privacidade abaixo.

## 4. Cursos, módulos, aulas e certificados
- Adaptar cursos e aulas existentes e adicionar módulos, vídeo, jogo de fixação e avaliação por módulo ou curso.
- Validar publicação: ao menos uma hora por módulo, organizada em quatro aulas de quinze minutos ou seis de dez; jogo e avaliação obrigatórios.
- Criar envio de conteúdo e estados rascunho/em avaliação/publicado/suspenso. Conteúdo sem aprovação não entrará no catálogo público, mas continuará visível ao autor autorizado.
- Avaliar respostas no servidor e emitir certificado somente após aprovação; impedir emissão ou manipulação do resultado pelo navegador.
- Registrar horas e código de verificação, preservando todos os certificados antigos. Quando houver necessidade de vínculo, reter a emissão com horas até validação vigente.
- Registrar sessões de visualização reais; o botão atual de marcar aulas não será usado como evidência financeira ou aprovação.

## 5. Academia corporativa e mobilidade
- Adicionar cadastro/edição/desligamento de colaboradores, cargos, competências exigidas e trilhas internas.
- Empresa e subperfis autorizados verão apenas colaboradores pertencentes ao seu escopo, com competências e gaps por cargo.
- Colaborador verá cargo atual/alvo, distância de competências, trilha, certificados e vagas internas compatíveis da própria empresa.
- Desligamento revogará o acesso da organização e migrará o usuário para Profissional preservando histórico. Nos perfis de teste, não misturar os históricos independentes durante essa migração.

## 6. Matching com consentimento
- Diferenciar vagas internas e externas; Colaborador nunca verá ou receberá vagas externas, inclusive por endereço direto.
- Gerar sugestões justificadas para usuários ativos e elegíveis com matching ligado, e enviar notificações com os dados da vaga.
- Empresa receberá o perfil somente após candidatura confirmada. Não haverá busca livre de candidatos, contratação automática, eliminação automática ou ranking público.
- O controle liga/desliga persistirá imediatamente e interromperá sugestões ao desligar.
- Adicionar acompanhamento de candidaturas e link de cadastro enviado pela empresa a candidatos aprovados.

## 7. Fundos e conta de recebimento
- Aproveitar pagamentos, assinaturas e registros financeiros existentes; adicionar apurações mensais, configuração de pesos, scores e conta de recebimento privada.
- Separar os fundos: 25% da receita para professores e 10% para IES. Disponibilizar os presets MVP 50/40/10, Tração 55/25/20 e Escala 60/20/20.
- Implementar audiência elegível: sessão a partir de vinte segundos, limite de uma duração do vídeo por usuário/dia e exclusão de vídeos sem audiência mensal do denominador.
- Exibir score e estimativa corrente, fechamento mensal e histórico de recebimentos. Não apresentar estimativa como pagamento realizado.
- Preparar registro autorizado de pagamento e dados bancários; transferência bancária automática depende de serviço financeiro contratado e credenciais, e não será simulada.

## 8. Painéis e verificação final
- Completar os painéis existentes conforme as atribuições, preservando as disposições próprias de cada perfil.
- Separar componentes e consultas de dados de Estudante e Profissional; compartilhar somente elementos visuais sem acesso a dados.
- Manter relatórios institucionais e exportações estritamente agregados, sem prometer documentos oficiais do MEC.
- Verificar cadastro, avaliações, declaração, acessos delegados, escopos, revogação, matching, isolamento e fundos com testes de regras e percursos reais nas telas.
- Verificar todas as telas alteradas no celular e no computador, além dos endereços diretos proibidos.
- Entregar **um único relatório final**: Criado, Alterado (antes/depois), Mantido, Removido, Migrações de dados, Pendências e dúvidas e os 22 itens da Parte 9 individualmente marcados como atendidos ou não atendidos. Um item sem teste conclusivo não será marcado como atendido.

## Decisões para ambiguidades
1. **Privacidade da IES:** o documento exige validação individual de declarações e, simultaneamente, proíbe qualquer dado identificável. A interpretação proposta é uma exceção estritamente operacional, acessível somente a validadores explícitos, para a declaração e os dados mínimos necessários da fila. Os demais painéis e exportações continuarão agregados. Caso essa exceção não seja aceita, toda validação deverá permanecer com a equipe Upgrade.
2. **Score:** usar Tração 55/25/20 como configuração inicial, pois corresponde à fórmula expressa; os três presets permanecerão disponíveis. Registrar a configuração usada em cada fechamento.
3. **Ensino básico:** incluir ensino básico com instituição, série e turma, pois a seção de elegibilidade o inclui, embora a lista inicial de níveis não o contenha.
4. **Padrão de vídeo:** formato, resolução e áudio não têm valores definidos no documento. Manter novos envios em avaliação até a configuração administrativa e aprovação, sem inventar requisitos numéricos.
5. **Conta digital:** apresentar saldo apurado e recebimentos registrados; não criar conta bancária real nem prometer transferência sem um provedor financeiro.
6. **Dados sensíveis em documentos:** não extrair ou persistir atributos sensíveis. Arquivos acadêmicos podem conter esses dados incidentalmente; limitar sua finalidade, acesso e retenção e registrar essa limitação no relatório, sem afirmar que um arquivo livre garante ausência desses dados.

## Detalhes técnicos
- Usar alterações aditivas e preenchimento dos novos campos a partir dos registros existentes; manter nomes de entidades equivalentes, como `profiles`, `companies`, `institutions`, `skills`, `courses`, `lessons`, `enrollments`, `certificates`, `jobs`, `matches`, `payments` e `activity_logs`.
- Usar contas de autenticação existentes para senhas; nunca adicionar coluna de senha aos perfis.
- Guardar permissões organizacionais em estruturas protegidas separadas do perfil editável, com políticas de acesso, concessões explícitas e funções autenticadas para operações críticas.
- Usar Lovable Cloud para persistência e arquivos privados; autorização de leitura da declaração também deverá ser aplicada aos arquivos, não apenas à fila.
- Executar operações internas no servidor do aplicativo e manter segredos fora do navegador. Aplicar validação de entradas e transações nos fluxos de certificação, acesso e desligamento.
- Medir contagens de registros antes/depois, preservar evidências legadas e evitar reinterpretá-las como audiência ou avaliações verificadas.
- Não publicar automaticamente; esta remessa altera segurança e regras operacionais e terá sua situação de implantação indicada no relatório.