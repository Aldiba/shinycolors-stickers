import React, { useState, useEffect, useRef, useCallback, useDeferredValue } from "react";

// 字体引入
import YurukaStd from "./fonts/YurukaStd.woff2";
import SSFangTangTi from "./fonts/ShangShouFangTangTi.woff2";
import YouWangFangYuanTi from "./fonts/攸望方圆体-中.woff";

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
import CircularProgress from "@mui/material/CircularProgress"; // 新增 Loading 组件
import Box from "@mui/material/Box";
import ColorPicker from "@uiw/react-color-chrome";

// 工具类
import getConfiguration from "./utils/config";
import log from "./utils/log";
import { preloadFont } from "./utils/preload";

const { ClipboardItem } = window;

// --- 5. 优化：常量提取 (Constants) ---
const CONSTANTS = {
  CANVAS_WIDTH: 296,
  CANVAS_HEIGHT: 256,
  DEFAULT_FONT_SIZE: 50,
  DEFAULT_LINE_SPACING: 50,
  MITER_LIMIT: 2.5,
  CURVE_OFFSET_FACTOR: 3.5,
};

const fontList = [
  { name: "YurukaStd", path: YurukaStd },
  { name: "SSFangTangTi", path: SSFangTangTi },
  { name: "YouWangFangYuanTi", path: YouWangFangYuanTi },
];

function App() {
  // --- 全局配置与UI状态 ---
  const [config, setConfig] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [openCopySnackbar, setOpenCopySnackbar] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // --- 核心绘图状态 ---
  const [character, setCharacter] = useState(18);
  const [customImageSrc, setCustomImageSrc] = useState(null);
  const [loadedImage, setLoadedImage] = useState(null);

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
  });

  // --- 1. 优化：使用 deferredSettings 进行防抖渲染 ---
  // UI 控件绑定 settings (实时响应)，但 Canvas 绘图绑定 deferredSettings (稍有延迟)
  // 这能极大提升低性能设备上的滑动流畅度
  const deferredSettings = useDeferredValue(settings);

  // --- 拖拽相关的 Refs ---
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // --- 初始化与字体预加载 ---
  useEffect(() => {
    getConfiguration().then(setConfig).catch(console.error);
    const controller = new AbortController();
    
    const loadFonts = async () => {
      const promises = fontList.map(f => 
        preloadFont(f.name, f.path, controller.signal)
          .catch(err => console.error(`Failed to load ${f.name}`, err))
      );
      await Promise.all(promises);
      await document.fonts.ready;
      console.log("All fonts loaded!");
      setFontsLoaded(true);
    };

    loadFonts();
    return () => controller.abort();
  }, []);

  // --- 角色切换逻辑 ---
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

  // --- 2. 优化：拖拽交互逻辑 ---
  const handlePointerDown = (e) => {
    isDragging.current = true;
    // 兼容鼠标和触摸
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastPos.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    
    // 防止触摸移动时触发页面滚动
    if(e.cancelable && e.type === 'touchmove') {
      e.preventDefault(); 
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;

    // 直接更新位置 (注意：这里直接更新 settings 可能会频繁渲染，但 React 18 会自动批处理)
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

  // --- 绘图核心逻辑 (应用了 Deferred Value) ---
  const draw = useCallback((ctx) => {
    if (!loadedImage) return;

    // 使用 deferredSettings 里的值，而不是外部的 settings
    // 这样 UI 变化时，draw 不会立即执行，而是等待 React 闲置
    const currentSettings = deferredSettings;

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
        vertical, curve, curveFactor
      } = currentSettings;
      
      ctx.font = `${s}px ${font}, SSFangTangTi, YouWangFangYuanTi`;
      ctx.miterLimit = CONSTANTS.MITER_LIMIT;
      
      // --- 6. 优化：视觉圆润化 ---
      ctx.lineJoin = "round"; // 防止描边出现尖角
      ctx.lineCap = "round";  // 笔触末端圆润

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

      const lines = text.split("\n");

      if (curve) {
        if (vertical) {
          for (let pass = 0; pass < 2; pass++) {
            ctx.save();
            let xOffset = 0;
            for (const line of lines) {
              let yOffset = 0;
              ctx.save();
              ctx.translate(xOffset, 0);
              for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const charAngle = (Math.PI / 180) * j * ((curveFactor - 6) * 3);
                ctx.rotate(charAngle);
                drawStrokeAndFill(char, 0, yOffset, pass);
                yOffset += s + ls;
              }
              ctx.restore();
              xOffset += ((lineSpacing - 50) / 50 + 1) * s;
            }
            ctx.restore();
          }
        } else {
          let currentY = 0;
          for (const line of lines) {
            const lineAngle = (Math.PI * line.length) / curveFactor;
            for (let pass = 0; pass < 2; pass++) {
              ctx.save();
              ctx.translate(0, currentY);
              for (const char of line) {
                ctx.rotate(lineAngle / line.length / (0.3 * curveFactor));
                ctx.save();
                ctx.translate(0, -1 * s * CONSTANTS.CURVE_OFFSET_FACTOR);
                drawStrokeAndFill(char, 0, 0, pass);
                ctx.restore();
              }
              ctx.restore();
            }
            currentY += ((lineSpacing - 50) / 50 + 1) * s; 
          }
        }
      } else {
        if (vertical) {
          for (let pass = 0; pass < 2; pass++) {
            let xOffset = 0;
            for (const line of lines) {
              let yOffset = 0;
              for (const char of line) {
                drawStrokeAndFill(char, xOffset, yOffset, pass);
                yOffset += s + ls;
              }
              xOffset += ((lineSpacing - 50) / 50 + 1) * s;
            }
          }
        } else {
          for (let pass = 0; pass < 2; pass++) {
            let yOffset = 0;
            for (const line of lines) {
              let xOffset = 0;
              for (const char of line) {
                const charWidth = ctx.measureText(char).width + ls;
                drawStrokeAndFill(char, xOffset, yOffset, pass);
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

  }, [loadedImage, deferredSettings, fontsLoaded]); // 依赖 deferredSettings


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

  // --- 4. 优化：加载状态判断 ---
  const isReady = loadedImage && fontsLoaded;

  return (
    <div className="App">
      <Info open={infoOpen} handleClose={() => setInfoOpen(false)} config={config} />
      
      <div className="counter">
        Total Stickers you made: {config?.total || "..."}
      </div>

      <div className="container">
        <div className="vertical">
          {/* 
              4. 优化：Loading 遮罩层容器 
              2. 优化：绑定拖拽事件
          */}
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

            {/* Loading Overlay */}
            {!isReady && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  flexDirection: 'column',
                  gap: 1
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
                <label>Vertical:</label>
                <Switch
                  checked={settings.vertical}
                  onChange={(e) => updateSetting("vertical", e.target.checked)}
                  color="secondary"
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