import { useEffect, useRef } from "react";
import { longText } from "./constants";

const App2 = () => {
  const canvasRef = useRef(null);

  const requestRef = useRef(null);
  const frameCount = useRef(0);

  const animate = (story) => {
    // Clear the canvas at the start of each frame
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    frameCount.current += 1;

    story.update(); // Update the story position

    requestRef.current = requestAnimationFrame(() => animate(story)); // Recursive call to animate
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 540;
    canvas.height = 960;

    class Story {
      constructor({ story, speed, y }) {
        this.story = story;
        this.speed = speed;
        this.y = y;
      }

      draw() {
        // Set font properties
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.font = "20px UN-Baron";
        ctx.textAlign = "center"; // Align text to the center
        ctx.textBaseline = "top"; // Text aligns from top

        // Word wrapping logic
        const lineHeight = 30;
        const maxWidth = canvas.width - 20; // Maximum width of text (leave some margin)

        // Function to wrap text and add new line when exceeding canvas width
        const wrapText = (text, ctx, maxWidth) => {
          const lines = [];
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

        // Split the text into lines considering wrapping
        const wrappedText = wrapText(this.story, ctx, maxWidth);

        // Render the wrapped text on the canvas
        let yPosition = this.y; // Starting Y position on the canvas

        wrappedText.forEach((line) => {
          // Render each line centered
          ctx.fillText(line, canvas.width / 2, yPosition); // Render each line at the center horizontally
          yPosition += lineHeight; // Move to the next line
        });
      }

      update() {
        this.draw();
        this.y -= this.speed; // Move the text upwards
        // if (this.y < -canvas.height) {
        //   // If text moves off-screen, reset its position
        //   this.y = canvas.height;
        // }
      }
    }

    const story = new Story({ story: longText, speed: 1, y: 50 }); // Initialize story with starting y-position and speed
    animate(story); // Start the animation

    return () => cancelAnimationFrame(requestRef.current); // Cleanup on unmount
  }, []);

  return (
    <div className="w-screen flex items-center justify-center p-10">
      {/* Canvas for rendering the text */}
      <canvas ref={canvasRef} style={{ background: "black" }} />
    </div>
  );
};

export default App2;
