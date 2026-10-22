import Image from "next/image"
import { ChevronLeft, Video, Phone, MoreVertical } from "lucide-react"
import { tenant, formatArs } from "@/lib/mock-data"

type EmbeddedCar = {
  imgQuery: string
  title: string
  meta: string
  price: number
  cuota: string
}

const cars: EmbeddedCar[] = [
  {
    imgQuery: "toyota hilux pickup truck argentina white",
    title: "Toyota Hilux 2021",
    meta: "65k km",
    price: 42_000_000,
    cuota: "$850k",
  },
  {
    imgQuery: "ford ranger pickup truck blue argentina",
    title: "Ford Ranger 2020",
    meta: "80k km",
    price: 38_000_000,
    cuota: "$780k",
  },
]

export function WhatsAppPreview() {
  return (
    <div
      className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border-[6px] border-[#1f1f1f] bg-[#0b141a] shadow-xl"
      aria-label="Vista previa del chat de WhatsApp"
    >
      {/* WhatsApp header */}
      <div className="flex items-center gap-3 bg-[#075e54] px-3 py-2.5 text-white">
        <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/20">
          <Image
            src={`/placeholder.svg?height=80&width=80&query=${encodeURIComponent("friendly older argentine man car salesman portrait")}`}
            alt={`Foto de perfil de ${tenant.salesperson.name}`}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {tenant.salesperson.name} · {tenant.salesperson.role}
          </p>
          <p className="truncate text-[11px] leading-tight text-white/70">
            en línea
          </p>
        </div>
        <Video className="h-4 w-4 opacity-80" aria-hidden="true" />
        <Phone className="h-4 w-4 opacity-80" aria-hidden="true" />
        <MoreVertical className="h-4 w-4 opacity-80" aria-hidden="true" />
      </div>

      {/* Chat body */}
      <div
        className="space-y-2 px-3 py-4"
        style={{
          backgroundColor: "#e5ddd5",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4) 0, transparent 1.5px), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.04) 0, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      >
        <Bubble time="10:42">¡Hola Juan! Soy {tenant.salesperson.name} de {tenant.shortName} 👋</Bubble>
        <Bubble time="10:42">
          Vi tu pedido y te tengo 2 opciones que te pueden interesar:
        </Bubble>

        {cars.map((c) => (
          <CarCard key={c.title} car={c} />
        ))}

        <Bubble time="10:43">
          Si querés, vení mañana al galpón a verlas, o te las muestro por video.
          ¿Qué preferís?
        </Bubble>
      </div>
    </div>
  )
}

function Bubble({
  children,
  time,
}: {
  children: React.ReactNode
  time: string
}) {
  return (
    <div className="flex">
      <div className="relative max-w-[85%] rounded-lg rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug text-[#0b141a] shadow-sm">
        <p className="whitespace-pre-wrap">{children}</p>
        <span className="ml-2 mt-1 inline-block text-[10px] text-[#667781]">
          {time}
        </span>
      </div>
    </div>
  )
}

function CarCard({ car }: { car: EmbeddedCar }) {
  return (
    <div className="flex">
      <div className="max-w-[85%] overflow-hidden rounded-lg rounded-tl-sm bg-white shadow-sm">
        <div className="relative aspect-[16/10] w-full bg-secondary">
          <Image
            src={`/placeholder.svg?height=320&width=512&query=${encodeURIComponent(car.imgQuery)}`}
            alt={car.title}
            fill
            sizes="320px"
            className="object-cover"
          />
        </div>
        <div className="px-3 py-2 text-[12px] text-[#0b141a]">
          <p className="font-semibold leading-tight">{car.title}</p>
          <p className="mt-0.5 text-[#667781]">
            {car.meta} · {formatArs(car.price)} · Cuota desde {car.cuota}
          </p>
          <span className="mt-1 inline-block text-[10px] text-[#667781]">
            10:43
          </span>
        </div>
      </div>
    </div>
  )
}
