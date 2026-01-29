import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useDeferredValue,
} from "react";

// --- 资源导入 ---
import YurukaStd from "./fonts/YurukaStd.woff2";
import SSFangTang from "./fonts/ShangShouFangTangTi.woff2";
import YWFangYuan from "./fonts/攸望方圆体-中.woff2";

import "./App.css";

// --- 组件导入 ---
import Canvas from "./components/Canvas";
import Picker from "./components/Picker";
import Info from "./components/Info";
import SettingSlider from "./components/SettingSlider";
import ColorPicker from "@uiw/react-color-chrome";

// --- 数据与工具导入 ---
import charactersData from "./characters.json";
import getConfiguration from "./utils/config";
import log from "./utils/log";
import { preloadFont } from "./utils/preload";
import locales from "./locales";
import { renderCanvas, CANVAS_CONSTANTS } from "./utils/drawLogic";

// --- 类型定义 ---
declare global {
  interface ClipboardItem {
    readonly types: string[];
    getType(type: string): Promise<Blob>;
  }
  var ClipboardItem: {
    prototype: ClipboardItem;
    new (items: Record<string, Blob | Promise<Blob>>): ClipboardItem;
  };
}

// --- 贴纸设置接口 ---
export interface StickerSettings {
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

// --- 角色数据接口 ---
interface CharacterData {
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
  };
  vertical: boolean;
  fillColor: string;
  strokeColor: string;
  outstrokeColor: string;
}

// --- 强制转换 JSON 数据类型 ---
const characters = charactersData as CharacterData[];

// --- 字体列表 ---
const fontList = [
  { name: "YurukaStd", path: YurukaStd },
  { name: "SSFangTang", path: SSFangTang },
  { name: "YWFangYuan", path: YWFangYuan },
];

// --- 辅助函数---
function b64toBlob(b64Data: string, contentType = "image/png", sliceSize = 512): Blob {
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

function App() {
  // --- 本地化状态 ---
  const [lang, setLang] = useState<string>("zh");
  const t = (key: string) => locales[lang]?.[key] || key;

  const handleLangChange = (_: any, newLang: string) => {
    if (newLang !== null) setLang(newLang);
  };

  // --- 全局配置与UI状态 ---
  const [config, setConfig] = useState<any>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [openCopySnackbar, setOpenCopySnackbar] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showColors, setShowColors] = useState(false); 

  // --- 绘图 ---
  const [character, setCharacter] = useState<number>(18); 
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000));

  const [forceRedraw, setForceRedraw] = useState(0);

  // --- 初始状态---
  const [settings, setSettings] = useState<StickerSettings>({
    text: "",
    x: 0,
    y: 0,
    s: 50,
    ls: 0,
    r: 0,
    lineSpacing: 50,
    fillColor: "#ffffff",
    strokeColor: "#000000",
    outstrokeColor: "#ffffff",
    colorStrokeSize: 5,
    whiteStrokeSize: 12,
    vertical: false,
    textOnTop: true,
    font: "YurukaStd",
    curve: false,
    curveFactor: 6,
    wobbly: false,
    wobblyScale: 0.3,
    wobblyRotation: 0.3,
  });

  const deferredSettings = useDeferredValue(settings);
  const deferredSeed = useDeferredValue(seed);

  // --- Refs ---
  const isDragging = useRef<boolean>(false);
  const lastPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

 // --- 初始化：配置与字体加载 ---
  useEffect(() => {
    getConfiguration().then(setConfig).catch(console.error);
    const controller = new AbortController();

    const loadFonts = async () => {
      const criticalFonts = fontList.slice(0, 2);
      const optionalFonts = fontList.slice(2);

      const criticalPromises = criticalFonts.map((f) =>
        preloadFont(f.name, f.path, controller.signal).catch((err) => {
          if (err.name === "AbortError") {
            throw err;
          }
          console.error(`Failed to load critical font ${f.name}`, err);
        })
      );

      optionalFonts.forEach((f) => {
        preloadFont(f.name, f.path, controller.signal).catch((err) => {
          if (err.name !== "AbortError") {
            console.error(`Failed to load optional font ${f.name}`, err);
          }
        });
      });

      try {
        await Promise.all(criticalPromises);
        
        // 等待前2字体加载
        await document.fonts.ready;
        await Promise.all([
            document.fonts.load(`50px YurukaStd`),
            document.fonts.load(`50px SSFangTang`), 
        ]);

        console.log("Critical fonts loaded!");
        
        // 解锁界面
        setFontsLoaded(true);

        // 延迟 100ms 再次刷新
        setTimeout(() => {
          console.log("Triggering safety redraw...");
          setForceRedraw((n) => n + 1);
        }, 100);

      } catch (err) {
        console.error("Font loading error:", err);
        setFontsLoaded(true);
      }
    };

    loadFonts();
    return () => controller.abort();
  }, []);

  // --- Toast 自动关闭 ---
  useEffect(() => {
    if (openCopySnackbar) {
      const timer = setTimeout(() => setOpenCopySnackbar(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [openCopySnackbar]);

  // --- 切换角色逻辑 ---
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
    const src = customImageSrc || "img/" + characters[character].img;
    img.src = src;
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      setLoadedImage(img);
    };

    return () => {
      img.onload = null;
    };
  }, [character, customImageSrc]);

  // --- 通用设置更新函数 ---
  // 使用泛型 K 确保 key 和 value 类型匹配
  const updateSetting = <K extends keyof StickerSettings>(key: K, value: StickerSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePositionChange = (key: 'x' | 'y', value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const generateNewSeed = () => {
    setSeed(Math.floor(Math.random() * 10000));
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setSeed(val);
    } else if (e.target.value === "") {
      setSeed(0);
    }
  };

  // --- 拖拽逻辑 ---
  const handlePointerDown = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    isDragging.current = true;
    let clientX, clientY;
    
    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }
    
    lastPos.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isDragging.current) return;
    // 阻止触摸滚屏
    if (e.cancelable && e.type === "touchmove") e.preventDefault();

    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;

    setSettings((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    lastPos.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // --- 绘图回调刷新 ---
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!loadedImage) return;

      renderCanvas(ctx, loadedImage, deferredSettings, deferredSeed);
    },
    [loadedImage, deferredSettings, deferredSeed, fontsLoaded, forceRedraw]
  );

  // --- 下载与复制 ---
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
    setConfig((prev: any) => (prev ? { ...prev, total: prev.total + 1 } : null));
  };

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
      setConfig((prev: any) => (prev ? { ...prev, total: prev.total + 1 } : null));
    } catch (err) {
      console.error("Copy failed", err);
      alert(t("copy_failed"));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
            setCustomImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isReady = loadedImage && fontsLoaded;

  return (
    <div className="App">
      <Info
        open={infoOpen}
        handleClose={() => setInfoOpen(false)}
        config={config}
        lang={lang}
        t={t}
      />

      {/* 语言切换栏 */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-base-200/40 backdrop-blur p-2 rounded-lg shadow-sm z-10 opacity-90 hover:opacity-100 transition-opacity">
        <span className="text-sm text-gray-600 font-yuruka">
        </span>
        <div className="join">
          {["zh", "ja", "en"].map((l) => (
            <input
              key={l}
              className="join-item btn btn-sm btn-outline btn-secondary font-yuruka"
              type="radio"
              aria-label={l === "zh" ? "中" : l === "ja" ? "日" : "En"}
              checked={lang === l}
              onChange={() => handleLangChange(null, l)}
            />
          ))}
        </div>
      </div>

      <div className="container font-yuruka">
        {/* ======================================================== */}
        {/* === 顶部 === */}
        {/* ======================================================== */}
        <div className="flex md:flex-row justify-between items-center gap-4 bg-base-200 p-2 rounded-box shadow-md mb-0">
          <div className="flex-1 w-full md:w-auto flex justify-center md:justify-start">
            <Picker setCharacter={setCharacter} t={t} />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              id="image-upload"
              className="hidden"
            />
            <label htmlFor="image-upload">
              <span className="btn btn-outline btn-secondary btn-m">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                {t("upload_your_image")}
              </span>
            </label>
            {customImageSrc && (
              <button
                className="btn btn-warning btn-sm"
                onClick={() => setCustomImageSrc(null)}
                title={t("reset_to_original")}
              >
                ↺ {t("reset_to_original")}
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* === 画布 === */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-center items-center gap-2 bg-base-200 p-4 rounded-box shadow-md mb-0 mt-0">
          <div className="flex flex-row justify-center gap-0 w-full">
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative shadow-xl rounded-box overflow-hidden bg-base-100 border border-base-300"
                style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                {/* Canvas */}
                <div className="canvas">
                  <Canvas draw={draw} spaceSize={settings.lineSpacing} />
                </div>

                {/* 加载遮罩 */}
                {!isReady && (
                   <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-base-100/30 backdrop-blur-[2px] transition-opacity duration-500 rounded-box">
                    
                    {/* Loading */}
                    <div className="bg-base-100/80 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 border border-white/20">
                      <span className="loading loading-spinner loading-md text-secondary"></span>
                      <span className="text-xs font-bold text-secondary tracking-wider animate-pulse uppercase">
                        {t("loading_assets")}
                      </span>
                    </div>
                    <div className="mt-2 px-2 py-0.5 rounded-full bg-black/10 text-[10px] text-white font-medium">
                       {!fontsLoaded ? "Syncing Fonts..." : "Rendering Canvas..."}
                    </div>
                  </div>
                )}
              </div>
              
              {/* X轴滑块 */}
              <input
                type="range"
                min={0}
                max={CANVAS_CONSTANTS.CANVAS_WIDTH}
                value={settings.x}
                onChange={(e) => handlePositionChange("x", Number(e.target.value))}
                className="range range-secondary range-sm w-full"
              />
            </div>

            {/* Y轴滑块与开关 */}
            <div className="flex flex-row items-center">
              <div className="flex flex-col w-10 items-center">
                <input
                  type="range"
                  min={-50}
                  max={CANVAS_CONSTANTS.CANVAS_HEIGHT}
                  value={
                    settings.curve && !settings.vertical
                      ? CANVAS_CONSTANTS.CANVAS_HEIGHT - settings.y + settings.s * 3
                      : CANVAS_CONSTANTS.CANVAS_HEIGHT - settings.y
                  }
                  onChange={(e) =>
                    handlePositionChange(
                      "y",
                      settings.curve && !settings.vertical
                        ? CANVAS_CONSTANTS.CANVAS_HEIGHT + settings.s * 3 - Number(e.target.value)
                        : CANVAS_CONSTANTS.CANVAS_HEIGHT - Number(e.target.value),
                    )
                  }
                  className="range range-secondary range-sm w-60 -rotate-90"
                />
              </div>
              <div className="flex flex-col gap-10">
                {/* 竖排 */}
                <div className="flex flex-col items-center">
                  <span className="text-s font-bold text-gray-600 mb-1 whitespace-nowrap scale-90">
                    {t("vertical")}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary toggle-sm"
                    checked={settings.vertical}
                    onChange={(e) => updateSetting("vertical", e.target.checked)}
                  />
                </div>
                {/* 置顶 */}
                <div className="flex flex-col items-center">
                  <span className="text-s font-bold text-gray-600 mb-1 whitespace-nowrap scale-90">
                    {t("text_on_top")}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary toggle-sm"
                    checked={settings.textOnTop}
                    onChange={(e) => updateSetting("textOnTop", e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* === 控制面板区域 (Control Panel) === */}
        {/* ======================================================== */}
        <div className="w-full max-w-230 flex flex-col gap-2 mt-0">
          
          {/* --- 第一行：文本输入 + 字体选择 + 切换开关 --- */}
          <div className="flex sm:flex-row flex-col gap-2 w-full items-center mb-4">
            {/* 1. 文本输入框 */}
            <div className="grow">
              <textarea
                className="textarea textarea-secondary w-full textarea-m leading-snug py-2"
                placeholder={t("text")}
                value={settings.text}
                onChange={(e) => updateSetting("text", e.target.value)}
                rows={1} 
                style={{ minHeight: "2rem" }} 
              ></textarea>
            </div>

            {/* 2. 字体选择*/}
            <div className="sm:w-auto min-w-[120px]">
              <select
                className="select select-secondary select-sm w-full"
                value={settings.font}
                onChange={(e) => updateSetting("font", e.target.value)}
              >
                {fontList.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. A/B 组切换开关 */}
            <div className="join shadow-sm shrink-0">
              <button
                className={`join-item btn btn-sm ${!showColors ? "btn-secondary" : "btn-outline btn-secondary"}`}
                onClick={() => setShowColors(false)}
              >
                {/* 文本按钮 */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
                </svg>
                {t("tab_settings")}
              </button>
              <button
                className={`join-item btn btn-sm ${showColors ? "btn-secondary" : "btn-outline btn-secondary"}`}
                onClick={() => setShowColors(true)}
              >
                {/* 颜色按钮 */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                  <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.414a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.606a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM15.657 14.606a.75.75 0 01-1.06 1.06l-1.061-1.06a.75.75 0 011.06-1.06l1.06 1.06zM6.464 5.414a.75.75 0 01-1.06-1.06l-1.06 1.06a.75.75 0 011.06 1.06l1.06-1.06z" clipRule="evenodd" />
                </svg>
                {t("tab_colors")}
              </button>
            </div>
          </div>

          {/* --- 第二行：A组 或 B组 --- */}
          <div className="w-full font-yuruka bg-base-100/50 rounded-lg">
            
            {/* === A组：排版=== */}
            {!showColors && (
              <div className="flex flex-col gap-4 w-full animate-fade-in"> 
                {/* 第一排：描边 */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                  <SettingSlider
                    label={t("inner_stroke")}
                    value={settings.colorStrokeSize}
                    min={0}
                    max={25}
                    onChange={(val) => updateSetting("colorStrokeSize", val)}
                  />
                  <SettingSlider
                    label={t("outer_stroke")}
                    value={settings.whiteStrokeSize}
                    min={0}
                    max={35}
                    onChange={(val) => updateSetting("whiteStrokeSize", val)}
                  />
                </div>

                {/* 第二排：旋转、大小 */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                  <SettingSlider
                    label={t("rotate")}
                    value={settings.r}
                    min={-16}
                    max={16}
                    step={0.1}
                    onChange={(val) => updateSetting("r", val)}
                  />
                  <SettingSlider
                    label={t("font_size")}
                    value={settings.s}
                    min={5}
                    max={100}
                    onChange={(val) => updateSetting("s", val)}
                  />
                </div>

                {/* 第三排：间距 */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                  <SettingSlider
                    label={t("line_spacing")}
                    value={settings.lineSpacing}
                    min={0}
                    max={100}
                    onChange={(val) => updateSetting("lineSpacing", val)}
                  />
                  <SettingSlider
                    label={t("letter_spacing")}
                    value={settings.ls}
                    min={-20}
                    max={50}
                    onChange={(val) => updateSetting("ls", val)}
                  />
                </div>

                {/* 第四排：曲线、随机 */}
                <div className="flex flex-col sm:flex-row gap-4 w-full mt-1">
                  {/* 曲线 */}
                  <div className="flex-1 border border-base-200 rounded-lg p-2 flex flex-col gap-1 bg-base-100">
                    <div className="flex justify-between items-center h-6">
                      <span className="font-bold text-xs">{t("curve")}</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-secondary toggle-xs"
                        checked={settings.curve}
                        onChange={(e) => updateSetting("curve", e.target.checked)}
                      />
                    </div>
                    {settings.curve && (
                      <SettingSlider
                        label={t("curve_factor")}
                        value={settings.curveFactor}
                        min={3}
                        max={10}
                        step={0.1}
                        onChange={(val) => updateSetting("curveFactor", val)}
                      />
                    )}
                  </div>

                  {/* 随机 */}
                  <div className="flex-1 border border-base-200 rounded-lg p-2 flex flex-col gap-1 bg-base-100">
                    <div className="flex justify-between items-center h-6">
                      <span className="font-bold text-xs">{t("wobbly")}</span>
                      <div className="flex items-center gap-2">
                         {settings.wobbly && (
                          <div className="flex gap-1 items-center">
                            <input
                              type="text"
                              className="input input-bordered input-xs w-12 text-center px-0 no-spinner"
                              value={seed}
                              onChange={handleSeedChange}
                            />
                            <button
                              className="btn btn-ghost btn-xs px-0 min-h-0 h-6 w-6"
                              onClick={generateNewSeed}
                              title={t("new_seed")}
                            >
                              🎲
                            </button>
                          </div>
                        )}
                        <input
                          type="checkbox"
                          className="toggle toggle-secondary toggle-xs"
                          checked={settings.wobbly}
                          onChange={(e) => updateSetting("wobbly", e.target.checked)}
                        />
                      </div>
                    </div>
                    {settings.wobbly && (
                      <div className="flex gap-2 w-full">
                        <SettingSlider
                          label={t("scale_chaos")}
                          value={settings.wobblyScale}
                          min={0}
                          max={1}
                          step={0.01}
                          onChange={(val) => updateSetting("wobblyScale", val)}
                        />
                        <SettingSlider
                          label={t("rotate_chaos")}
                          value={settings.wobblyRotation}
                          min={0}
                          max={1}
                          step={0.01}
                          onChange={(val) => updateSetting("wobblyRotation", val)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* === B组：颜色=== */}
            {showColors && (
              <div className="flex flex-wrap justify-center gap-0 p-2 w-full animate-fade-in">
                {[
                  { label: t("fill_color"), key: "fillColor" },
                  { label: t("inner_stroke_color"), key: "strokeColor" },
                  { label: t("outer_stroke_color"), key: "outstrokeColor" },
                ].map((item) => (
                  <div key={item.key} className="flex flex-col items-center gap-1 w-full sm:w-auto">
                    <label className="text-xs font-bold text-gray-500">{item.label}</label>
                    <ColorPicker
                      color={settings[item.key as keyof StickerSettings] as string}
                      style={{
                        background: "var(--color-base-100)",
                        borderRadius: "0.5rem",
                        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                        width: "100%", // 手机上自适应宽度
                        maxWidth: "250px"
                      }}
                      onChange={(color) => updateSetting(item.key as keyof StickerSettings, color.hexa)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部*/}
          <div className="w-full flex flex-wrap justify-center gap-4 mt-2">
            <button className="btn btn-secondary btn-1 w-40" onClick={copy}>
              {t("copy")}
            </button>
            <button className="btn btn-secondary btn-l w-40" onClick={download}>
              {t("download")}
            </button>
          </div>
        </div>
        </div>
      
      {/* 页脚 */}
      <div className="w-full text-center py-6 mt-4">
        <button 
          className="btn btn-link btn-xs text-gray-400 no-underline hover:text-secondary"
          onClick={() => setInfoOpen(true)}
        >
          Info / Credits
        </button>
      </div>

      {/* Toast 提示 */}
      {openCopySnackbar && (
        <div className="toast toast-center toast-bottom z-50">
          <div className="alert alert-success text-white">
            <span>{t("copied_to_clipboard")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;