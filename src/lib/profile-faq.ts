import type { ProfileRole } from "@/lib/profiles";

export const PROFILE_FAQ: Record<ProfileRole, { q: string; a: string }[]> = {
  "estudante": [
    {
      "q": "O que está incluído no plano estudantil?",
      "a": "Acesso a cursos com direito a certificado, recebimento de vagas baseadas no seu perfil profissional/pessoal, testes vocacionais e comportamentais, além de orientação de carreira."
    },
    {
      "q": "Preciso estar matriculado em uma instituição?",
      "a": "Sim. Para assinar ou manter o Plano Estudantil ativo, você deve estar regularmente matriculado em uma instituição de ensino."
    },
    {
      "q": "Os certificados valem como horas complementares?",
      "a": "Cada certificado registra a carga horária do curso e pode ser apresentado à sua instituição. O aproveitamento segue as regras de horas complementares de cada instituição."
    },
    {
      "q": "Meus dados vão para empresas?",
      "a": "Se o seu sistema de matching estiver ativado, você pode receber vagas alinhadas ao seu perfil. Ao se candidatar, a empresa recebe os dados do seu perfil para validar e proceder com a candidatura."
    },
    {
      "q": "Posso cancelar quando quiser?",
      "a": "Sim. O cancelamento é feito no painel e o acesso continua ativo até o fim do período já pago."
    }
  ],
  "geral": [
    {
      "q": "Preciso ter vínculo com faculdade ou empresa?",
      "a": "Não. O plano profissional é individual e independe de qualquer vínculo institucional ou empresarial."
    },
    {
      "q": "O que recebo com a assinatura?",
      "a": "Acesso a cursos com direito a certificado, recebimento de vagas baseadas no perfil profissional/pessoal, testes vocacionais e comportamentais, além de trilhas de conhecimentos baseadas nos seus objetivos profissionais."
    },
    {
      "q": "Como funcionam as sugestões de oportunidades?",
      "a": "As empresas publicam vagas com as competências necessárias, e a plataforma notifica os perfis mais compatíveis. Você decide se quer se candidatar."
    },
    {
      "q": "Posso desativar o sistema de matching?",
      "a": "Sim, a qualquer momento. Com o matching desativado, você continua estudando normalmente e não recebe sugestões de vagas."
    },
    {
      "q": "Posso cancelar quando quiser?",
      "a": "Sim, a qualquer momento pelo painel, mantendo o acesso até o fim do período pago."
    }
  ],
  "colaborador": [
    {
      "q": "Eu pago alguma coisa?",
      "a": "Não. O acesso do colaborador é contratado pela empresa."
    },
    {
      "q": "Minha empresa ainda não usa a Upgrade. O que faço?",
      "a": "Preencha o formulário de indicação nesta página. Nosso time entra em contato com a área responsável."
    },
    {
      "q": "Minha empresa vê tudo o que eu faço?",
      "a": "A empresa acompanha o progresso ligado ao plano de desenvolvimento e seu perfil, assim ela saberá se seu perfil é apto a uma possível promoção."
    },
    {
      "q": "Posso escolher trilhas para outra área da empresa?",
      "a": "Sim. Você indica o cargo que quer alcançar e recebe trilhas para se preparar para ele, além do conteúdo ligado ao seu cargo atual."
    },
    {
      "q": "Recebo vagas de outras empresas?",
      "a": "Não. O perfil de colaborador não participa do sistema de matching. Você pode ser notificado apenas sobre vagas internas da sua empresa."
    }
  ],
  "professor": [
    {
      "q": "Quem pode ser professor na Upgrade?",
      "a": "Professores, acadêmicos, recém-formados e profissionais com domínio do conteúdo. Nosso time avalia a área de atuação antes da aprovação."
    },
    {
      "q": "Como funciona a remuneração?",
      "a": "25% da receita mensal da plataforma forma o fundo dos professores. Cada professor recebe uma parte do fundo proporcional ao seu score, que considera a audiência, o volume de conteúdo publicado e a taxa de conclusão dos seus cursos."
    },
    {
      "q": "Como faço para me tornar professor parceiro?",
      "a": "Preencha o formulário desta página. Nosso time avalia sua área de atuação e apresenta os próximos passos."
    },
    {
      "q": "Preciso de estúdio ou equipamento profissional?",
      "a": "Não. Enviamos o roteiro pedagógico e o padrão mínimo de qualidade de áudio e vídeo."
    },
    {
      "q": "Posso divulgar outros serviços além dos cursos?",
      "a": "Sim. Você pode divulgar aulas particulares, palestras e outros serviços para uma audiência interessada no seu conhecimento."
    }
  ],
  "ies": [
    {
      "q": "A IES paga para acessar o perfil na Upgrade?",
      "a": "Ao oferecer ou facilitar o acesso da Upgrade aos alunos, não haverá custo adicional para a instituição parceira."
    },
    {
      "q": "Como a Upgrade ajuda a reduzir a evasão?",
      "a": "O aluno conta com suporte à vida acadêmica, reforço nas disciplinas da graduação e uma conexão concreta com o mercado de trabalho. Os relatórios ajudam a instituição a identificar onde agir."
    },
    {
      "q": "Quais dados a instituição visualiza?",
      "a": "Apenas indicadores agregados de desenvolvimento, competências e empregabilidade, seja de alunos ou egressos."
    },
    {
      "q": "Como os dados ajudam nas decisões acadêmicas?",
      "a": "Os indicadores mostram quais competências estão sendo desenvolvidas e como se relacionam às exigências do mercado, apoiando ajustes de currículo e ações de empregabilidade."
    },
    {
      "q": "A instituição pode publicar conteúdo?",
      "a": "Sim. A instituição pode publicar cursos na plataforma. É remunerada pelo fundo de 10% da receita mensal (sem relação com o fundo de professores, mas segue o modelo de scores), dividido apenas entre as instituições com conteúdo ativo."
    },
    {
      "q": "O conteúdo continua sendo da instituição?",
      "a": "O conteúdo entra por cessão de direito autoral, e a instituição pode retirá-lo do ar quando quiser."
    },
    {
      "q": "Como iniciamos a parceria?",
      "a": "Preencha o formulário desta página e receba contato do nosso time especializado."
    }
  ],
  "empresa": [
    {
      "q": "Como a Upgrade ajuda minha empresa?",
      "a": "A Upgrade conecta desenvolvimento de pessoas, competências e oportunidades para apoiar decisões de contratação, desenvolvimento e mobilidade interna."
    },
    {
      "q": "A Upgrade substitui o processo de seleção da empresa?",
      "a": "Não. A Upgrade identifica e sugere profissionais com maior compatibilidade, mas a decisão de avançar, entrevistar e contratar permanece sempre com a empresa."
    },
    {
      "q": "Como funciona o sistema de matching?",
      "a": "A empresa publica a vaga com as competências necessárias, e a plataforma notifica os profissionais mais compatíveis. Quem aceitar se candidata, e o recrutamento segue normalmente."
    },
    {
      "q": "Consigo ver os perfis antes da candidatura?",
      "a": "Não. A empresa recebe o perfil somente depois que o profissional aceita se candidatar. Isso garante que todo candidato recebido tem interesse real na vaga."
    },
    {
      "q": "Posso usar a Upgrade para desenvolver meus colaboradores?",
      "a": "Sim. A empresa pode direcionar trilhas de desenvolvimento de acordo com o cargo atual e com as posições que o colaborador deseja alcançar."
    },
    {
      "q": "A Upgrade ajuda a reduzir turnover?",
      "a": "A plataforma pode apoiar estratégias de desenvolvimento e mobilidade interna, ajudando a criar caminhos de crescimento para os colaboradores e a aproveitar melhor os talentos que a empresa já possui."
    },
    {
      "q": "Posso segregar vagas só para o time interno?",
      "a": "Sim. A plataforma busca entre os seus colaboradores os perfis mais compatíveis com a vaga proposta."
    },
    {
      "q": "Minha empresa é pequena e não tem RH. A Upgrade serve para nós?",
      "a": "Sim. Você publica vagas e recebe candidatos compatíveis sem precisar de uma estrutura de RH."
    }
  ]
};
