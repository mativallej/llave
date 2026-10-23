"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CONTENIDO } from "@/lib/contenido"
import { cn } from "@/lib/utils"

// Rafaela at the centre, rings at 50 and 100 km, the towns where clients come from. Positions in km from
// Rafaela (x east, y south), taken from each town's coordinates. Hand-drawn SVG on purpose: no map library.
const PUEBLOS: { nombre: string; x: number; y: number; lado: "der" | "izq" }[] = [
  { nombre: "Rafaela", x: 0, y: 0, lado: "der" },
  { nombre: "Lehmann", x: 3, y: -13, lado: "der" },
  { nombre: "Susana", x: -3, y: 12, lado: "izq" },
  { nombre: "Ataliva", x: 5, y: -28, lado: "der" },
  { nombre: "Sunchales", x: -7, y: -34, lado: "izq" },
  { nombre: "Humberto Primo", x: 13, y: -42, lado: "der" },
  { nombre: "Pilar", x: 22, y: 21, lado: "izq" },
  { nombre: "Humboldt", x: 38, y: 17, lado: "der" },
  { nombre: "Esperanza", x: 53, y: 22, lado: "der" },
  { nombre: "Santa Fe", x: 75, y: 42, lado: "izq" },
  { nombre: "San Francisco", x: -57, y: 20, lado: "der" },
  { nombre: "San Vicente", x: -8, y: 50, lado: "der" },
  { nombre: "María Juana", x: -25, y: 47, lado: "izq" },
  { nombre: "Sastre", x: -33, y: 57, lado: "izq" },
  { nombre: "San Jorge", x: -35, y: 72, lado: "izq" },
  { nombre: "Gálvez", x: 25, y: 86, lado: "der" },
  { nombre: "Morteros", x: -49, y: -60, lado: "der" },
  { nombre: "Suardi", x: -45, y: -79, lado: "der" },
]

export function MapaZona({ elegida, onElegir }: { elegida: string | null; onElegir: (zona: string) => void }) {
  const [otra, setOtra] = useState("")
  const [escribiendo, setEscribiendo] = useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-1">
        <p className="font-medium">{CONTENIDO.zona.titulo}</p>
        <p className="text-sm text-muted-foreground">{CONTENIDO.zona.texto}</p>
      </div>
      <svg
        viewBox="-112 -100 224 200"
        className="h-auto w-full max-w-md self-center"
        role="group"
        aria-label="Mapa de la zona, con Rafaela al centro"
      >
        <circle r={100} className="fill-none stroke-border" strokeDasharray="3 3" />
        <circle r={50} className="fill-muted/60 stroke-border" />
        <text x={0} y={-52} textAnchor="middle" className="fill-muted-foreground text-[5px]">
          50 km
        </text>
        <text x={0} y={-91} textAnchor="middle" className="fill-muted-foreground text-[5px]">
          100 km
        </text>
        {PUEBLOS.map((pueblo) => {
          const activo = pueblo.nombre === elegida
          const elegir = () => onElegir(pueblo.nombre)
          return (
            <g
              key={pueblo.nombre}
              role="button"
              tabIndex={0}
              aria-label={pueblo.nombre}
              aria-pressed={activo}
              onClick={elegir}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  elegir()
                }
              }}
              className="group cursor-pointer outline-none"
            >
              <circle cx={pueblo.x} cy={pueblo.y} r={7} className="fill-transparent" />
              <circle
                cx={pueblo.x}
                cy={pueblo.y}
                r={pueblo.nombre === "Rafaela" ? 3.4 : 2.4}
                className={cn(
                  "stroke-[0.8] transition-colors group-hover:fill-primary group-focus-visible:stroke-ring group-focus-visible:stroke-[2]",
                  activo ? "fill-primary stroke-primary" : "fill-foreground stroke-background",
                )}
              />
              <text
                x={pueblo.x + (pueblo.lado === "der" ? 4.5 : -4.5)}
                y={pueblo.y + 2}
                textAnchor={pueblo.lado === "der" ? "start" : "end"}
                className={cn(
                  "text-[6.5px] group-hover:fill-primary group-focus-visible:underline",
                  activo ? "fill-primary font-semibold" : "fill-foreground",
                )}
              >
                {pueblo.nombre}
              </text>
            </g>
          )
        })}
      </svg>
      {escribiendo ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (otra.trim()) onElegir(otra.trim())
          }}
        >
          <Input
            value={otra}
            onChange={(e) => setOtra(e.target.value)}
            placeholder={CONTENIDO.zona.otraPlaceholder}
            aria-label={CONTENIDO.zona.otraPlaceholder}
            autoFocus
          />
          <Button type="submit" disabled={!otra.trim()}>
            {CONTENIDO.zona.elegir}
          </Button>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setEscribiendo(true)}>
          {CONTENIDO.zona.otra}
        </Button>
      )}
    </div>
  )
}
