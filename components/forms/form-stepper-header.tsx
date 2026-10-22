"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type Step = {
  id: string
  title: string
  shortTitle?: string
}

export function FormStepperHeader({
  steps,
  currentStep,
}: {
  steps: Step[]
  currentStep: number
}) {
  const total = steps.length
  const progress = ((currentStep + 1) / total) * 100
  const current = steps[currentStep]

  return (
    <div className="grid gap-4">
      {/* Mobile: contador + barra de progreso + título */}
      <div className="grid gap-2 sm:hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Paso {currentStep + 1} de {total}
          </p>
          <p className="text-xs font-medium text-foreground">
            {Math.round(progress)}%
          </p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
        <h2 className="pt-1 text-balance text-base font-semibold tracking-tight text-foreground">
          {current?.title}
        </h2>
      </div>

      {/* Desktop: stepper visual con círculos + label debajo */}
      <div className="hidden sm:grid sm:gap-4">
        <ol className="flex w-full items-start">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep
            const isActive = idx === currentStep
            const isLast = idx === steps.length - 1
            return (
              <li
                key={step.id}
                className={cn(
                  "flex min-w-0 items-start",
                  isLast ? "flex-none" : "flex-1",
                )}
              >
                <div className="flex w-10 min-w-0 flex-col items-center gap-1.5 md:w-14">
                  <div
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors",
                      (isDone || isActive) &&
                        "border-foreground bg-foreground text-background",
                      !isDone &&
                        !isActive &&
                        "border-border bg-card text-muted-foreground",
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "block w-full truncate text-center text-[10px] leading-tight transition-colors md:text-[11px]",
                      isActive
                        ? "font-semibold text-foreground"
                        : isDone
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                    )}
                    title={step.shortTitle ?? step.title}
                  >
                    {step.shortTitle ?? step.title}
                  </span>
                </div>

                {!isLast && (
                  <div
                    className={cn(
                      "mt-4 h-px flex-1 transition-colors",
                      idx < currentStep ? "bg-foreground" : "bg-border",
                    )}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
        <div className="border-t border-border pt-4">
          <h2 className="text-balance text-base font-semibold tracking-tight text-foreground md:text-lg">
            {current?.title}
          </h2>
        </div>
      </div>
    </div>
  )
}
