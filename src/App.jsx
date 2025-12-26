import React, { useState, useEffect, useRef, useCallback, useDeferredValue } from "react";

// 字体引入
import YurukaStd from "./fonts/YurukaStd.woff2";
import SSFangTangTi from "./fonts/ShangShouFangTangTi.woff2";
import YouWangFangYuanTi from "./fonts/攸望方圆体-中.woff2";

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

// 新增：引入 ToggleButton 用于语言切换
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

// 工具类与本地化
import getConfiguration from "./utils/config";
import log from "./utils/log";
import { preloadFont } from "./utils/preload";
import locales from "./locales"; // 引入本地化文件

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
  { name: "YurukaStd", path: YurukaStd },
  { name: "SSFangTangTi", path: SSFangTangTi },
  { name: "YouWangFangYuanTi", path: YouWangFangYuanTi },
];

function App() {
  // --- 本地化状态 ---
  const [lang, setLang] = useState("zh"); // 默认为中文
  // 辅助函数：获取当前语言的文本
  const t = (key) => {
    return locales[lang][key] || key;
  };

  const handleLangChange = (event, newLang) => {
    if (newLang !== null) {
      setLang(newLang);
    }
  };

  // --- 全局配置与UI状态 ---
  const [config, setConfig] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [openCopySnackbar, setOpenCopySnackbar] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // --- 核心绘图状态 ---
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

  // --- 初始化与字体预加载 ---
  useEffect(() => {
    getConfiguration().then(setConfig).catch(console.error);
    const controller = new AbortController();
    
    const loadFonts = async () => {
      const criticalFonts = fontList.slice(0, 2);
      const optionalFonts = fontList.slice(2);

      const criticalPromises = criticalFonts.map(f => 
        preloadFont(f.name, f.path, controller.signal)
          .catch(err => console.error(`Failed to load critical font ${f.name}`, err))
      );

      optionalFonts.forEach(f => {
        preloadFont(f.name, f.path, controller.signal)
          .catch(err => console.error(`Failed to load optional font ${f.name}`, err));
      });

      await Promise.all(criticalPromises);
      console.log("Critical fonts loaded! UI Unlocked.");
      setFontsLoaded(true);
    };

    loadFonts();
    return () => controller.abort();
  }, []);

  // --- 逻辑部分 (保持不变) ---
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
        wobbly, wobblyScale, wobblyRotation 
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

      const drawEffectiveChar = (char, dx, dy, pass, index) => {
        if (wobbly) {
          const pseudoRandom = Math.sin(currentSeed + index * 12.34); 
          const scale = 1 + (pseudoRandom * wobblyScale); 
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
      alert(t("copy_failed"));
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
    <div className="App"
    // style={{ 
    //   fontFamily: '"YurukaStd", "SSFangTangTi", "YouWangFangYuanTi", sans-serif' 
    // }}
    >
      <Info open={infoOpen} handleClose={() => setInfoOpen(false)} config={config} lang={lang} t={t} />
      
      {/* 语言切换栏 (替代原来的计数器) */}
      <div className="counter" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.9rem', color: '#666' }}>{t("language")}:</span>
        <ToggleButtonGroup
          value={lang}
          exclusive
          onChange={handleLangChange}
          size="small"
          color="secondary"
          sx={{ height: '30px' }}
        >
          <ToggleButton value="zh" sx={{ fontSize: '0.8rem', padding: '5px 10px' }}>中</ToggleButton>
          <ToggleButton value="ja" sx={{ fontSize: '0.8rem', padding: '5px 10px' }}>日</ToggleButton>
          <ToggleButton value="en" sx={{ fontSize: '0.8rem', padding: '5px 10px' }}>En</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className="container">
        <div className="vertical" style={{ 
            display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '16px' 
        }}>
          <div style={{ width: '50px', flexShrink: 0 }}></div>

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
                <span style={{ fontSize: '0.8rem', color: '#666' }}>{t("loading_assets")}</span>
              </Box>
            )}
          </div>
          
          <div className="vertical-controls" style={{
              display: 'flex', flexDirection: 'row', height: '256px', alignItems: 'center',
              width: '80px', flexShrink: 0
          }}>
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
                style={{ height: '100%' }} 
            />
            
            <div style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-around', 
                height: '80%', flex: 1 
            }}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#555', marginBottom: '4px', whiteSpace: 'nowrap', transform: 'scale(0.9)'}}>
                        {t("vertical")}
                    </span>
                    <Switch
                        checked={settings.vertical}
                        onChange={(e) => updateSetting("vertical", e.target.checked)}
                        color="secondary"
                        style={{ margin: '0px' }}
                    />
                </div>

                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <span style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#555', marginBottom: '4px', whiteSpace: 'nowrap', transform: 'scale(0.9)'}}>
                        {t("text_on_top")}
                    </span>
                    <Switch
                        checked={settings.textOnTop}
                        onChange={(e) => updateSetting("textOnTop", e.target.checked)}
                        color="secondary"
                        style={{ margin: '0px' }}
                    />
                </div>
            </div>
          </div>
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
                label={t("text")} size="small" color="secondary"
                value={settings.text}
                multiline fullWidth
                onChange={(e) => updateSetting("text", e.target.value)}
              />
            </div>

            <FormControl fullWidth>
              <InputLabel id="font-select-label" color="secondary">{t("font")}</InputLabel>
              <Select
                labelId="font-select-label"
                value={settings.font}
                label={t("font")} size="small" color="secondary"
                onChange={(e) => updateSetting("font", e.target.value)}
              >
                {fontList.map((f) => (
                  <MenuItem key={f.name} value={f.name}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="settings" style = {{fontFamily: "YurukaStd, SSFangTangTi, YouWangFangYuanTi, sans-serif"}}>
            
            <div className="strokesize" style={{ display: 'flex', gap: '20px', width: '100%' ,fontFamily: "YurukaStd, SSFangTangTi, YouWangFangYuanTi, sans-serif"}}>
              <div style={{ flex: 1 }}>
                <label><nobr>{t("inner_stroke")}: </nobr></label>
                <Slider
                  value={settings.colorStrokeSize}
                  onChange={(e, v) => updateSetting("colorStrokeSize", v)}
                  min={0} max={25} step={1}
                  track={false} color="secondary"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label><nobr>{t("outer_stroke")}: </nobr></label>
                <Slider
                  value={settings.whiteStrokeSize}
                  onChange={(e, v) => updateSetting("whiteStrokeSize", v)}
                  min={0} max={35} step={1}
                  track={false} color="secondary"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="normal" style={{ display: 'flex', gap: '20px', width: '100%' ,fontFamily: "YurukaStd, SSFangTangTi, YouWangFangYuanTi, sans-serif"}}>
              <div style={{ flex: 1 }}>
                <label>{t("rotate")}:</label>
                <Slider
                  value={settings.r}
                  onChange={(e, v) => updateSetting("r", v)}
                  min={-16} max={16} step={0.1}
                  track={false} color="secondary"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1}} >
                <label><nobr>{t("font_size")}:</nobr></label>
                <Slider
                  value={settings.s}
                  onChange={(e, v) => updateSetting("s", v)}
                  min={5} max={100} step={1}
                  track={false} color="secondary"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="linesetting" style={{ display: 'flex', gap: '20px', width: '100%' ,fontFamily: "YurukaStd, SSFangTangTi, YouWangFangYuanTi, sans-serif"}}>
              <div style={{ flex: 1 }}>
                <label><nobr>{t("line_spacing")}: </nobr></label>
                <Slider
                  value={settings.lineSpacing}
                  onChange={(e, v) => updateSetting("lineSpacing", v)}
                  min={0} max={100} step={1}
                  track={false} color="secondary"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label><nobr>{t("letter_spacing")}: </nobr></label>
                <Slider
                  value={settings.ls}
                  onChange={(e, v) => updateSetting("ls", v)}
                  min={-20} max={50} step={1}
                  track={false} color="secondary"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="effects-row" style={{ display: 'flex', gap: '10px', margin: '10px 0', width: '100%' ,fontFamily: "YurukaStd, SSFangTangTi, YouWangFangYuanTi, sans-serif"}}>
                <div style={{ flex: 1, border: '1px solid #eee', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{t("curve")}</label>
                        <Switch
                            checked={settings.curve}
                            onChange={(e) => updateSetting("curve", e.target.checked)}
                            color="secondary"
                            size="small"
                        />
                    </div>
                    {settings.curve && (
                        <div>
                            <label style={{ fontSize: '0.75rem' }}>{t("curve_factor")}:</label>
                            <Slider
                                value={settings.curveFactor}
                                onChange={(e, v) => updateSetting("curveFactor", v)}
                                min={3} max={10} step={0.1}
                                track={false} color="secondary" size="small"
                                style={{ width: '100%' }}
                            />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, border: '1px solid #eee', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{t("wobbly")}</label>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            {settings.wobbly && (
                                <div style={{display:'flex', alignItems:'center', marginRight: '5px'}}>
                                    <TextField
                                        label={t("seed")}
                                        variant="standard"
                                        value={seed}
                                        onChange={handleSeedChange}
                                        color="secondary"
                                        inputProps={{style: {padding: 0, fontSize: '0.8rem', width: '40px', textAlign: 'center'}}}
                                        InputLabelProps={{ shrink: true, style: { fontSize: '0.7rem' } }}
                                    />
                                    <Button 
                                        size="small" onClick={generateNewSeed} color="secondary" 
                                        style={{minWidth: '20px', padding: 0, marginLeft: '2px'}}
                                        title={t("new_seed")}
                                    >🎲</Button>
                                </div>
                            )}
                            <Switch
                                checked={settings.wobbly}
                                onChange={(e) => updateSetting("wobbly", e.target.checked)}
                                color="secondary"
                                size="small"
                            />
                        </div>
                    </div>
                    {settings.wobbly && (
                        <div style={{display: 'flex', gap: '5px'}}>
                             <div style={{flex: 1}}>
                                <label style={{ fontSize: '0.75rem' }}>{t("scale_chaos")}:</label>
                                <Slider
                                    value={settings.wobblyScale}
                                    onChange={(e, v) => updateSetting("wobblyScale", v)}
                                    min={0} max={1} step={0.01}
                                    track={false} color="secondary" size="small"
                                    style={{ width: '100%' }}
                                />
                             </div>
                             <div style={{flex: 1}}>
                                <label style={{ fontSize: '0.75rem' }}>{t("rotate_chaos")}:</label>
                                <Slider
                                    value={settings.wobblyRotation}
                                    onChange={(e, v) => updateSetting("wobblyRotation", v)}
                                    min={0} max={1} step={0.01}
                                    track={false} color="secondary" size="small"
                                    style={{ width: '100%' }}
                                />
                             </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="color-pickers-container" style = {{fontFamily: "YurukaStd, SSFangTangTi, YouWangFangYuanTi, sans-serif"}}>
              <div className="color-picker-item">
                <label>{t("fill_color")}:</label>
                <ColorPicker
                  color={settings.fillColor}
                  onChange={(color) => updateSetting("fillColor", color.hexa)}
                />
              </div>
              <div className="color-picker-item2">
                <label>{t("inner_stroke_color")}:</label>
                <ColorPicker
                  color={settings.strokeColor}
                  onChange={(color) => updateSetting("strokeColor", color.hexa)}
                />
              </div>
              <div className="color-picker-item3">
                <label>{t("outer_stroke_color")}:</label>
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
                  {t("upload_your_image")}
                </Button>
              </label>
              {customImageSrc && (
                 <Button 
                   size="small" 
                   color="warning" 
                   onClick={() => setCustomImageSrc(null)}
                   style={{marginLeft: "10px"}}
                 >
                   {t("reset_to_original")}
                 </Button>
              )}
            </div>
          </div>

          <div className="buttons">
            <Button color="secondary" onClick={copy}>{t("copy")}</Button>
            <Button color="secondary" onClick={download}>{t("download")}</Button>
          </div>
        </div>

        <div className="footer">
          <Button color="secondary" onClick={() => setInfoOpen(true)}>
            {t("about")}
          </Button>
        </div>
      </div>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={openCopySnackbar}
        onClose={() => setOpenCopySnackbar(false)}
        message={t("copied_to_clipboard")}
        key="copy"
        autoHideDuration={1500}
      />
    </div>
  );
}

export default App;