
import React from 'react';
import { STEPS } from '../constants';
import { CheckIcon } from './icons/CheckIcon';

interface StepperProps {
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-6">
        {STEPS.map((step, stepIdx) => {
          const isCompleted = stepIdx < currentStep;
          const isCurrent = stepIdx === currentStep;

          let statusColorClass = 'text-text-secondary';
          if (isCompleted) {
            statusColorClass = 'text-text-primary';
          } else if (isCurrent) {
            statusColorClass = 'text-primary';
          }

          return (
            <li key={step} className="relative">
              {stepIdx < STEPS.length - 1 ? (
                <div
                  className={`absolute left-4 top-5 -ml-px h-full w-0.5 ${
                    isCompleted ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-center space-x-4">
                <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                  {isCompleted ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                      <CheckIcon className="h-5 w-5 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
                  )}
                </div>
                <span className={`text-sm font-medium ${statusColorClass} ${isCurrent ? 'font-bold' : ''}`}>
                  {step}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
