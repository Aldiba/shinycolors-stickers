import { useRef, useEffect } from "react";

const Canvas = (props) => {
  const { draw, spaceSize, ...rest } = props;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    draw(context);
  }, [draw]);

  return <canvas ref={canvasRef} {...rest} />;
};

export default Canvas;
