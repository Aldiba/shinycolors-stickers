import React from "react";

// 定义 Props 接口
interface SettingSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

const SettingSlider: React.FC<SettingSliderProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className = "range-xs",
}) => {
  // 事件类型：React.ChangeEvent<HTMLInputElement>
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? 0 : Number(e.target.value); 
    // 注意：这里最好处理一下空字符串，或者允许 onChange 接收 string | number
    onChange(val);
  };

  const handleStep = (direction: number) => {
    let newValue = Number(value) + direction * step;
    if (min !== undefined && newValue < min) newValue = min;
    if (max !== undefined && newValue > max) newValue = max;
    newValue = Math.round(newValue * 100) / 100;
    onChange(newValue);
  };

  return (
    <div className="flex-1 w-full">
      <div className="flex justify-between items-end mb-2">
        <label className="label-text font-bold text-gray-700 pb-1">
          {label}
        </label>
        
        {/*  加减  */}
        <div className="join shadow-sm">
          <button 
            className="join-item btn btn-xs btn-neutral text-lg px-2"
            onClick={() => handleStep(-1)}
          >-</button>
          <input
            className="join-item input input-xs input-bordered w-12 text-center text-base font-bold px-0 focus:outline-none"
            type="number"
            value={value}
            onChange={handleInputChange}
          />
          <button 
            className="join-item btn btn-xs btn-neutral text-lg px-2"
            onClick={() => handleStep(1)}
          >+</button>
        </div>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value === "" ? min : value}
        onChange={handleInputChange}
        className={`range range-secondary ${className}`}
      />
    </div>
  );
};

export default SettingSlider;