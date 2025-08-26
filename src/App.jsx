import YurukaStd from "./fonts/YurukaStd.woff2";
import SSFangTangTi from "./fonts/ShangShouFangTangTi.woff2";
import FanMengShaoNvTi from "./fonts/贩梦少女.woff";
import HeYuanTi from "./fonts/极影毁片和圆.woff";
import YouWangFangYuanTi from "./fonts/攸望方圆体-中.woff";
import "./App.css";
import Canvas from "./components/Canvas";
import characters from "./characters.json";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Snackbar from "@mui/material/Snackbar";
import ColorPicker from "@uiw/react-color-chrome";

import { useState, useEffect } from "react";

import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

import Picker from "./components/Picker";
import Info from "./components/Info";
import getConfiguration from "./utils/config";
import log from "./utils/log";
import { preloadFont } from "./utils/preload";

const { ClipboardItem } = window;
const fontList = [
  { name: "YurukaStd", path: YurukaStd },
  { name: "SSFangTangTi", path: SSFangTangTi },
  { name: "FanMengShaoNvTi", path: FanMengShaoNvTi },
  { name: "HeYuanTi", path: HeYuanTi },
  { name: "YouWangFangYuanTi", path: YouWangFangYuanTi },
];


function App() {
  const [config, setConfig] = useState(null);

  // using this to trigger the useEffect because lazy to think of a better way
  const [rand, setRand] = useState(0);
  useEffect(() => {
    async function doGetConfiguration() {
      try {
        const res = await getConfiguration();
        setConfig(res);
      } catch (error) {
        console.log(error);
      }
    }
    doGetConfiguration();
  }, [rand]);

  useEffect(() => {
    async function doPreloadFont() {
      const controller = new AbortController();
      try {
        await preloadFont("SSFangTangTi", SSFangTangTi, controller.signal);
      } catch (error) {
        console.error(error);
      } finally {
        return () => {
          controller.abort();
        };
      }
    }
    doPreloadFont();
  }, []);

  const [infoOpen, setInfoOpen] = useState(false);
  const handleClickOpen = () => {
    setInfoOpen(true);
  };
  const handleClose = () => {
    setInfoOpen(false);
  };

  const [openCopySnackbar, setOpenCopySnackbar] = useState(false);
  const handleSnackClose = (e, r) => {
    setOpenCopySnackbar(false);
  };

  const [character, setCharacter] = useState(18);
  const [text, setText] = useState(characters[character].defaultText.text);
  const [position, setPosition] = useState({
    x: characters[character].defaultText.x,
    y: characters[character].defaultText.y,
  });
  const [fontSize, setFontSize] = useState(characters[character].defaultText.s);
  const [spaceSize, setSpaceSize] = useState(50);
  const [rotate, setRotate] = useState(characters[character].defaultText.r);
  const [letterSpacing, setLetterSpacing] = useState(0);


  const [fillColor, setFillcolor] = useState(characters[character].fillColor);
  const [strokeColor, setStrokecolor] = useState(characters[character].strokeColor);
  const [outstrokeColor, setOutStrokecolor] = useState(characters[character].outstrokeColor);
  const [colorStrokeSize, setColorStrokeSize] = useState(5);
  const [whiteStrokeSize, setWhiteStrokeSize] = useState(10);

  const [vertical_bool, setVertical] = useState(characters[character].vertical);
  const [textOnTop, setTextOnTop] = useState(true);
  const [font, setFont] = useState("YurukaStd");

  const [curve, setCurve] = useState(false);
  const [curvefactor, setCurveFactor] = useState(15);
  const [loaded, setLoaded] = useState(false);
  const img = new Image();
  // const [uploadedImage, setUploadedImage] = useState(null);
  // const [useUploadedImage, setUseUploadedImage] = useState(false);

  // const handleImageUpload = (event) => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setUploadedImage(reader.result);
  //       setUseUploadedImage(true); // 开启使用上传图片的模式
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  useEffect(() => {

    async function doPreloadFonts() {
      for (const f of fontList) {
        try {
          await preloadFont(f.name, f.path);
        } catch (error) {
          console.error(`Failed to preload font: ${f.name}`, error);
        }
      }
    }
    // setUseUploadedImage(false);
    
    doPreloadFonts();
    setText(characters[character].defaultText.text);
    setPosition({
      x: characters[character].defaultText.x,
      y: characters[character].defaultText.y,
    });
    setRotate(characters[character].defaultText.r);
    setSpaceSize(50);
    setFontSize(characters[character].defaultText.s);
    setVertical(characters[character].vertical);
    setOutStrokecolor(characters[character].outstrokeColor);
    setStrokecolor(characters[character].strokeColor);
    setFillcolor(characters[character].fillColor);
    setLoaded(false);

    

  }, [character]);

  img.src = "img/" + characters[character].img;

  img.onload = () => {
    setLoaded(true);
  };

  // 辅助函数：绘制描边和填充文本
  const drawStrokeAndFill = (ctx, char, x, y, pass) => {
    if (pass === 0) {
      ctx.strokeStyle = outstrokeColor;
      ctx.lineWidth = whiteStrokeSize;
      ctx.strokeText(char, x, y);
    } else {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = colorStrokeSize;
      ctx.strokeText(char, x, y);
      ctx.fillText(char, x, y);
    }
  };

  // 横向文本
  const drawHorizontalText = (ctx) => {
    const lines = text.split("\n");
    for (let pass = 0; pass < 2; pass++) {
      let yOffset = 0;
      for (const line of lines) {
        let xOffset = 0;
        for (const char of line) {
          const charWidth = ctx.measureText(char).width + letterSpacing;
          drawStrokeAndFill(ctx, char, xOffset, yOffset, pass);
          xOffset += charWidth;
        }
        yOffset += ((spaceSize - 50) / 50 + 1) * fontSize;
      }
    }
  };

  // 竖向文本
  const drawVerticalText = (ctx) => {
    const lines = text.split("\n");
    for (let pass = 0; pass < 2; pass++) {
      let xOffset = 0;
      for (const line of lines) {
        let yOffset = 0;
        for (const char of line) {
          drawStrokeAndFill(ctx, char, xOffset, yOffset, pass);
          yOffset += fontSize + letterSpacing;
        }
        xOffset += ((spaceSize - 50) / 50 + 1) * fontSize;
      }
    }
  };

  // 横向曲线文本
  const drawCurvedHorizontalText = (ctx) => {
    const lines = text.split("\n");
    for (const line of lines) {
      const lineAngle = (Math.PI * line.length) / curvefactor;
      for (let pass = 0; pass < 2; pass++) {
        ctx.save();
        for (const char of line) {
          ctx.rotate(lineAngle / line.length / (0.3 * curvefactor));
          ctx.save();
          ctx.translate(0, -1 * fontSize * 3.5);
          drawStrokeAndFill(ctx, char, 0, 0, pass);
          ctx.restore();
        }
        ctx.restore();
      }
      ctx.translate(0, ((spaceSize - 50) / 50 + 1) * fontSize);
    }
  };
  

  // 竖向曲线文本
  const drawCurvedVerticalText = (ctx) => {
    const lines = text.split("\n");
    for (let pass = 0; pass < 2; pass++) {
      ctx.save();
      let xOffset = 0;
      for (const line of lines) {
        let yOffset = 0;
        ctx.save();
        ctx.translate(xOffset, 0);
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          const charAngle = (Math.PI / 180) * j * ((curvefactor - 6) * 3);
          ctx.rotate(charAngle);
          drawStrokeAndFill(ctx, char, 0, yOffset, pass);
          yOffset += fontSize + letterSpacing;
        }
        ctx.restore();
        xOffset += ((spaceSize - 50) / 50 + 1) * fontSize;
      }
      ctx.restore();
    }
  };

  // 图绘制
  const drawImage = (ctx) => {
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
  
  // 文本绘制
  const drawText = (ctx) => {
      // 设置通用文本样式
      ctx.font = `${fontSize}px ${font}, SSFangTangTi, YouWangFangYuanTi`;
      ctx.miterLimit = 2.5;
      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.rotate(rotate / 10);
      ctx.textAlign = "center";
      ctx.fillStyle = fillColor;

      // 根据配置调用不同的绘制函数
      if (curve) {
        if (vertical_bool) {
          drawCurvedVerticalText(ctx);
        } else {
          drawCurvedHorizontalText(ctx);
        }
      } else {
        if (vertical_bool) {
          drawVerticalText(ctx);
        } else {
          drawHorizontalText(ctx);
        }
      }
      ctx.restore();
  };


  // 绘制主函数
  const draw = (ctx) => {
      ctx.canvas.width = 296;
      ctx.canvas.height = 256;
      
      
      if (loaded && font) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        if (textOnTop) {
            // 文本在图像之上
            drawImage(ctx);
            drawText(ctx);
        } else {
            // 文本在图像之下
            drawText(ctx);
            drawImage(ctx);
        }
      }
  };


  const download = async () => {
    const canvas = document.getElementsByTagName("canvas")[0];
    const link = document.createElement("a");
    link.download = `${characters[character].name}_stickers.png`;
    link.href = canvas.toDataURL();
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await log(characters[character].id, characters[character].name, "download");
    setRand(rand + 1);
  };

  function b64toBlob(b64Data, contentType = null, sliceSize = null) {
    contentType = contentType || "image/png";
    sliceSize = sliceSize || 512;
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  const copy = async () => {
    const canvas = document.getElementsByTagName("canvas")[0];
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": b64toBlob(canvas.toDataURL().split(",")[1]),
      }),
    ]);
    setOpenCopySnackbar(true);
    await log(characters[character].id, characters[character].name, "copy");
    setRand(rand + 1);
  };

  return (
    <div className="App">
      <Info open={infoOpen} handleClose={handleClose} config={config} />
      <div className="counter">
        Total Stickers you made: {config?.total || "Not available"}
      </div>
      <div className="container">
        <div className="vertical">
          <div className="canvas">
            <Canvas draw={draw} spaceSize={spaceSize} />
          </div>
          <Slider
            value={curve && !vertical_bool ? 256 - position.y + fontSize * 3 : 256 - position.y}
            onChange={(e, v) =>
              setPosition({
                ...position,
                y: curve && !vertical_bool ? 256 + fontSize * 3 - v : 256 - v,
              })
            }
            min={-50}
            max={256}
            step={1}
            orientation="vertical"
            track={false}
            color="secondary"
          />
          
        </div>

        

        <div className="horizontal">
          <Slider
            className="slider-horizontal"
            value={position.x}
            onChange={(e, v) => setPosition({ ...position, x: v })}
            min={0}
            max={296}
            step={1}
            track={false}
            color="secondary"
          />
          
          <div className="text_react">
            <div className="text">
              <TextField
                label="Text"
                size="small"
                color="secondary"
                value={text}
                multiline={true}
                fullWidth
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <FormControl fullWidth>
              <InputLabel id="font-select-label" color="secondary">Font</InputLabel>
              <Select
                labelId="font-select-label"
                value={font}
                label="Font"
                size="small"
                onChange={(e) => setFont(e.target.value)}
                color="secondary"
              >
                {fontList.map((f) => (
                  <MenuItem key={f.name} value={f.name}>
                    {f.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="settings">
            <div className="strokesize">
              <div>
                <label>
                  <nobr>inner Stroke Size: </nobr>
                </label>
                <Slider
                  value={colorStrokeSize}
                  onChange={(e, v) => setColorStrokeSize(v)}
                  min={0}
                  max={25}
                  step={1}
                  track={false}
                  color="secondary"
                />
              </div>

              <div>
                <label>
                  <nobr>Outer Stroke Size: </nobr>
                </label>
                <Slider
                  value={whiteStrokeSize}
                  onChange={(e, v) => setWhiteStrokeSize(v)}
                  min={0}
                  max={35}
                  step={1}
                  track={false}
                  color="secondary"
                />
              </div>
            </div>

            <div className="normal">
              <div>
                <label>Rotate: </label>
                <Slider
                  value={rotate}
                  onChange={(e, v) => setRotate(v)}
                  min={-16}
                  max={16}
                  step={0.1}
                  track={false}
                  color="secondary"
                />
              </div>
              <div>
                <label>
                  <nobr>Font Size: </nobr>
                </label>
                <Slider
                  value={fontSize}
                  onChange={(e, v) => setFontSize(v)}
                  min={5}
                  max={100}
                  step={1}
                  track={false}
                  color="secondary"
                />
              </div>
              <div>
                <label>Vertical:</label>
                <Switch
                  checked={vertical_bool}
                  onChange={(e) => setVertical(e.target.checked)}
                  color="secondary"
                />
              </div>

              <div>
                <label>TopText:</label>
                <Switch
                  checked={textOnTop}
                  onChange={(e) => setTextOnTop(e.target.checked)}
                  color="secondary"
                />
              </div>

            </div>
            <div className="linesetting">
              <div>
                <label>
                  <nobr>LineSpacing: </nobr>
                </label>
                <Slider
                  value={spaceSize}
                  onChange={(e, v) => setSpaceSize(v)}
                  min={0}
                  max={100}
                  step={1}
                  track={false}
                  color="secondary"
                />
              </div>
              <div>
                <label>
                  <nobr>LetterSpacing: </nobr>
                </label>
                <Slider
                  value={letterSpacing}
                  onChange={(e, v) => setLetterSpacing(v)}
                  min={-20}
                  max={50}
                  step={1}
                  track={false}
                  color="secondary"
                />
              </div>
              <div>
                <label>Curve (Beta): </label>
                <Switch
                  checked={curve}
                  onChange={(e) => setCurve(e.target.checked)}
                  color="secondary"
                />
              </div>
              <div>
                <label>
                  <nobr>Curve Factor: </nobr>
                </label>
                <Slider
                  value={curvefactor}
                  onChange={(e, v) => setCurveFactor(v)}
                  min={3}
                  max={10}
                  step={0.1}
                  track={false}
                  color="secondary"
                />
              </div>

            </div>
            
            <div className="color-pickers-container">
              <div className="color-picker-item">
                <label>Fill Color:</label>
                <ColorPicker
                  color={fillColor}
                  onChange={(color) => setFillcolor(color.hexa)}
                />
              </div>
              <div className="color-picker-item2">
                <label>Inner Stroke Color:</label>
                <ColorPicker
                  color={strokeColor}
                  onChange={(color) => setStrokecolor(color.hexa)}
                />
              </div>
              <div className="color-picker-item3">
                <label>Outer Stroke Color:</label>
                <ColorPicker
                  color={outstrokeColor}
                  onChange={(color) => setOutStrokecolor(color.hexa)}
                />
              </div>
            </div>

          </div>
          
          <div className="img-loader-container">

            <div className="picker">
              <Picker setCharacter={setCharacter} />
            </div>
            {/* <div className="upload-container" style={{ margin: "16px 0" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="image-upload"
                style={{ display: "none" }}
              />
              <label htmlFor="image-upload">
                <Button variant="outlined" component="span" color="secondary">
                  Upload Image
                </Button>
              </label>
            </div> */}

          </div>

          <div className="buttons">
            <Button color="secondary" onClick={copy}>
              copy
            </Button>
            <Button color="secondary" onClick={download}>
              download
            </Button>
          </div>
        </div>
        <div className="footer">
          <Button color="secondary" onClick={handleClickOpen}>
            About
          </Button>
        </div>
      </div>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={openCopySnackbar}
        onClose={handleSnackClose}
        message="Copied image to clipboard."
        key="copy"
        autoHideDuration={1500}
      />
    </div>
  );
}

export default App;
