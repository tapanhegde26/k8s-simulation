// Object Selector - Handles click detection and selection

import { useCallback } from 'react';

export interface SelectionState {
  type: 'node' | 'pod' | 'service' | 'control-plane' | null;
  id: string | null;
  name: string | null;
}

interface ObjectSelectorProps {
  onSelect: (selection: SelectionState) => void;
  children: React.ReactNode;
}

export function ObjectSelector({ onSelect, children }: ObjectSelectorProps) {
  const handleMissedClick = useCallback(() => {
    onSelect({ type: null, id: null, name: null });
  }, [onSelect]);

  return (
    <group onPointerMissed={handleMissedClick}>
      {children}
    </group>
  );
}

export default ObjectSelector;
