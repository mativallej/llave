import { tenant } from "@/lib/mock-data"

export function WhatsAppStickyButton() {
  const msg = encodeURIComponent("Hola, vengo de la web")
  const href = `https://wa.me/${tenant.whatsapp}?text=${msg}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-whatsapp)] px-4 py-3 text-sm font-semibold text-[color:var(--brand-whatsapp-foreground)] shadow-lg shadow-black/20 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--brand-whatsapp)] md:bottom-6 md:right-6"
    >
      {/* Logo WhatsApp */}
      <svg
        viewBox="0 0 32 32"
        className="h-5 w-5"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.302.13-.617.07-.932-.144-.272-2.32-1.475-2.534-1.475zm-2.94 7.42a8.482 8.482 0 0 1-4.347-1.187l-3.107.99 1.005-3.07A8.515 8.515 0 0 1 7.6 16.42c0-4.71 3.85-8.56 8.57-8.56 4.7 0 8.55 3.85 8.55 8.56-.01 4.72-3.85 8.205-8.55 8.205zm0-18.83C10.5 5.795 6 10.295 6 15.965a10.4 10.4 0 0 0 1.55 5.405l-1.95 5.78 6.005-1.93a10.27 10.27 0 0 0 4.625 1.1c5.685 0 10.295-4.5 10.295-10.16-.01-5.67-4.61-10.165-10.295-10.165z" />
      </svg>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  )
}
