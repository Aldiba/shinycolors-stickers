// 和 App.jsx 里的 settings 初始值对应
export interface stickerSettings {
    text: string;
    x: number;
    y: number;
    s: number; // font size
    ls: number; // letter spacing
    r: number; // rotation
    lineSpacing: number;
    fillColor: string;
    strokeColor: string;
    outstrokeColor: string;
    colorStrokeSize: number;
    whiteStrokeSize: number;
    vertical: boolean;
    textOnTop: boolean;
    font: string;
    curve: boolean;
    curveFactor: number;
    wobbly: boolean;
    wobblyScale: number;
    wobblyRotation: number;
  }
  
  export interface CharacterData {
    id: string;
    name: string;
    img: string;
    defaultText: {
      text: string;
      x: number;
      y: number;
      s: number;
      ls: number;
      r: number;
      // ... 其他默认值
    };
    vertical: boolean;
    fillColor: string;
    strokeColor: string;
    outstrokeColor: string;
  }