import { useEffect, useRef, useState } from "react";
import { longText } from "./constants";
import { Story } from "./classes/Story";



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

  const animate = (story: Story) => {
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

    // Log mediaRecorder and captureStream for debugging
    console.log("Initializing recording stream...");

    const stream = canvas.captureStream(30); // Capture stream at 30 FPS
    const mediaRecorderInstance = new MediaRecorder(stream, {
      mimeType: "video/webm",
    });

    // Log mediaRecorder to verify if it's correctly initialized
    console.log("MediaRecorder initialized:", mediaRecorderInstance);

    mediaRecorderInstance.ondataavailable = (event) => {
      console.log("Data available for video recording:", event.data);
      chunksRef.current.push(event.data); // Collect video chunks
    };

    mediaRecorderInstance.onstop = () => {
      console.log("Recording stopped. Combining chunks...");
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoBlob(blob); // Set the video blob to state
      chunksRef.current = []; // Clear the chunks array for the next recording
    };

    setMediaRecorder(mediaRecorderInstance); // Set mediaRecorder state
    const story = new Story({
      story: longText,
      speed: 1,
      y: 960,
      ctx: ctx,
      canvas: canvas,
      title: "Hello",
    });

    // Start the animation
    animate(story);

    // Cleanup on unmount
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  const handleStartRecording = () => {
    if (mediaRecorder) {
      setIsRecording(true);
      chunksRef.current = []; // Clear any previous chunks
      console.log("Starting recording...");
      mediaRecorder.start(); // Start recording
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      setIsRecording(false);
      console.log("Stopping recording...");
      mediaRecorder.stop(); // Stop recording
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "animated_text.mp4"; // Download video as .webm
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
