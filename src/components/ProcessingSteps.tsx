import type { ProcessingStep } from '../types'

interface ProcessingStepsProps {
  steps: ProcessingStep[]
}

export default function ProcessingSteps({ steps }: ProcessingStepsProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className="flex items-center gap-4 animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${
              step.status === 'complete'
                ? 'border-spotify bg-spotify/10 text-spotify'
                : step.status === 'active'
                  ? 'border-spotify bg-spotify/5 text-spotify'
                  : 'border-border text-muted'
            }`}
          >
            {step.status === 'complete' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : step.status === 'active' ? (
              <svg className="h-5 w-5 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>
          <div>
            <p
              className={`text-sm font-medium transition-colors ${
                step.status === 'pending' ? 'text-muted' : 'text-white'
              }`}
            >
              {step.label}
            </p>
            {step.status === 'active' && (
              <p className="text-xs text-muted mt-0.5">In progress...</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
