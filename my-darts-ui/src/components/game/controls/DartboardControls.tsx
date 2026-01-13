import React, { useState, useEffect, useRef } from 'react';
import DartboardSVG from './DartboardSVG';
import { AllocationDialog } from '../../dialogs/AllocationDialog';
import { BedAllocationDialog } from '../../dialogs/BedAllocationDialog';
import { ShanghaiAllocationDialog } from '../../dialogs/ShanghaiAllocationDialog';
import { ManualScoringPad } from './ManualScoringPad';
import { EditingIndicator } from './EditingIndicator';
import { TurnCompleteIndicator } from './TurnCompleteIndicator';
import { ThrowResponse } from '../../../hooks/useGame';
import { useTheme } from '../../../hooks/useThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';

interface DartboardControlsProps {
  gameType: number;
  gameStatus: number;
  turnComplete: boolean;
  editingThrowIndex: number | null;
  lastThrow?: ThrowResponse;
  currentTurnThrows?: ThrowResponse[];
  onThrow: (segment: string, multiplier: number, value: number, allocation?: string) => void;
  onConfirmTurn: () => void;
  
  bedPendingAllocation?: boolean;
  bedNumber?: number;
  onBedAllocation?: (allocation: string) => void;

  shanghaiPendingAllocation?: boolean;
  shanghaiNumber?: number;
  onShanghaiAllocation?: (singleAlloc: string, doubleAlloc: string, tripleAlloc: string) => void;
}

export const DartboardControls: React.FC<DartboardControlsProps> = ({
  gameType,
  gameStatus,
  turnComplete,
  editingThrowIndex,
  lastThrow,
  currentTurnThrows,
  onThrow,
  onConfirmTurn,
  bedPendingAllocation,
  bedNumber,
  onBedAllocation,
  shanghaiPendingAllocation,
  shanghaiNumber,
  onShanghaiAllocation
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [pendingThrow, setPendingThrow] = useState<{segment: string, value: number, multiplier: number} | null>(null);
  const [showBedDialog, setShowBedDialog] = useState(false);
  const [showShanghaiDialog, setShowShanghaiDialog] = useState(false);

  const isMickeyMouse = gameType === 3;
  const gameOver = gameStatus === 2;
  
  // Use refs to track if dialogs have been shown - refs don't cause re-renders
  const bedDialogShownRef = useRef(false);
  const shanghaiDialogShownRef = useRef(false);
  const lastBedNumberRef = useRef<number | undefined>(undefined);
  const lastShanghaiNumberRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Only show if it's a NEW bed (different number or first time)
    if (bedPendingAllocation && bedNumber) {
      if (bedNumber !== lastBedNumberRef.current || !bedDialogShownRef.current) {
        setShowBedDialog(true);
        bedDialogShownRef.current = true;
        lastBedNumberRef.current = bedNumber;
      }
    } else {
      // Reset when allocation is done
      bedDialogShownRef.current = false;
      lastBedNumberRef.current = undefined;
    }
  }, [bedPendingAllocation, bedNumber]);

  useEffect(() => {
    // Only show if it's a NEW shanghai (different number or first time)
    if (shanghaiPendingAllocation && shanghaiNumber) {
      if (shanghaiNumber !== lastShanghaiNumberRef.current || !shanghaiDialogShownRef.current) {
        setShowShanghaiDialog(true);
        shanghaiDialogShownRef.current = true;
        lastShanghaiNumberRef.current = shanghaiNumber;
      }
    } else {
      // Reset when allocation is done
      shanghaiDialogShownRef.current = false;
      lastShanghaiNumberRef.current = undefined;
    }
  }, [shanghaiPendingAllocation, shanghaiNumber]);

  const handleSegmentClick = (segment: string, multiplier: number, value: number) => {
    haptics.mediumTap();
    if (isMickeyMouse && editingThrowIndex !== null && (multiplier === 2 || multiplier === 3)) {
      setPendingThrow({ segment, value, multiplier });
      setShowAllocationDialog(true);
    } else {
      onThrow(segment, multiplier, value);
    }
  };

  const handleAllocationConfirm = (segment: string, multiplier: number, value: number, allocation: string) => {
    setShowAllocationDialog(false);
    setPendingThrow(null);
    onThrow(segment, multiplier, value, allocation);
  };

  const handleAllocationCancel = () => {
    setShowAllocationDialog(false);
    setPendingThrow(null);
  };

  const handleBedConfirm = (allocation: 'Number' | 'Beds' | 'Custom', customAllocations?: Record<number, string>) => {
    setShowBedDialog(false);
    if (onBedAllocation) {
      if (allocation === 'Custom' && customAllocations) {
        const bedAlloc = `${customAllocations[1] || 'Number'},${customAllocations[2] || 'Number'},${customAllocations[3] || 'Number'}`;
        onBedAllocation(bedAlloc);
      } else {
        onBedAllocation(allocation);
      }
    }
  };

  const handleBedCancel = () => {
    setShowBedDialog(false);
  };

  const handleShanghaiConfirm = (singleAlloc: string, doubleAlloc: string, tripleAlloc: string) => {
    setShowShanghaiDialog(false);
    if (onShanghaiAllocation) {
      onShanghaiAllocation(singleAlloc, doubleAlloc, tripleAlloc);
    }
  };

  const handleShanghaiCancel = () => {
    setShowShanghaiDialog(false);
  };

  return (
    <div className="flex-shrink-0 w-full max-w-md mx-auto">
      {/* Dartboard */}
      <div className="p-2 rounded-2xl border-4"
           style={{
             background: `linear-gradient(to bottom right, ${theme.backgrounds.base.split(' ').map(c => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})`,
             borderColor: turnComplete && editingThrowIndex === null 
               ? theme.stateColors.winner.border
               : editingThrowIndex !== null 
                 ? theme.stateColors.winner.border
                 : theme.borders.primary,
             boxShadow: (turnComplete && editingThrowIndex === null) || editingThrowIndex !== null
               ? `0 0 30px ${theme.stateColors.winner.border}44`
               : 'none'
           }}
      >
        <DartboardSVG
          size={Math.min(280, window.innerWidth - 100)} // Responsive, max 280px
          highlightSegment={lastThrow?.segment}
          onSegmentClick={handleSegmentClick}
          showClickable={(!turnComplete || editingThrowIndex !== null) && !gameOver}
        />
      </div>

      {/* Manual Scoring Pad */}
      <div className="mt-3">
        <ManualScoringPad
          onThrow={onThrow}
          disabled={turnComplete || gameOver}
          editingThrowIndex={editingThrowIndex}
        />
      </div>

      {/* Editing indicator */}
      <div className="mt-4">
        <EditingIndicator
          editingThrowIndex={editingThrowIndex}
          onChangToMiss={() => onThrow('MISS', 0, 0)}
        />
      </div>

      {/* Turn complete overlay */}
      <div className="mt-4">
        <TurnCompleteIndicator
          turnComplete={turnComplete}
          editingThrowIndex={editingThrowIndex}
          onConfirmTurn={onConfirmTurn}
          hideIfPendingAllocation={bedPendingAllocation || shanghaiPendingAllocation}
        />
      </div>

      {/* Allocation Dialog */}
      {showAllocationDialog && pendingThrow && (
        <AllocationDialog
          throwSegment={pendingThrow.segment}
          throwValue={pendingThrow.value}
          throwMultiplier={pendingThrow.multiplier}
          gameType={gameType}
          includeDoubles={true}
          includeTriples={true}
          includeBeds={true}
          onConfirm={handleAllocationConfirm}
          onCancel={handleAllocationCancel}
        />
      )}

      {/* Bed Allocation Dialog */}
      {showBedDialog && bedNumber && currentTurnThrows && (
        <BedAllocationDialog
          bedNumber={bedNumber}
          throws={currentTurnThrows.map(t => ({ segment: t.segment, multiplier: t.multiplier }))}
          onConfirm={handleBedConfirm}
          onCancel={handleBedCancel}
        />
      )}

      {/* Shanghai Allocation Dialog */}
      {showShanghaiDialog && shanghaiNumber && (
        <ShanghaiAllocationDialog
          shanghaiNumber={shanghaiNumber}
          onConfirm={handleShanghaiConfirm}
          onCancel={handleShanghaiCancel}
        />
      )}
    </div>
  );
};