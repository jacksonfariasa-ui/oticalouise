import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Botão "Instalar app": usa o convite nativo (Android/Chrome/Edge) ou mostra o passo a passo no iPhone. */
export function InstallApp() {
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [ios, setIos] = useState(false);
  const [ajuda, setAjuda] = useState(false);

  useEffect(() => {
    setInstalado(window.matchMedia("(display-mode: standalone)").matches);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const h = (e: Event) => { e.preventDefault(); setEvt(e as PromptEvent); };
    const done = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", done); };
  }, []);

  if (instalado) return null;

  async function instalar() {
    if (evt) { await evt.prompt(); await evt.userChoice; setEvt(null); return; }
    setAjuda(true);
  }

  return (
    <div className="px-3 pb-2">
      <button onClick={instalar} className="flex w-full items-center justify-center gap-2 rounded-md bg-sidebar-primary px-3 py-2 text-sm font-semibold text-sidebar-primary-foreground hover:opacity-90">
        <Download className="h-4 w-4" />Instalar app
      </button>
      {ajuda && (
        <div className="relative mt-2 rounded-md border border-sidebar-border p-3 text-xs leading-relaxed">
          <button aria-label="Fechar" onClick={() => setAjuda(false)} className="absolute right-1 top-1 p-1 opacity-60"><X className="h-3 w-3" /></button>
          {ios ? (
            <>No iPhone/iPad (Safari): toque em <Share className="inline h-3 w-3" /> <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</>
          ) : (
            <>No celular (Chrome): abra o menu <b>⋮</b> e toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>. No computador: clique no ícone de instalar na barra de endereço ou no menu <b>⋮ → Instalar Ótica Louise</b>.</>
          )}
        </div>
      )}
    </div>
  );
}
