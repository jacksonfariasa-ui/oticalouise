// Prints an element exactly as shown on screen, in an isolated iframe
// that copies the page's styles (avoids dialogs/layout clipping content).
export function printElement(el: HTMLElement | null) {
  if (!el) return window.print();
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join("\n");
  const htmlClass = document.documentElement.className;
  doc.open();
  doc.write(`<!doctype html><html class="${htmlClass}"><head><meta charset="utf-8"><title>${document.title}</title>${styles}
<style>
@page { size: A4; margin: 10mm; }
html, body { background: var(--background); margin: 0; }
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
.no-print { display: none !important; }
.print-area { position: static !important; visibility: visible !important; }
</style></head><body>${el.outerHTML}</body></html>`);
  doc.close();
  const go = async () => {
    const imgs = Array.from(doc.images);
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => iframe.remove(), 1000);
  };
  setTimeout(go, 300);
}
