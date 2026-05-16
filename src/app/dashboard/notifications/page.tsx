"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/auth";

interface Notification {
  id: string;
  created_at: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  meta: {
    carte_id?: string;
    client_id?: string;
    montant?: number;
    offert_par?: string;
  } | null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const salonIdRef = useRef<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const profile = await getUserProfile();
      salonIdRef.current = profile?.salonId ?? null;
      await loadNotifs();
    };
    init();

    const channel = supabase
      .channel("notifications-page")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      }, (payload) => {
        const n = payload.new as Notification & { salon_id?: string };
        if (salonIdRef.current && n.salon_id !== salonIdRef.current) return;
        setNotifs((prev) => [n, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadNotifs = async () => {
    setLoading(true);
    const q = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    const { data } = salonIdRef.current ? await q.eq("salon_id", salonIdRef.current) : await q;
    setNotifs(data || []);
    setLoading(false);
  };

  const markAllRead = async () => {
    const q = supabase.from("notifications").update({ lu: true }).eq("lu", false);
    salonIdRef.current ? await q.eq("salon_id", salonIdRef.current) : await q;
    setNotifs((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ lu: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, lu: true } : n));
  };

  const unreadCount = notifs.filter((n) => !n.lu).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const typeIcon: Record<string, string> = {
    nouvelle_carte_cadeau: "🎁",
    paiement: "💳",
    recharge: "⚡",
    default: "🔔",
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <div className="bg-gradient-to-b from-[#18160F] to-[#2C2A25] border-b border-[#BA7517]/[0.18]">
        <div className="max-w-[640px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-1">
            <button onClick={() => router.push("/dashboard")} className="text-[#F7F4EE]/40 hover:text-[#F7F4EE]/80 transition-colors text-sm">
              ← Retour
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[9px] tracking-[0.15em] uppercase font-medium text-[#BA7517] hover:text-[#E8A020] transition-colors">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-xl bg-[#BA7517]/15 border border-[#BA7517]/30 flex items-center justify-center text-lg">🔔</div>
            <div>
              <h1 className="text-lg font-light tracking-[0.08em] text-[#F7F4EE]">Notifications</h1>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#F7F4EE]/30 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#BA7517]/30 border-t-[#BA7517] rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-sm text-[#8A8070] font-light">Aucune notification pour le moment</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.lu) markRead(notif.id);
                  if (notif.meta?.client_id) router.push(`/dashboard/clients/${notif.meta.client_id}`);
                }}
                className="bg-white rounded-2xl border border-[#EDE8DF] p-4 flex gap-4 cursor-pointer hover:border-[#BA7517]/30 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
                style={{ opacity: notif.lu ? 0.65 : 1 }}
              >
                <div className="w-11 h-11 rounded-xl bg-[#BA7517]/10 border border-[#BA7517]/20 flex items-center justify-center text-xl flex-shrink-0">
                  {typeIcon[notif.type] || typeIcon.default}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[#1C1C1A] leading-tight">{notif.titre}</p>
                    <span className="text-[10px] text-[#B8AFA0] whitespace-nowrap flex-shrink-0 mt-0.5">{formatDate(notif.created_at)}</span>
                  </div>
                  <p className="text-xs text-[#8A8070] mt-1 leading-relaxed">{notif.message}</p>
                  {notif.meta?.montant && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6EE] border border-[#E8D9B8]">
                      <span className="text-[10px] font-medium text-[#BA7517]">{notif.meta.montant.toLocaleString("fr-FR")} DA</span>
                    </div>
                  )}
                </div>
                {!notif.lu && <div className="w-2 h-2 rounded-full bg-[#BA7517] flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
