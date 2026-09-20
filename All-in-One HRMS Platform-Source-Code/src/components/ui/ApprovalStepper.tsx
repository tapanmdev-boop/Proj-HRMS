import { Icon } from '../layout/icons';

export interface ApprovalStep {
  key: string;
  label: string;
}

type StepStatus = 'complete' | 'current' | 'upcoming' | 'declined';

/**
 * A small horizontal stepper for multi-level approval chains (leave,
 * expenses). `activeIndex` is the stage currently sitting with an approver
 * (or the final stage once fully approved); pass `declined` when the chain
 * stopped there instead of advancing.
 */
export function ApprovalStepper({
  steps,
  activeIndex,
  declined = false,
}: {
  steps: ApprovalStep[];
  activeIndex: number;
  declined?: boolean;
}) {
  return (
    <ol className="flex items-center">
      {steps.map((step, index) => {
        const status: StepStatus =
          declined && index === activeIndex
            ? 'declined'
            : index < activeIndex
            ? 'complete'
            : index === activeIndex
            ? 'current'
            : 'upcoming';

        return (
          <li key={step.key} className="flex items-center">
            <span
              title={step.label}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular ${
                status === 'complete'
                  ? 'bg-gold-500 text-ink-950'
                  : status === 'current'
                  ? 'bg-ink-900 text-ivory-50'
                  : status === 'declined'
                  ? 'bg-danger-500 text-white'
                  : 'bg-ivory-200 text-gray-400'
              }`}
            >
              {status === 'complete' ? (
                <Icon name="check" className="h-3 w-3" />
              ) : status === 'declined' ? (
                <Icon name="close" className="h-3 w-3" />
              ) : (
                index + 1
              )}
            </span>
            <span className={`ml-1.5 mr-3 whitespace-nowrap text-[11px] ${status === 'upcoming' ? 'text-gray-400' : 'text-gray-600'}`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <span className={`mr-3 h-px w-5 shrink-0 ${index < activeIndex ? 'bg-gold-500' : 'bg-ivory-300'}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
