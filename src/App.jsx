import React, { useState, useEffect, useRef, useCallback, useDeferredValue } from "react";

// 字体引入
import YurukaStd from "./fonts/YurukaStd.woff2";
import SSFangTangTi from "./fonts/ShangShouFangTangTi.woff2";
import YouWangFangYuanTi from "./fonts/攸望方圆体-中.woff2"; // 后台加载

// 样式与组件
import "./App.css";
import Canvas from "./components/Canvas";
import characters from "./characters.json";
import Picker from "./components/Picker";
import Info from "./components/Info";

// UI 库组件
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Snackbar from "@mui/material/Snackbar";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import ColorPicker from "@uiw/react-color-chrome";

// 工具类
import getConfiguration from "./utils/config";
import log from "./utils/log";
import { preloadFont } from "./utils/preload";

const { ClipboardItem } = window;

const CONSTANTS = {
  CANVAS_WIDTH: 296,
  CANVAS_HEIGHT: 256,
  DEFAULT_FONT_SIZE: 50,
  DEFAULT_LINE_SPACING: 50,
  MITER_LIMIT: 2.5,
  CURVE_OFFSET_FACTOR: 3.5,
};

const fontList = [
  { name: "YurukaStd", path: YurukaStd },       // 索引 0: 关键
  { name: "SSFangTangTi", path: SSFangTangTi }, // 索引 1: 关键
  { name: "YouWangFangYuanTi", path: YouWangFangYuanTi }, // 索引 2: 非关键 (后台加载)
];

function App() {
  // ... (状态定义保持不变) ...
  const [config, setConfig] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [openCopySnackbar, setOpenCopySnackbar] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const [character, setCharacter] = useState(18);
  const [customImageSrc, setCustomImageSrc] = useState(null);
  const [loadedImage, setLoadedImage] = useState(null);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000)); 

  const [settings, setSettings] = useState({
    text: "",
    x: 0,
    y: 0,
    s: CONSTANTS.DEFAULT_FONT_SIZE,
    ls: 0,
    r: 0,
    lineSpacing: CONSTANTS.DEFAULT_LINE_SPACING,
    fillColor: "#ffffff",
    strokeColor: "#000000",
    outstrokeColor: "#ffffff",
    colorStrokeSize: 5,
    whiteStrokeSize: 10,
    vertical: false,
    textOnTop: true,
    font: "YurukaStd",
    curve: false,
    curveFactor: 6,
    wobbly: false, 
    wobblyScale: 0.3,   
    wobblyRotation: 0.3 
  });

  const deferredSettings = useDeferredValue(settings);
  const deferredSeed = useDeferredValue(seed); 
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // --- 核心修改：初始化与字体预加载 ---
  useEffect(() => {
    getConfiguration().then(setConfig).catch(console.error);
    const controller = new AbortController();
    
    const loadFonts = async () => {
      // 1. 定义关键字体 (前两个)
      const criticalFonts = fontList.slice(0, 2);
      // 2. 定义非关键字体 (第三个及以后)
      const optionalFonts = fontList.slice(2);

      // 3. 立即触发关键字体的加载
      const criticalPromises = criticalFonts.map(f => 
        preloadFont(f.name, f.path, controller.signal)
          .catch(err => console.error(`Failed to load critical font ${f.name}`, err))
      );

      // 4. 立即触发非关键字体的加载 (让它在后台跑，我们不 await 它)
      optionalFonts.forEach(f => {
        preloadFont(f.name, f.path, controller.signal)
          .then(() => {
             console.log(`Optional font loaded: ${f.name}`);
             // 可选：如果用户碰巧选了第三个字体，这里可以强制重绘一次
             // 但通常不需要，因为 Canvas 下一次操作会自动用上
          })
          .catch(err => console.error(`Failed to load optional font ${f.name}`, err));
      });

      // 5. 只等待关键字体完成！
      await Promise.all(criticalPromises);
      
      // 等待浏览器解析关键字体
      // 注意：document.fonts.ready 可能会等待所有 pending 的字体，
      // 为了让 UI 更快解除锁定，我们可以假设 Promise.all 结束后，关键字体已经可用。
      // 如果你想极致快，可以把下面这行 await document.fonts.ready 注释掉，
      // 但保留它通常比较稳妥，防止 FOUT (字体闪烁)。
      // 这里我们为了速度，选择相信 preloadFont 内部的 font.load() 已经足够。
      
      console.log("Critical fonts loaded! UI Unlocked.");
      setFontsLoaded(true); // 解除 Loading 遮罩
    };

    loadFonts();
    return () => controller.abort();
  }, []);

  // ... (后续所有代码保持不变) ...
  
  // 为了确保代码完整性，以下是接下来的逻辑摘要，直接复制粘贴即可覆盖原文件
  // -----------------------------------------------------------------

  useEffect(() => {
    const charData = characters[character];
    const def = charData.defaultText;
    
    setSettings((prev) => ({
      ...prev,
      text: def.text,
      x: def.x,
      y: def.y,
      s: def.s,
      ls: def.ls,
      r: def.r,
      vertical: charData.vertical,
      fillColor: charData.fillColor,
      strokeColor: charData.strokeColor,
      outstrokeColor: charData.outstrokeColor,
    }));
    
    setCustomImageSrc(null);
  }, [character]);

  // --- 图片加载逻辑 ---
  useEffect(() => {
    const img = new Image();
    const src = customImageSrc || ("img/" + characters[character].img);
    img.src = src;
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      setLoadedImage(img);
    };

    return () => {
      img.onload = null;
    };
  }, [character, customImageSrc]);

  // --- 辅助函数 ---
  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePositionChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const generateNewSeed = () => {
    setSeed(Math.floor(Math.random() * 10000));
  };

  const handleSeedChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setSeed(val);
    } else if (e.target.value === "") {
        setSeed(0);
    }
  };

  // --- 拖拽交互逻辑 ---
  const handlePointerDown = (e) => {
    isDragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastPos.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    if(e.cancelable && e.type === 'touchmove') e.preventDefault(); 

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;

    setSettings(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));

    lastPos.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // --- 绘图核心逻辑 ---
  const draw = useCallback((ctx) => {
    if (!loadedImage) return;

    const currentSettings = deferredSettings;
    const currentSeed = deferredSeed;

    document.fonts.load(`${currentSettings.s}px ${currentSettings.font}`); 

    ctx.canvas.width = CONSTANTS.CANVAS_WIDTH;
    ctx.canvas.height = CONSTANTS.CANVAS_HEIGHT;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const drawImg = () => {
      const img = loadedImage;
      const hRatio = ctx.canvas.width / img.width;
      const vRatio = ctx.canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShiftX = (ctx.canvas.width - img.width * ratio) / 2;
      const centerShiftY = (ctx.canvas.height - img.height * ratio) / 2;
      ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
    };

    const drawTxt = () => {
      const {
        text, font, s, x, y, r, fillColor, strokeColor, outstrokeColor,
        whiteStrokeSize, colorStrokeSize, lineSpacing, ls,
        vertical, curve, curveFactor, 
        wobbly, wobblyScale, wobblyRotation // 引入新变量
      } = currentSettings;
      
      ctx.font = `${s}px ${font}, SSFangTangTi, YouWangFangYuanTi`;
      ctx.miterLimit = CONSTANTS.MITER_LIMIT;
      ctx.lineJoin = "round"; 
      ctx.lineCap = "round";

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r / 10);
      ctx.textAlign = "center";
      ctx.fillStyle = fillColor;

      const drawStrokeAndFill = (char, dx, dy, pass) => {
        if (pass === 0) {
          ctx.strokeStyle = outstrokeColor;
          ctx.lineWidth = whiteStrokeSize;
          ctx.strokeText(char, dx, dy);
        } else {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = colorStrokeSize;
          ctx.strokeText(char, dx, dy);
          ctx.fillText(char, dx, dy);
        }
      };

      // 封装：带有 Wobbly 效果的绘制器
      const drawEffectiveChar = (char, dx, dy, pass, index) => {
        if (wobbly) {
          // 伪随机数 (-1 ~ 1)
          const pseudoRandom = Math.sin(currentSeed + index * 12.34); 
          
          // 大小控制： 1 ± (随机数 * 强度)
          // 如果 wobblyScale 为 0.3，则缩放范围约 0.7 ~ 1.3
          const scale = 1 + (pseudoRandom * wobblyScale); 

          // 角度控制： 随机数 * 强度 (弧度)
          // 如果 wobblyRotation 为 0.5，则旋转范围约 -0.5rad ~ 0.5rad
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

      if (curve) {
        if (vertical) {
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
                const charAngle = (Math.PI / 180) * j * ((curveFactor - 6) * 3);
                ctx.rotate(charAngle);
                drawEffectiveChar(char, 0, yOffset, pass, charCounter);
                yOffset += s + ls;
              }
              ctx.restore();
              xOffset += ((lineSpacing - 50) / 50 + 1) * s;
            }
            ctx.restore();
          }
        } else {
          let currentY_H = 0;
          for (const line of lines) {
             const lineAngle = (Math.PI * line.length) / curveFactor;
             for (let pass = 0; pass < 2; pass++) {
               ctx.save();
               ctx.translate(0, currentY_H);
               let lineStartCharIndex = lines.slice(0, lines.indexOf(line)).join("").length;
               for (let j = 0; j < line.length; j++) {
                 const char = line[j];
                 ctx.rotate(lineAngle / line.length / (0.3 * curveFactor));
                 ctx.save();
                 ctx.translate(0, -1 * s * CONSTANTS.CURVE_OFFSET_FACTOR);
                 drawEffectiveChar(char, 0, 0, pass, lineStartCharIndex + j);
                 ctx.restore();
               }
               ctx.restore();
             }
             currentY_H += ((lineSpacing - 50) / 50 + 1) * s; 
          }
        }
      } else {
        // --- 正常模式 ---
        if (vertical) {
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
          // 横排
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

    if (currentSettings.textOnTop) {
      drawImg();
      drawTxt();
    } else {
      drawTxt();
      drawImg();
    }

  }, [loadedImage, deferredSettings, deferredSeed, fontsLoaded]); 


  const download = async () => {
    const canvas = document.getElementsByTagName("canvas")[0];
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${characters[character].name}_stickers.png`;
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await log(characters[character].id, characters[character].name, "download");
    setConfig(prev => prev ? ({ ...prev, total: prev.total + 1 }) : null);
  };

  function b64toBlob(b64Data, contentType = "image/png", sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  }

  const copy = async () => {
    const canvas = document.getElementsByTagName("canvas")[0];
    if (!canvas) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": b64toBlob(canvas.toDataURL().split(",")[1]),
        }),
      ]);
      setOpenCopySnackbar(true);
      await log(characters[character].id, characters[character].name, "copy");
      setConfig(prev => prev ? ({ ...prev, total: prev.total + 1 }) : null);
    } catch (err) {
      console.error("Copy failed", err);
      alert("Copy failed. Please try downloading instead.");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImageSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isReady = loadedImage && fontsLoaded;

  return (
    <div className="App">
      <Info open={infoOpen} handleClose={() => setInfoOpen(false)} config={config} />
      
      <div className="counter">
        Total Stickers you made: {config?.total || "..."}
      </div>

      <div className="container">
        <div className="vertical">
          <div 
            className="canvas-wrapper" 
            style={{ position: 'relative', cursor: isDragging.current ? 'grabbing' : 'grab' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            <div className="canvas">
              <Canvas draw={draw} spaceSize={settings.lineSpacing} />
            </div>

            {!isReady && (
              <Box
                sx={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10, flexDirection: 'column', gap: 1
                }}
              >
                <CircularProgress color="secondary" />
                <span style={{ fontSize: '0.8rem', color: '#666' }}>Loading Assets...</span>
              </Box>
            )}
          </div>
          
          <Slider
            value={
              settings.curve && !settings.vertical 
                ? 256 - settings.y + settings.s * 3 
                : 256 - settings.y
            }
            onChange={(e, v) =>
              handlePositionChange("y", 
                settings.curve && !settings.vertical ? 256 + settings.s * 3 - v : 256 - v
              )
            }
            min={-50} max={256} step={1}
            orientation="vertical"
            track={false}
            color="secondary"
          />
        </div>

        <div className="horizontal">
          <Slider
            className="slider-horizontal"
            value={settings.x}
            onChange={(e, v) => handlePositionChange("x", v)}
            min={0} max={296} step={1}
            track={false}
            color="secondary"
          />
          
          <div className="text_react">
            <div className="text">
              <TextField
                label="Text" size="small" color="secondary"
                value={settings.text}
                multiline fullWidth
                onChange={(e) => updateSetting("text", e.target.value)}
              />
            </div>

            <FormControl fullWidth>
              <InputLabel id="font-select-label" color="secondary">Font</InputLabel>
              <Select
                labelId="font-select-label"
                value={settings.font}
                label="Font" size="small" color="secondary"
                onChange={(e) => updateSetting("font", e.target.value)}
              >
                {fontList.map((f) => (
                  <MenuItem key={f.name} value={f.name}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="settings">
            <div className="strokesize">
              <div>
                <label><nobr>Inner Stroke: </nobr></label>
                <Slider
                  value={settings.colorStrokeSize}
                  onChange={(e, v) => updateSetting("colorStrokeSize", v)}
                  min={0} max={25} step={1}
                  track={false} color="secondary"
                />
              </div>
              <div>
                <label><nobr>Outer Stroke: </nobr></label>
                <Slider
                  value={settings.whiteStrokeSize}
                  onChange={(e, v) => updateSetting("whiteStrokeSize", v)}
                  min={0} max={35} step={1}
                  track={false} color="secondary"
                />
              </div>
            </div>

            <div className="normal">
              <div>
                <label>Rotate:</label>
                <Slider
                  value={settings.r}
                  onChange={(e, v) => updateSetting("r", v)}
                  min={-16} max={16} step={0.1}
                  track={false} color="secondary"
                />
              </div>
              <div>
                <label><nobr>Font Size:</nobr></label>
                <Slider
                  value={settings.s}
                  onChange={(e, v) => updateSetting("s", v)}
                  min={5} max={100} step={1}
                  track={false} color="secondary"
                />
              </div>
              
              <div>
                <label>TextOnTop:</label>
                <Switch
                  checked={settings.textOnTop}
                  onChange={(e) => updateSetting("textOnTop", e.target.checked)}
                  color="secondary"
                />
              </div>
              <div>
                <label>Vertical:</label>
                <Switch
                  checked={settings.vertical}
                  onChange={(e) => updateSetting("vertical", e.target.checked)}
                  color="secondary"
                />
              </div>
            </div>

            <div className="linesetting">
              <div>
                <label><nobr>LineSpacing: </nobr></label>
                <Slider
                  value={settings.lineSpacing}
                  onChange={(e, v) => updateSetting("lineSpacing", v)}
                  min={0} max={100} step={1}
                  track={false} color="secondary"
                />
              </div>
              <div>
                <label><nobr>LetterSpacing: </nobr></label>
                <Slider
                  value={settings.ls}
                  onChange={(e, v) => updateSetting("ls", v)}
                  min={-20} max={50} step={1}
                  track={false} color="secondary"
                />
              </div>
              <div>
                <label>Curve: </label>
                <Switch
                  checked={settings.curve}
                  onChange={(e) => updateSetting("curve", e.target.checked)}
                  color="secondary"
                />
              </div>
              <div>
                <label><nobr>Curve Factor: </nobr></label>
                <Slider
                  value={settings.curveFactor}
                  onChange={(e, v) => updateSetting("curveFactor", v)}
                  min={3} max={10} step={0.1}
                  track={false} color="secondary"
                />
              </div>
            </div>

            {/* --- 新增：Wobbly Section (独立一行，位于 spacing 下面) --- */}
            <div className="wobbly-section" style={{
              display: 'flex', flexDirection: 'column', gap: '8px',
              padding: '10px', border: '1px solid #eee', borderRadius: '8px',
              margin: '10px 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{display:'flex', alignItems:'center'}}>
                      <label style={{marginRight: '8px', fontWeight: 'bold'}}>Wobbly:</label>
                      <Switch
                        checked={settings.wobbly}
                        onChange={(e) => updateSetting("wobbly", e.target.checked)}
                        color="secondary"
                      />
                  </div>
                  
                  {settings.wobbly && (
                    <div style={{display:'flex', gap: '8px', alignItems: 'center'}}>
                         {/* 种子输入框 */}
                        <TextField
                           label="Seed"
                           type="number"
                           size="small"
                           variant="outlined"
                           value={seed}
                           onChange={handleSeedChange}
                           color="secondary"
                           style={{width: '80px'}}
                           inputProps={{style: {padding: '5px 8px'}}}
                           InputLabelProps={{style: {fontSize: '0.8rem'}}}
                        />
                        <Button 
                            size="small" 
                            onClick={generateNewSeed}
                            color="secondary"
                            variant="outlined"
                            style={{minWidth: '30px', padding: '4px'}}
                            title="Random Seed"
                        >
                            🎲
                        </Button>
                    </div>
                  )}
                </div>

                {settings.wobbly && (
                    <div style={{display: 'flex', gap: '15px'}}>
                        <div style={{flex: 1}}>
                            <label style={{fontSize: '0.8rem'}}>Scale Chaos:</label>
                            <Slider
                                value={settings.wobblyScale}
                                onChange={(e, v) => updateSetting("wobblyScale", v)}
                                min={0} max={0.2} step={0.01}
                                track={false} color="secondary" size="small"
                            />
                        </div>
                        <div style={{flex: 1}}>
                            <label style={{fontSize: '0.8rem'}}>Rotate Chaos:</label>
                            <Slider
                                value={settings.wobblyRotation}
                                onChange={(e, v) => updateSetting("wobblyRotation", v)}
                                min={0} max={0.2} step={0.01}
                                track={false} color="secondary" size="small"
                            />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="color-pickers-container">
              <div className="color-picker-item">
                <label>Fill Color:</label>
                <ColorPicker
                  color={settings.fillColor}
                  onChange={(color) => updateSetting("fillColor", color.hexa)}
                />
              </div>
              <div className="color-picker-item2">
                <label>Inner Stroke:</label>
                <ColorPicker
                  color={settings.strokeColor}
                  onChange={(color) => updateSetting("strokeColor", color.hexa)}
                />
              </div>
              <div className="color-picker-item3">
                <label>Outer Stroke:</label>
                <ColorPicker
                  color={settings.outstrokeColor}
                  onChange={(color) => updateSetting("outstrokeColor", color.hexa)}
                />
              </div>
            </div>
          </div>
          
          <div className="img-loader-container">
            <div className="picker">
              <Picker setCharacter={setCharacter} />
            </div>
            
            <div className="upload-container" style={{ margin: "16px 0", textAlign: "center" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="image-upload"
                style={{ display: "none" }}
              />
              <label htmlFor="image-upload">
                <Button variant="outlined" component="span" color="secondary" size="small">
                  Upload Your Image
                </Button>
              </label>
              {customImageSrc && (
                 <Button 
                   size="small" 
                   color="warning" 
                   onClick={() => setCustomImageSrc(null)}
                   style={{marginLeft: "10px"}}
                 >
                   Reset to Original
                 </Button>
              )}
            </div>
          </div>

          <div className="buttons">
            <Button color="secondary" onClick={copy}>Copy</Button>
            <Button color="secondary" onClick={download}>Download</Button>
          </div>
        </div>

        <div className="footer">
          <Button color="secondary" onClick={() => setInfoOpen(true)}>
            About
          </Button>
        </div>
      </div>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={openCopySnackbar}
        onClose={() => setOpenCopySnackbar(false)}
        message="Copied image to clipboard."
        key="copy"
        autoHideDuration={1500}
      />
    </div>
  );
}

export default App;