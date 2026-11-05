import { createFileRoute } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { AppShell } from "@/components/app-shell";
import { AuthorWallet } from "@/components/author-wallet";
export const Route=createFileRoute("/_authenticated/recebimentos")({head:()=>({meta:[{title:"Recebimentos — Upgrade Educação"},{name:"description",content:"Apuração, estimativas e dados privados para recebimento."},{property:"og:title",content:"Recebimentos — Upgrade Educação"},{property:"og:description",content:"Conta de recebimento de autores e instituições."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Page});
function Page(){const {data:profile}=useProfile();if(!profile)return <p>Carregando…</p>;return <AppShell role={profile.role} userName={profile.full_name}>{["professor","ies"].includes(profile.role??"")?<AuthorWallet/>:<p>Acesso não autorizado.</p>}</AppShell>;}