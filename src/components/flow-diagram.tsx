import { ArrowDown, ShieldCheck } from "lucide-react";

const STEPS = [
  { label: "Aprender", note: "Decisão do usuário" },
  { label: "Desenvolver Competências", note: "Atividade na plataforma" },
  { label: "Construir Perfil", note: "Perfil de competências verificadas" },
  { label: "Receber Matching Inteligente", note: "Sistema — apenas sugestão", ai: true },
  { label: "Aceitar candidatura", note: "Decisão do usuário" },
  { label: "Empresa avalia", note: "Decisão da empresa" },
  { label: "Contratação", note: "Decisão da empresa" },
];

export function FlowDiagram() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      {STEPS.map((step, index) => (
        <div key={step.label}>
          <div
            className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 shadow-soft ${
              step.ai
                ? "border-brand/60 bg-brand-soft"
                : "border-border bg-card"
            }`}
          >
            <div>
              <p className="font-display text-base font-bold text-foreground">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.note}</p>
            </div>
            <span className="font-display text-sm font-bold text-brand">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className="flex justify-center py-2">
              <ArrowDown className="size-4 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-secondary/60 p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" />
        <div className="text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">A Upgrade apenas recomenda.</p>
          <p>Nunca contrata. Nunca elimina candidatos. Nunca cria ranking público.</p>
        </div>
      </div>
    </div>
  );
}