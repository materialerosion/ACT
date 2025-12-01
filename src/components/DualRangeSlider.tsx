'use client';

import React, { useRef, useEffect, useState } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  formatLabel?: (value: number) => string;
  color?: string;
  minBoundLabel?: string;
  maxBoundLabel?: string;
}

export default function DualRangeSlider({
  min,
  max,
  step = 1,
  minValue,
  maxValue,
  onChange,
  formatLabel = (value) => value.toString(),
  color = '#3B82F6',
  minBoundLabel,
  maxBoundLabel
}: DualRangeSliderProps) {
  const [localMinValue, setLocalMinValue] = useState(minValue);
  const [localMaxValue, setLocalMaxValue] = useState(maxValue);
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMinValue(minValue);
    setLocalMaxValue(maxValue);
  }, [minValue, maxValue]);

  useEffect(() => {
    updateTrack();
  }, [localMinValue, localMaxValue, min, max]);

  const updateTrack = () => {
    if (trackRef.current) {
      const percent1 = ((localMinValue - min) / (max - min)) * 100;
      const percent2 = ((localMaxValue - min) / (max - min)) * 100;
      trackRef.current.style.left = `${percent1}%`;
      trackRef.current.style.width = `${percent2 - percent1}%`;
    }
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), localMaxValue - step);
    setLocalMinValue(value);
    onChange(value, localMaxValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), localMinValue + step);
    setLocalMaxValue(value);
    onChange(localMinValue, value);
  };

  return (
    <div className="w-full">
      <div className="relative h-12 mb-2">
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded"></div>
        
        {/* Active track */}
        <div 
          ref={trackRef}
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded transition-all duration-100"
          style={{ backgroundColor: color }}
        ></div>

        {/* Min range input */}
        <input
          ref={minInputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMinValue}
          onChange={handleMinChange}
          className="absolute w-full h-1 top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
          style={{
            zIndex: localMinValue > max - (max - min) / 4 ? 5 : 3,
          }}
        />

        {/* Max range input */}
        <input
          ref={maxInputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMaxValue}
          onChange={handleMaxChange}
          className="absolute w-full h-1 top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
          style={{
            zIndex: 4,
          }}
        />
      </div>

      {/* Value labels */}
      <div className="flex justify-between text-sm text-gray-700 font-medium">
        <div className="flex flex-col items-start">
          <span>{formatLabel(localMinValue)}</span>
          {minBoundLabel && localMinValue === min && (
            <span className="text-xs text-gray-500 mt-0.5">{minBoundLabel}</span>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span>{formatLabel(localMaxValue)}</span>
          {maxBoundLabel && localMaxValue === max && (
            <span className="text-xs text-gray-500 mt-0.5">{maxBoundLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
