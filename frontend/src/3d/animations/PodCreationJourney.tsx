// Pod Creation Journey - Orchestrates pod creation animation

import { useState, useEffect } from 'react';
import { SchedulerDrone } from '../objects/SchedulerDrone';
import { colors } from '../constants';

interface PodCreationJourneyProps {
  podName: string;
  targetNodePosition: [number, number, number];
  controlPlanePosition?: [number, number, number];
  isActive: boolean;
  onComplete?: () => void;
  speed?: number;
}

export function PodCreationJourney({
  targetNodePosition,
  controlPlanePosition = [0, 2, -12],
  isActive,
  onComplete,
  speed = 1,
}: PodCreationJourneyProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isActive) {
      setStep(1);
    } else {
      setStep(0);
    }
  }, [isActive]);

  const handleDroneComplete = () => {
    setStep(2);
    setTimeout(() => {
      onComplete?.();
      setStep(0);
    }, 500);
  };

  return (
    <>
      {step === 1 && (
        <SchedulerDrone
          isActive={true}
          startPosition={controlPlanePosition}
          endPosition={targetNodePosition}
          podColor={colors.podPending}
          onComplete={handleDroneComplete}
          duration={3000 / speed}
        />
      )}
    </>
  );
}

export default PodCreationJourney;
