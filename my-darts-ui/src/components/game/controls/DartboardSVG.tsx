import React from 'react';

interface DartboardSVGProps {
  size?: number;
  highlightSegment?: string;  // Yellow - last throw or editing throw
  targetSegment?: string;     // Green - current target
  onSegmentClick?: (segment: string, multiplier: number, value: number) => void;
  showClickable?: boolean;
  showNumbers?: boolean;
}

const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const DartboardSVG: React.FC<DartboardSVGProps> = ({ 
  size = 400, 
  highlightSegment,
  targetSegment,
  onSegmentClick, 
  showClickable = true,
  showNumbers = true
}) => {
  const center = size / 2;
  const scale = size / 400;
  
  const radii = {
    doubleBull: 8 * scale,
    singleBull: 20 * scale,
    innerSingle: 100 * scale,
    triple: 110 * scale,
    outerTriple: 120 * scale,
    outerSingle: 160 * scale,
    double: 170 * scale,
    outerDouble: 180 * scale,
  };

  const segmentAngle = 360 / 20;
  const startAngle = -99;

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const createSegmentPath = (index: number, innerRadius: number, outerRadius: number) => {
    const angle1 = startAngle + index * segmentAngle;
    const angle2 = angle1 + segmentAngle;

    const inner1 = polarToCartesian(angle1, innerRadius);
    const inner2 = polarToCartesian(angle2, innerRadius);
    const outer1 = polarToCartesian(angle1, outerRadius);
    const outer2 = polarToCartesian(angle2, outerRadius);

    const largeArc = segmentAngle > 180 ? 1 : 0;

    return `
      M ${inner1.x} ${inner1.y}
      L ${outer1.x} ${outer1.y}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outer2.x} ${outer2.y}
      L ${inner2.x} ${inner2.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${inner1.x} ${inner1.y}
      Z
    `;
  };

  const handleClick = (value: number, multiplier: number) => {
    if (onSegmentClick && showClickable) {
      const segment = multiplier === 3 ? `T${value}` : multiplier === 2 ? `D${value}` : `S${value}`;
      onSegmentClick(segment, multiplier, value);
    }
  };

  const isHighlighted = (value: number, multiplier: number) => {
    if (!highlightSegment || highlightSegment === 'MISS') return false;
    const segment = multiplier === 3 ? `T${value}` : multiplier === 2 ? `D${value}` : `S${value}`;
    return segment === highlightSegment;
  };

  const isTarget = (value: number, multiplier: number) => {
    if (!targetSegment || targetSegment === 'MISS') return false;
    const segment = multiplier === 3 ? `T${value}` : multiplier === 2 ? `D${value}` : `S${value}`;
    return segment === targetSegment;
  };

  const getSegmentColor = (index: number, isDouble: boolean, isTriple: boolean, value: number, multiplier: number) => {
    // Priority: highlight (yellow) > target (green) > normal
    if (isHighlighted(value, multiplier)) {
      return '#FFEA00'; // Yellow for last throw / editing
    }
    if (isTarget(value, multiplier)) {
      return '#76FF03'; // Bright green for current target
    }
    const isEven = index % 2 === 0;
    if (isDouble || isTriple) {
      return isEven ? '#E53935' : '#43A047';
    }
    return isEven ? '#1A1A1A' : '#F5F5DC';
  };

  const getBullColor = (isDouble: boolean) => {
    if (highlightSegment === 'SB' && !isDouble) return '#FFEA00'; // Yellow - editing/last throw
    if (highlightSegment === 'DB' && isDouble) return '#FFEA00';
    if (targetSegment === 'SB' && !isDouble) return '#76FF03'; // Green - current target
    if (targetSegment === 'DB' && isDouble) return '#76FF03';
    return isDouble ? '#E53935' : '#43A047';
  };

  return (
    <svg width={size} height={size} className="drop-shadow-2xl">
      {/* Outer ring */}
      <circle cx={center} cy={center} r={radii.outerDouble} fill="#1A1A1A" stroke="#888" strokeWidth="2" />

      {/* Segments */}
      {NUMBERS.map((num, index) => (
        <g key={num}>
          {/* Double ring */}
          <path
            d={createSegmentPath(index, radii.double, radii.outerDouble)}
            fill={getSegmentColor(index, true, false, num, 2)}
            stroke="#888"
            strokeWidth="0.5"
            className={showClickable ? 'cursor-pointer hover:brightness-125 transition-all' : ''}
            onClick={() => handleClick(num, 2)}
          />
          {/* Outer single */}
          <path
            d={createSegmentPath(index, radii.outerTriple, radii.double)}
            fill={getSegmentColor(index, false, false, num, 1)}
            stroke="#888"
            strokeWidth="0.5"
            className={showClickable ? 'cursor-pointer hover:brightness-125 transition-all' : ''}
            onClick={() => handleClick(num, 1)}
          />
          {/* Triple ring */}
          <path
            d={createSegmentPath(index, radii.triple, radii.outerTriple)}
            fill={getSegmentColor(index, false, true, num, 3)}
            stroke="#888"
            strokeWidth="0.5"
            className={showClickable ? 'cursor-pointer hover:brightness-125 transition-all' : ''}
            onClick={() => handleClick(num, 3)}
          />
          {/* Inner single */}
          <path
            d={createSegmentPath(index, radii.singleBull, radii.triple)}
            fill={getSegmentColor(index, false, false, num, 1)}
            stroke="#888"
            strokeWidth="0.5"
            className={showClickable ? 'cursor-pointer hover:brightness-125 transition-all' : ''}
            onClick={() => handleClick(num, 1)}
          />
        </g>
      ))}

      {/* Single bull */}
      <circle
        cx={center}
        cy={center}
        r={radii.singleBull}
        fill={getBullColor(false)}
        stroke="#888"
        strokeWidth="0.5"
        className={showClickable ? 'cursor-pointer hover:brightness-125 transition-all' : ''}
        onClick={() => onSegmentClick?.('S25', 1, 25)}
      />

      {/* Double bull */}
      <circle
        cx={center}
        cy={center}
        r={radii.doubleBull}
        fill={getBullColor(true)}
        stroke="#888"
        strokeWidth="0.5"
        className={showClickable ? 'cursor-pointer hover:brightness-125 transition-all' : ''}
        onClick={() => onSegmentClick?.('D25', 2, 25)}
      />

      {/* Number labels */}
      {showNumbers && NUMBERS.map((num, index) => {
        const angle = startAngle + index * segmentAngle + segmentAngle / 2;
        const pos = polarToCartesian(angle, radii.outerDouble + 15 * scale);
        return (
          <text
            key={`label-${num}`}
            x={pos.x}
            y={pos.y}
            fill="white"
            fontSize={14 * scale}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {num}
          </text>
        );
      })}
    </svg>
  );
};

export default DartboardSVG;