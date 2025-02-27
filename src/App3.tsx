import { useEffect, useRef, useState } from "react";
import { longText } from "./constants"; // Assuming longText is imported here

const App3 = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [yPosition, setYPosition] = useState(960); // Start at the bottom of the canvas

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const video = videoRef.current;
    if (!video) return;

    // Set canvas dimensions
    canvas.width = 540;
    canvas.height = 960;

    const speed = 1; // Scroll speed

    // Word wrapping logic
    const lineHeight = 30;
    const maxWidth = canvas.width - 20; // Maximum width of text (leave some margin)

    const wrapText = (
      text: string,
      ctx: CanvasRenderingContext2D,
      maxWidth: number
    ) => {
      const lines: string[] = [];
      const paragraphs = text.split("\n"); // Split by newlines first

      paragraphs.forEach((paragraph) => {
        const words = paragraph.split(" ");
        let currentLine = "";

        words.forEach((word) => {
          const testLine = currentLine + word + " ";
          const testWidth = ctx.measureText(testLine).width;

          // If the testLine exceeds maxWidth, push the current line and start a new one
          if (testWidth > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = word + " ";
          } else {
            currentLine = testLine;
          }
        });

        // Add the last line if any
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        // Add a blank line after each paragraph
        lines.push("");
      });

      return lines;
    };

    const wrappedText = wrapText(longText, ctx, maxWidth);

    const draw = () => {
      // Clear the canvas on each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set font properties
      ctx.fillStyle = "white";
      ctx.font = "20px UN-Baron";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Render the wrapped text on the canvas
      let yPos = yPosition; // Start from the current yPosition
      wrappedText.forEach((line) => {
        ctx.fillText(line, canvas.width / 2, yPos);
        yPos += lineHeight; // Move to the next line
      });

      // Update scroll position
      setYPosition((prev) => {
        const newYPosition = prev - speed;
        // If the text has scrolled out of the canvas, reset position
        return newYPosition < -wrappedText.length * lineHeight
          ? canvas.height
          : newYPosition;
      });

      requestAnimationFrame(draw);
    };

    draw(); // Start animation

    // Capture canvas stream
    const stream = canvas.captureStream(60); // 30 FPS
    video.srcObject = stream;
    video.play();
  }, [yPosition]);

  return (
    <div className="w-screen flex items-center justify-center p-10">
      <canvas ref={canvasRef} style={{ background: "black" }} />
      {/* Hidden video element for capturing the stream */}
      <video ref={videoRef} style={{ display: "none" }} />
    </div>
  );
};

export default App3;
