import { Star, MapPin, MessageSquare } from "lucide-react"
import { tenant } from "@/lib/mock-data"

export function TrustSignals() {
  const items = [
    {
      icon: Star,
      label: `${tenant.google.rating} en Google`,
      filled: true,
    },
    {
      icon: MapPin,
      label: `${tenant.yearsInBusiness} años en ${tenant.city}`,
    },
    {
      icon: MessageSquare,
      label: `${tenant.google.reviews} reviews`,
    },
  ]

  return (
    <section className="mx-auto mt-10 max-w-6xl px-4 md:mt-14 md:px-6">
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary p-3 md:gap-4 md:p-5">
        {items.map(({ icon: Icon, label, filled }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-1.5 text-center md:flex-row md:gap-2"
          >
            <Icon
              className={`h-4 w-4 text-foreground md:h-5 md:w-5 ${filled ? "fill-foreground" : ""}`}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold leading-tight text-foreground md:text-sm">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
