"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { comprarSchema, type ComprarInput } from "@/lib/validations"
import {
  argentinaProvinces,
  carBrands,
  getCitiesForProvince,
  getModelsForBrand,
} from "@/lib/mock-data"
import { FormStepperHeader, type Step } from "./form-stepper-header"

const operacionOpts = [
  {
    value: "contado",
    label: "Al contado",
    desc: "Pagás todo de una. Sin intereses.",
  },
  {
    value: "financiado",
    label: "Financiado",
    desc: "Te armamos un plan de cuotas a tu medida.",
  },
  {
    value: "permuta",
    label: "Entregando mi usado",
    desc: "Cotizamos tu auto y lo tomamos como parte de pago.",
  },
] as const

const steps: Step[] = [
  { id: "marca", title: "¿Qué marca buscás?", shortTitle: "Marca" },
  { id: "modelos", title: "¿Qué modelos te interesan?", shortTitle: "Modelos" },
  { id: "operacion", title: "¿Cómo querés operar?", shortTitle: "Operación" },
  { id: "nombre", title: "¿Cómo te llamás?", shortTitle: "Nombre" },
  { id: "ubicacion", title: "¿De dónde sos?", shortTitle: "Ubicación" },
  { id: "telefono", title: "¿A qué número te escribimos?", shortTitle: "Teléfono" },
]

const stepFields: Array<Array<keyof ComprarInput>> = [
  ["marca"],
  ["modelos"],
  ["tipoOperacion", "usadoDescripcion"],
  ["nombre", "apellido"],
  ["provincia", "ciudad"],
  ["telefono"],
]

export function FormComprar() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const form = useForm<ComprarInput>({
    resolver: zodResolver(comprarSchema),
    defaultValues: {
      marca: "",
      modelos: [],
      nombre: "",
      apellido: "",
      provincia: "",
      ciudad: "",
      telefono: "",
      usadoDescripcion: "",
    },
    mode: "onSubmit",
  })

  const onSubmit = (data: ComprarInput) => {
    console.log("[v0] /comprar submit:", data)
    router.push("/confirmacion?intent=comprar")
  }

  const handleNext = async () => {
    const valid = await form.trigger(stepFields[step], { shouldFocus: true })
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const isLast = step === steps.length - 1
  const marcaSeleccionada = form.watch("marca")
  const tipoOperacion = form.watch("tipoOperacion")

  return (
    <Card className="overflow-hidden border-0 shadow-card">
      <CardContent className="grid gap-6 p-5 md:p-7">
        <FormStepperHeader steps={steps} currentStep={step} />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-6"
            noValidate
          >
            {step === 0 && <PasoMarca form={form} />}
            {step === 1 && <PasoModelos form={form} marca={marcaSeleccionada} />}
            {step === 2 && (
              <PasoOperacion form={form} mostrarUsado={tipoOperacion === "permuta"} />
            )}
            {step === 3 && <PasoNombre form={form} />}
            {step === 4 && <PasoUbicacion form={form} />}
            {step === 5 && <PasoTelefono form={form} />}

            <FormNav
              step={step}
              total={steps.length}
              onBack={handleBack}
              onNext={handleNext}
              submitLabel="Enviar pedido"
              isSubmitting={form.formState.isSubmitting}
              isLast={isLast}
              hint="En 24-48hs te escribimos por WhatsApp. Sin compromiso."
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

/* -------------------- Pasos -------------------- */

function PasoMarca({ form }: { form: ReturnType<typeof useForm<ComprarInput>> }) {
  return (
    <FormField
      control={form.control}
      name="marca"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Marca</FormLabel>
          <Select
            value={field.value}
            onValueChange={(v) => {
              field.onChange(v)
              form.setValue("modelos", [], { shouldValidate: false })
            }}
          >
            <FormControl>
              <SelectTrigger className="h-12 w-full text-base">
                <SelectValue placeholder="Elegí una marca" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-72">
              {carBrands.map((b) => (
                <SelectItem key={b.brand} value={b.brand} className="py-2.5 text-base">
                  {b.brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Trabajamos multimarca. Si no está la tuya, elegí <strong>Otra</strong>.
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function PasoModelos({
  form,
  marca,
}: {
  form: ReturnType<typeof useForm<ComprarInput>>
  marca: string
}) {
  const modelos = getModelsForBrand(marca)

  if (!marca) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Volvé al paso anterior para elegir una marca.
      </p>
    )
  }

  if (modelos.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        No tenemos modelos cargados para esta marca. En el último paso lo charlamos
        por WhatsApp.
      </p>
    )
  }

  return (
    <FormField
      control={form.control}
      name="modelos"
      render={({ field }) => {
        const selected = (field.value ?? []) as string[]
        const toggle = (model: string) => {
          if (selected.includes(model)) {
            field.onChange(selected.filter((m) => m !== model))
          } else {
            field.onChange([...selected, model])
          }
        }
        return (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Modelos de <span className="text-primary">{marca}</span>
            </FormLabel>
            <p className="text-xs text-muted-foreground">
              Tocá uno o varios. Cuantos más marques, más opciones te traemos.
            </p>
            <FormControl>
              <div
                role="group"
                aria-label="Modelos disponibles"
                className="flex flex-wrap gap-2 pt-1"
              >
                {modelos.map((m) => {
                  const isOn = selected.includes(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggle(m)}
                      aria-pressed={isOn}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                        isOn
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "bg-secondary text-foreground hover:bg-[#e2e2e2]",
                      )}
                    >
                      {isOn && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      {m}
                    </button>
                  )
                })}
              </div>
            </FormControl>
            <p className="pt-1 text-xs text-muted-foreground">
              {selected.length === 0
                ? "Ninguno seleccionado"
                : `${selected.length} ${selected.length === 1 ? "modelo seleccionado" : "modelos seleccionados"}`}
            </p>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

function PasoOperacion({
  form,
  mostrarUsado,
}: {
  form: ReturnType<typeof useForm<ComprarInput>>
  mostrarUsado: boolean
}) {
  return (
    <div className="grid gap-5">
      <FormField
        control={form.control}
        name="tipoOperacion"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Tipo de operación</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid gap-2"
              >
                {operacionOpts.map((opt) => (
                  <Label
                    key={opt.value}
                    htmlFor={`operacion-${opt.value}`}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm font-normal text-foreground transition-colors hover:bg-secondary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem
                      id={`operacion-${opt.value}`}
                      value={opt.value}
                      className="mt-0.5"
                    />
                    <div className="grid gap-0.5">
                      <span className="font-medium leading-tight">{opt.label}</span>
                      <span className="text-xs leading-snug text-muted-foreground">
                        {opt.desc}
                      </span>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {mostrarUsado && (
        <FormField
          control={form.control}
          name="usadoDescripcion"
          render={({ field }) => (
            <FormItem className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <FormLabel className="text-sm font-medium">
                Contanos sobre tu usado
              </FormLabel>
              <p className="text-xs text-muted-foreground">
                Marca, modelo, año, kilómetros, estado general, detalles relevantes.
                Mientras más datos, mejor cotización.
              </p>
              <FormControl>
                <Textarea
                  rows={5}
                  maxLength={500}
                  placeholder="Ej: Toyota Corolla XEI 2018, nafta, 95.000 km, único dueño, service oficial al día, llantas originales, sin choques, color gris."
                  className="resize-none bg-card"
                  {...field}
                />
              </FormControl>
              <p className="text-right text-[11px] text-muted-foreground">
                {field.value?.length ?? 0}/500
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}

function PasoNombre({ form }: { form: ReturnType<typeof useForm<ComprarInput>> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="nombre"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Nombre</FormLabel>
            <FormControl>
              <Input
                placeholder="Juan"
                autoComplete="given-name"
                className="h-12 text-base"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="apellido"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Apellido</FormLabel>
            <FormControl>
              <Input
                placeholder="Pérez"
                autoComplete="family-name"
                className="h-12 text-base"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function PasoUbicacion({
  form,
}: {
  form: ReturnType<typeof useForm<ComprarInput>>
}) {
  const provinciaSel = form.watch("provincia")
  const ciudades = getCitiesForProvince(provinciaSel)

  return (
    <div className="grid gap-4">
      <FormField
        control={form.control}
        name="provincia"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Provincia</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                form.setValue("ciudad", "", { shouldValidate: false })
              }}
            >
              <FormControl>
                <SelectTrigger className="h-12 w-full text-base">
                  <SelectValue placeholder="Elegí una provincia" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-72">
                {argentinaProvinces.map((p) => (
                  <SelectItem
                    key={p.name}
                    value={p.name}
                    className="py-2.5 text-base"
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="ciudad"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Ciudad</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!provinciaSel}
            >
              <FormControl>
                <SelectTrigger className="h-12 w-full text-base">
                  <SelectValue
                    placeholder={
                      provinciaSel ? "Elegí una ciudad" : "Primero elegí una provincia"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-72">
                {ciudades.map((c) => (
                  <SelectItem key={c} value={c} className="py-2.5 text-base">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function PasoTelefono({ form }: { form: ReturnType<typeof useForm<ComprarInput>> }) {
  return (
    <FormField
      control={form.control}
      name="telefono"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Teléfono</FormLabel>
          <FormControl>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="3492 555123"
              className="h-12 text-base"
              {...field}
            />
          </FormControl>
          <p className="text-xs text-muted-foreground">
            Te escribimos por WhatsApp en 24-48hs. Sin spam, sin llamadas.
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* -------------------- Nav -------------------- */

function FormNav({
  step,
  total,
  onBack,
  onNext,
  submitLabel,
  isSubmitting,
  isLast,
  hint,
}: {
  step: number
  total: number
  onBack: () => void
  onNext: () => void
  submitLabel: string
  isSubmitting?: boolean
  isLast: boolean
  hint?: string
}) {
  return (
    <div className="grid gap-3 pt-2">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={step === 0}
          className="h-12 sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Atrás
        </Button>

        {!isLast ? (
          <Button
            type="button"
            size="lg"
            onClick={onNext}
            className="h-12 w-full text-base font-semibold sm:w-auto sm:min-w-44"
          >
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-12 w-full text-base font-semibold sm:w-auto sm:min-w-44"
          >
            {submitLabel}
            <Send className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      {isLast && hint && (
        <p className="text-center text-xs text-muted-foreground">{hint}</p>
      )}
      <p className="text-center text-[11px] text-muted-foreground sm:hidden">
        Paso {step + 1} de {total}
      </p>
    </div>
  )
}
