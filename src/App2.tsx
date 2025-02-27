import { useEffect, useRef, useState } from "react";
import { longText } from "./constants";

const App2 = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const chunksRef = useRef<Blob[]>([]); // To store video chunks

  console.log(isRecording);

  const animate = (story) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    // Clear the canvas at the start of each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    story.update(); // Update the story position

    // Request the next animation frame
    requestRef.current = requestAnimationFrame(() => animate(story));
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
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.font = "20px UN-Baron";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const lineHeight = 30;
        const maxWidth = canvas.width - 20;

        const wrapText = (text, ctx, maxWidth) => {
          const lines = [];
          const paragraphs = text.split("\n");

          paragraphs.forEach((paragraph) => {
            const words = paragraph.split(" ");
            let currentLine = "";

            words.forEach((word) => {
              const testLine = currentLine + word + " ";
              const testWidth = ctx.measureText(testLine).width;

              if (testWidth > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = word + " ";
              } else {
                currentLine = testLine;
              }
            });

            if (currentLine.length > 0) {
              lines.push(currentLine);
            }

            lines.push(""); // Add an empty line after each paragraph
          });

          return lines;
        };

        const wrappedText = wrapText(this.story, ctx, maxWidth);
        let yPosition = this.y;

        wrappedText.forEach((line) => {
          ctx.fillText(line, canvas.width / 2, yPosition);
          yPosition += 30;
        });
      }

      update() {
        this.draw();
        this.y -= this.speed;

        // if (this.y < -960) {
        //   this.y = 960; // Reset text position
        // }
      }
    }

    const story = new Story({ story: longText, speed: 1, y: 960 });

    // Start the animation
    animate(story);

    // Setup video recording when the component mounts
    const stream = canvas.captureStream(30); // Capture stream at 30 FPS
    const mediaRecorderInstance = new MediaRecorder(stream, {
      mimeType: "video/webm",
    });

    // Handle the data available event to collect the video chunks
    mediaRecorderInstance.ondataavailable = (event) => {
      chunksRef.current.push(event.data); // Collect video chunks
    };

    // Set the media recorder state
    setMediaRecorder(mediaRecorderInstance);

    mediaRecorderInstance.onstop = () => {
      // When recording stops, combine all chunks into a Blob
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoBlob(blob); // Set the video blob to state
      chunksRef.current = []; // Clear the chunks array for the next recording
    };

    // Cleanup on unmount
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  const handleStartRecording = () => {
    if (mediaRecorder) {
      setIsRecording(true);
      chunksRef.current = []; // Clear any previous chunks
      mediaRecorder.start(); // Start recording
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      setIsRecording(false);
      mediaRecorder.stop(); // Stop recording
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "animated_text.webm"; // Download video as .webm
    link.click();
    URL.revokeObjectURL(url); // Clean up the object URL
  };

  return (
    <div className="w-screen flex items-center justify-center p-10">
      {/* Canvas for rendering the text */}
      <canvas ref={canvasRef} style={{ background: "black" }} />

      <div className="controls">
        <button onClick={handleStartRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={handleStopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
        <button onClick={handleDownload} disabled={!videoBlob}>
          Download Video
        </button>
      </div>
    </div>
  );
};

export default App2;
