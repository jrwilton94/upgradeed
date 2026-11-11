import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  name: string;
  institutionId: string;
  onChange: (value: { name: string; id: string }) => void;
};

/** Busca instituições parceiras; quem não encontra a sua pode informar o nome livremente (sem vínculo de parceria). */
export function InstitutionPicker({ name, institutionId, onChange }: Props) {
  const [term, setTerm] = useState(name);
  const [debounced, setDebounced] = useState(name);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(t);
  }, [term]);
  const { data } = useQuery({
    queryKey: ["search-institutions", debounced],
    enabled: debounced.length >= 2 && !institutionId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_institutions", { _query: debounced });
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <div className="sm:col-span-2">
      <Label htmlFor="institution_name">Instituição</Label>
      <Input
        id="institution_name"
        value={term}
        maxLength={160}
        autoComplete="off"
        onChange={(e) => {
          setTerm(e.target.value);
          onChange({ name: e.target.value, id: "" });
        }}
      />
      {institutionId && (
        <p className="mt-2 flex items-center gap-1 text-xs text-brand">
          <Check className="size-3.5" />
          Instituição parceira da Upgrade selecionada.
        </p>
      )}
      {!institutionId && data && data.length > 0 && (
        <ul
          className="mt-2 divide-y divide-border rounded-md border border-border bg-card text-sm"
          role="listbox"
          aria-label="Instituições parceiras"
        >
          {data.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="w-full px-3 py-2 text-left hover:bg-secondary"
                onClick={() => {
                  setTerm(i.name);
                  onChange({ name: i.name, id: i.id });
                }}
              >
                {i.name}
                {i.city ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {i.city}
                    {i.state ? `/${i.state}` : ""}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!institutionId && debounced.length >= 2 && data && data.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Não encontramos parceira com esse nome. Você pode continuar com o nome digitado; sua
          declaração será analisada pela equipe Upgrade.
        </p>
      )}
    </div>
  );
}
