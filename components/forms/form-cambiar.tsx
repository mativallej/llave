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
import { PhotoUpload } from "@/components/photo-upload"
import { cn } from "@/lib/utils"

import { cambiarSchema, type CambiarInput } from "@/lib/validations"
import {
  argentinaProvinces,
  carBrands,
  getCitiesForProvince,
  getModelsForBrand,
} from "@/lib/mock-data"
import { FormStepperHeader, type Step } from "./form-stepper-header"

const estadoOpts = [
  { value: "excelente", label: "Excelente", desc: "Como nuevo. Sin detalles visibles." },
  { value: "muy-bueno", label: "Muy bueno", desc: "Detalles mínimos de uso normal." },
  { value: "bueno", label: "Bueno", desc: "Marcas de uso, todo funcionando OK." },
  { value: "regular", label: "Regular", desc: "Necesita arreglos. Lo charlamos." },
] as const

const presupuestoExtraOpts = [
  { value: "hasta-5m", label: "Hasta $5M" },
  { value: "5-15m", label: "$5M - $15M" },
  { value: "15-30m", label: "$15M - $30M" },
  { value: "mas-30m", label: "Más de $30M" },
  { value: "con-financiacion", label: "Con financiación" },
] as const

const steps: Step[] = [
  { id: "tu-marca", title: "¿Qué marca tenés?", shortTitle: "Tu marca" },
  { id: "tu-modelo", title: "¿Qué modelo tenés?", shortTitle: "Tu modelo" },
  { id: "tu-datos", title: "Año y kilómetros de tu auto", shortTitle: "Año + km" },
  { id: "tu-estado", title: "¿Cómo está tu auto?", shortTitle: "Estado" },
  { id: "tu-fotos", title: "Subí fotos de tu auto", shortTitle: "Fotos" },
  { id: "busca-marca", title: "¿Qué marca querés?", shortTitle: "Marca nueva" },
  { id: "busca-modelos", title: "¿Qué modelos te interesan?", shortTitle: "Modelos" },
  { id: "presupuesto", title: "Presupuesto extra disponible", shortTitle: "Presupuesto" },
  { id: "nombre", title: "¿Cómo te llamás?", shortTitle: "Nombre" },
  { id: "ubicacion", title: "¿De dónde sos?", shortTitle: "Ubicación" },
  { id: "telefono", title: "¿A qué número te escribimos?", shortTitle: "Teléfono" },
]

const stepFields: Array<Array<keyof CambiarInput>> = [
  ["tuMarca"],
  ["tuModelo"],
  ["tuAnio", "tuKm"],
  ["tuEstado"],
  ["tuFotos"],
  ["buscaMarca"],
  ["buscaModelos"],
  ["presupuestoExtra"],
  ["nombre", "apellido"],
  ["provincia", "ciudad"],
  ["telefono"],
]

export function FormCambiar() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const form = useForm<CambiarInput>({
    resolver: zodResolver(cambiarSchema),
    defaultValues: {
      tuMarca: "",
      tuModelo: "",
      tuAnio: undefined as unknown as number,
      tuKm: undefined as unknown as number,
      tuFotos: [],
      buscaMarca: "",
      buscaModelos: [],
      nombre: "",
      apellido: "",
      provincia: "",
      ciudad: "",
      telefono: "",
    },
    mode: "onSubmit",
  })

  const onSubmit = (data: CambiarInput) => {
    console.log("[v0] /cambiar submit:", {
      ...data,
      tuFotos: data.tuFotos.map((f: File) =>
        typeof File !== "undefined" && f instanceof File
          ? { name: f.name, size: f.size, type: f.type }
          : f,
      ),
    })
    router.push("/confirmacion?intent=cambiar")
  }

  const handleNext = async () => {
    const valid = await form.trigger(stepFields[step], { shouldFocus: true })
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 0))
  const isLast = step === steps.length - 1
  const tuMarcaSel = form.watch("tuMarca")
  const buscaMarcaSel = form.watch("buscaMarca")

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
            {step === 0 && <PasoTuMarca form={form} />}
            {step === 1 && <PasoTuModelo form={form} marca={tuMarcaSel} />}
            {step === 2 && <PasoTuDatos form={form} />}
            {step === 3 && <PasoTuEstado form={form} />}
            {step === 4 && <PasoTuFotos form={form} />}
            {step === 5 && <PasoBuscaMarca form={form} />}
            {step === 6 && <PasoBuscaModelos form={form} marca={buscaMarcaSel} />}
            {step === 7 && <PasoPresupuesto form={form} />}
            {step === 8 && <PasoNombre form={form} />}
            {step === 9 && <PasoUbicacion form={form} />}
            {step === 10 && <PasoTelefono form={form} />}

            <FormNav
              step={step}
              total={steps.length}
              onBack={handleBack}
              onNext={handleNext}
              submitLabel="Pedir propuesta de cambio"
              isSubmitting={form.formState.isSubmitting}
              isLast={isLast}
              hint="Recibís cotización de tu auto + 2-3 opciones de upgrade con saldo claro."
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

/* -------------------- Pasos: tu auto -------------------- */

function PasoTuMarca({
  form,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
}) {
  return (
    <FormField
      control={form.control}
      name="tuMarca"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Marca de tu auto</FormLabel>
          <Select
            value={field.value}
            onValueChange={(v) => {
              field.onChange(v)
              form.setValue("tuModelo", "", { shouldValidate: false })
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
            Si no está la tuya, elegí <strong>Otra</strong>.
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function PasoTuModelo({
  form,
  marca,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
  marca: string
}) {
  const modelos = getModelsForBrand(marca)

  if (!marca) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Volvé al paso anterior para elegir la marca de tu auto.
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
      name="tuModelo"
      render={({ field }) => {
        const selected = field.value ?? ""
        return (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Modelo de <span className="text-primary">{marca}</span>
            </FormLabel>
            <p className="text-xs text-muted-foreground">
              Tocá el modelo que tenés.
            </p>
            <FormControl>
              <div
                role="group"
                aria-label="Modelos disponibles"
                className="flex flex-wrap gap-2 pt-1"
              >
                {modelos.map((m) => {
                  const isOn = selected === m
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => field.onChange(m)}
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
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

function PasoTuDatos({
  form,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="tuAnio"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Año</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                min={1990}
                max={2026}
                placeholder="2018"
                className="h-12 text-base"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tuKm"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Kilómetros</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="65000"
                className="h-12 text-base"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function PasoTuEstado({
  form,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
}) {
  return (
    <FormField
      control={form.control}
      name="tuEstado"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Estado general</FormLabel>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid gap-2"
            >
              {estadoOpts.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`tu-estado-${opt.value}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm font-normal text-foreground transition-colors hover:bg-secondary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem
                    id={`tu-estado-${opt.value}`}
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
  )
}

function PasoTuFotos({
  form,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
}) {
  return (
    <FormField
      control={form.control}
      name="tuFotos"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">
            Subí 6 fotos de tu auto
          </FormLabel>
          <FormControl>
            <PhotoUpload
              value={field.value as File[]}
              onChange={field.onChange}
              max={12}
              hint="Frente, trasera, lateral izq, lateral der, interior, motor"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* -------------------- Pasos: lo que querés -------------------- */

function PasoBuscaMarca({
  form,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
}) {
  return (
    <FormField
      control={form.control}
      name="buscaMarca"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">
            Marca que te interesa
          </FormLabel>
          <Select
            value={field.value}
            onValueChange={(v) => {
              field.onChange(v)
              form.setValue("buscaModelos", [], { shouldValidate: false })
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

function PasoBuscaModelos({
  form,
  marca,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
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
      name="buscaModelos"
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

function PasoPresupuesto({
  form,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
}) {
  return (
    <FormField
      control={form.control}
      name="presupuestoExtra"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">
            Plata extra disponible
          </FormLabel>
          <p className="text-xs text-muted-foreground">
            Aparte del valor que te paguemos por tu auto.
          </p>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid gap-2"
            >
              {presupuestoExtraOpts.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`presupuesto-${opt.value}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm font-normal text-foreground transition-colors hover:bg-secondary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=checked]]:font-medium"
                >
                  <RadioGroupItem
                    id={`presupuesto-${opt.value}`}
                    value={opt.value}
                  />
                  <span>{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* -------------------- Pasos: contacto -------------------- */

function PasoNombre({
  form,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
}) {
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
  form: ReturnType<typeof useForm<CambiarInput>>
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

function PasoTelefono({
  form,
}: {
  form: ReturnType<typeof useForm<CambiarInput>>
}) {
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
            Te escribimos por WhatsApp en 24-48hs con cotización + opciones.
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
