// utils/drawLogic.ts
import { StickerSettings } from '../types'; 

export const CANVAS_CONSTANTS = {
  CANVAS_WIDTH: 296,
  CANVAS_HEIGHT: 256,
  MITER_LIMIT: 2.5,
  CURVE_OFFSET_FACTOR: 3.5,
};

export const renderCanvas = (
  ctx: CanvasRenderingContext2D, 
  loadedImage: HTMLImageElement, 
  settings: StickerSettings,     
  seed: number
): void => {
  if (!ctx || !loadedImage) return;

  const {
    text, font, s, x, y, r,
    fillColor, strokeColor, outstrokeColor,
    whiteStrokeSize, colorStrokeSize,
    lineSpacing, ls, vertical, textOnTop,
    curve, curveFactor, wobbly, wobblyScale, wobblyRotation,
  } = settings;
  
    try {
      document.fonts.load(`${s}px ${font}`);
    } catch (e) {
      console.warn("Font loading check failed", e);
    }
  
    ctx.canvas.width = CANVAS_CONSTANTS.CANVAS_WIDTH;
    ctx.canvas.height = CANVAS_CONSTANTS.CANVAS_HEIGHT;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
    // --- 绘制背景图 ---
    const drawImg = () => {
      const img = loadedImage;
      const hRatio = ctx.canvas.width / img.width;
      const vRatio = ctx.canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShiftX = (ctx.canvas.width - img.width * ratio) / 2;
      const centerShiftY = (ctx.canvas.height - img.height * ratio) / 2;
      
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShiftX,
        centerShiftY,
        img.width * ratio,
        img.height * ratio
      );
    };
  
    // --- 绘制文本 ---
    const drawTxt = () => {
      
      ctx.font = `${s}px ${font}, SSFangTang, YWaFangYuan, sans-serif`;
      ctx.miterLimit = CANVAS_CONSTANTS.MITER_LIMIT;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
  
      ctx.save();
      // 全局位移与旋转
      ctx.translate(x, y);
      ctx.rotate(r / 10);
      ctx.textAlign = "center";
      ctx.fillStyle = fillColor;
  
      // 绘制单个字符的描边与填充
      const drawStrokeAndFill = (char, dx, dy, pass) => {
        if (pass === 0) {
          // 第一遍：白色外描边 (最底层)
          ctx.strokeStyle = outstrokeColor;
          ctx.lineWidth = whiteStrokeSize;
          ctx.strokeText(char, dx, dy);
        } else {
          // 第二遍：彩色内描边 + 填充
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = colorStrokeSize;
          ctx.strokeText(char, dx, dy);
          ctx.fillText(char, dx, dy);
        }
      };
  
      // 处理抖动效果并调用绘制
      const drawEffectiveChar = (char, dx, dy, pass, index) => {
        if (wobbly) {
          // 使用 seed 和 index 生成伪随机数，保证同一帧渲染结果一致
          const pseudoRandom = Math.sin(seed + index * 12.34);
          const scale = 1 + pseudoRandom * wobblyScale;
          const rotation = pseudoRandom * wobblyRotation;
  
          ctx.save();
          ctx.translate(dx, dy);
          ctx.rotate(rotation);
          ctx.scale(scale, scale);
          drawStrokeAndFill(char, 0, 0, pass);
          ctx.restore();
        } else {
          drawStrokeAndFill(char, dx, dy, pass);
        }
      };
  
      const lines = text.split("\n");
      let charCounter = 0;
  
      // --- 核心排版逻辑 ---
      
      if (curve) {
        // === 曲线模式 ===
        if (vertical) {
          // 垂直 + 曲线
          for (let pass = 0; pass < 2; pass++) {
            ctx.save();
            let xOffset = 0;
            charCounter = 0;
            for (const line of lines) {
              let yOffset = 0;
              ctx.save();
              ctx.translate(xOffset, 0);
              for (let j = 0; j < line.length; j++) {
                charCounter++;
                const char = line[j];
                // 垂直曲线的旋转角度计算
                const charAngle = (Math.PI / 180) * j * ((curveFactor - 6) * 3);
                
                ctx.rotate(charAngle);
                drawEffectiveChar(char, 0, yOffset, pass, charCounter);
                yOffset += s + ls;
              }
              ctx.restore();
              // 垂直模式下列的间距
              xOffset += ((lineSpacing - 50) / 50 + 1) * s;
            }
            ctx.restore();
          }
        } else {
          // 水平 + 曲线
          let currentY_H = 0;
          for (const line of lines) {
            const lineAngle = (Math.PI * line.length) / curveFactor;
            for (let pass = 0; pass < 2; pass++) {
              ctx.save();
              ctx.translate(0, currentY_H);
              
              // 计算当前行之前的字符总数，用于保持 seed 的连续性
              let lineStartCharIndex = lines
                .slice(0, lines.indexOf(line))
                .join("").length;
  
              for (let j = 0; j < line.length; j++) {
                const char = line[j];
                // 曲线旋转逻辑
                ctx.rotate(lineAngle / line.length / (0.3 * curveFactor));
                ctx.save();
                ctx.translate(0, -1 * s * CANVAS_CONSTANTS.CURVE_OFFSET_FACTOR);
                
                drawEffectiveChar(char, 0, 0, pass, lineStartCharIndex + j);
                ctx.restore();
              }
              ctx.restore();
            }
            // 行间距
            currentY_H += ((lineSpacing - 50) / 50 + 1) * s;
          }
        }
      } else {
        // === 普通模式 (直线) ===
        if (vertical) {
          // 垂直排版
          for (let pass = 0; pass < 2; pass++) {
            let xOffset = 0;
            charCounter = 0;
            for (const line of lines) {
              let yOffset = 0;
              for (const char of line) {
                charCounter++;
                drawEffectiveChar(char, xOffset, yOffset, pass, charCounter);
                yOffset += s + ls;
              }
              xOffset += ((lineSpacing - 50) / 50 + 1) * s;
            }
          }
        } else {
          // 水平排版 (默认)
          for (let pass = 0; pass < 2; pass++) {
            let yOffset = 0;
            charCounter = 0;
            for (const line of lines) {
              let xOffset = 0;
              for (const char of line) {
                charCounter++;
                const charWidth = ctx.measureText(char).width + ls;
                drawEffectiveChar(char, xOffset, yOffset, pass, charCounter);
                xOffset += charWidth;
              }
              yOffset += ((lineSpacing - 50) / 50 + 1) * s;
            }
          }
        }
      }
      
      ctx.restore();
    };
  
    // 3. 根据层级决定绘制顺序
    if (textOnTop) {
      drawImg();
      drawTxt();
    } else {
      drawTxt();
      drawImg();
    }
  };