import React from 'react';

interface DirectionCompassProps {
  deg?: number;
  type: 'wave' | 'wind';
  size?: number;
}

/**
 * Converts degrees (0-359) to cardinal direction code
 */
function degreesToDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Calculates the path for a donut sector spanning 60° (±30°) around the given direction
 */
function getSectorPath(centerX: number, centerY: number, degrees: number, outerRadius: number, innerRadius: number): string {
  const startAngle = degrees - 30;
  const endAngle = degrees + 30;

  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;

  const x1 = centerX + outerRadius * Math.sin(startAngleRad);
  const y1 = centerY - outerRadius * Math.cos(startAngleRad);
  const x2 = centerX + outerRadius * Math.sin(endAngleRad);
  const y2 = centerY - outerRadius * Math.cos(endAngleRad);

  const x3 = centerX + innerRadius * Math.sin(endAngleRad);
  const y3 = centerY - innerRadius * Math.cos(endAngleRad);
  const x4 = centerX + innerRadius * Math.sin(startAngleRad);
  const y4 = centerY - innerRadius * Math.cos(startAngleRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
}

/**
 * Reusable compass component for displaying direction (wave or wind)
 */
export const DirectionCompass: React.FC<DirectionCompassProps> = ({
  deg,
  type: _type,
  size = 40
}) => {
  // Handle null/undefined degrees
  if (deg == null) {
    return (
      <div
        className="flex items-center justify-center text-content-quaternary"
        style={{ width: size, height: size }}
      >
        <span className="text-xs">—</span>
      </div>
    );
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 1.8; // Make circle bigger - fills more of the component
  const innerRadius = (size * 85) / 200; // Scale inner radius proportionally for bigger circle

  const direction = degreesToDirection(deg);
  const sectorPath = getSectorPath(centerX, centerY, deg, outerRadius, innerRadius);

  // Color based on direction - traditional compass colors
  const getDirectionColor = (dir: string) => {
    switch (dir) {
      case 'N': return '#d63031'; // red for North
      case 'NE': return '#0071e3'; // blue for NE
      case 'E': return '#ff8c00'; // orange for East
      case 'SE': return '#0056cc'; // dark blue for SE
      case 'S': return '#0071e3'; // blue for South
      case 'SW': return '#cd853f'; // brown for SW
      case 'W': return '#228b22'; // green for West
      case 'NW': return '#6a5acd'; // purple for NW
      default: return '#3c3c43'; // content.secondary
    }
  };

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`-8 -8 ${size + 16} ${size + 16}`}
        className="overflow-visible"
      >
        {/* Outer circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Inner circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Cardinal direction triangle ticks - outside the circle */}
        {[0, 90, 180, 270].map((angle) => {
          const angleRad = (angle * Math.PI) / 180;
          const triangleSize = 6; // Size of the triangle
          const outerDistance = outerRadius; // Distance from center to triangle base - no space between ticks and circle

          // Calculate triangle points
          const baseCenterX = centerX + outerDistance * Math.sin(angleRad);
          const baseCenterY = centerY - outerDistance * Math.cos(angleRad);

          // Triangle points: base center, and two points forming the triangle tip outward
          const halfBase = triangleSize / 2;
          const tipDistance = outerDistance + triangleSize;

          const tipX = centerX + tipDistance * Math.sin(angleRad);
          const tipY = centerY - tipDistance * Math.cos(angleRad);

          // Perpendicular vector for triangle base
          const perpX = -Math.cos(angleRad) * halfBase;
          const perpY = -Math.sin(angleRad) * halfBase;

          const base1X = baseCenterX + perpX;
          const base1Y = baseCenterY + perpY;
          const base2X = baseCenterX - perpX;
          const base2Y = baseCenterY - perpY;

          const trianglePath = `M ${base1X} ${base1Y} L ${tipX} ${tipY} L ${base2X} ${base2Y} Z`;

          return (
            <path
              key={angle}
              d={trianglePath}
              fill="currentColor"
              opacity="0.6"
            />
          );
        })}

        {/* Direction indicator sector */}
        <path
          d={sectorPath}
          fill="#c41e3a"
          opacity="0.8"
        />

        {/* Center text - centered in compass */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={getDirectionColor(direction)}
          style={{
            fontSize: size * 0.4,
            fontWeight: 'bold'
          }}
        >
          {direction}
        </text>
      </svg>
    </div>
  );
};

export default DirectionCompass;
