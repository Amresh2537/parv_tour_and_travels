'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const steps = [
  { name: 'Booking Entry', path: '/booking/entry' },
  { name: 'Confirm Booking', path: '/booking/confirm' },
  { name: 'Driver & Start KM', path: '/booking/driver' },
  { name: 'Expenses & End KM', path: '/booking/expenses' },
  { name: 'Calculation', path: '/booking/calculation' },
  { name: 'Summary', path: '/booking/summary' },
];

export default function Stepper() {
  const pathname = usePathname();
  const currentStepIndex = steps.findIndex(step => step.path === pathname);

  return (
    <div className="w-full px-4 py-8">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
        
        {steps.map((step, index) => (
          <div key={step.name} className="relative z-10 flex flex-col items-center">
            {/* Step circle */}
            <Link href={step.path}>
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-300
                ${index < currentStepIndex 
                  ? 'bg-green-500 text-white' 
                  : index === currentStepIndex 
                  ? 'bg-blue-600 text-white border-4 border-blue-200' 
                  : 'bg-gray-200 text-gray-600'
                }
                hover:scale-110 cursor-pointer
              `}>
                {index < currentStepIndex ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="font-bold">{index + 1}</span>
                )}
              </div>
            </Link>
            
            {/* Step label */}
            <span className={`
              mt-2 text-sm font-medium
              ${index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'}
              text-center
            `}>
              {step.name}
            </span>
            
            {/* Step description */}
            <span className="text-xs text-gray-500 mt-1 text-center max-w-[100px]">
              Step {index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}