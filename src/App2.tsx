import { useEffect, useRef, useState } from "react";
import { longText } from "./constants";
import { Story } from "./classes/Story";

const App2 = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const storyRef = useRef<Story | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState("0:00");
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");
  const [speed, setSpeed] = useState(1);
  const [title, setTitle] = useState("EPISODE IV\nA NEW HOPE");
  const [loading, setLoading] = useState(true);
  const [showDownloadTip, setShowDownloadTip] = useState(false);

  // Get resolution values based on setting
  const getResolutionValues = () => {
    return resolution === "720p" 
      ? { width: 720, height: 1280 } 
      : { width: 1080, height: 1920 };
  };

  const animate = (timestamp: number) => {
    if (!storyRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Use black background (non-transparent) for better performance
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Use the stable rendering method
    storyRef.current.render(timestamp);

    // Continue animation loop
    animationRef.current = requestAnimationFrame(animate);
  };

  // Initialize canvas and story with proper dimensions
  useEffect(() => {
    setLoading(true);
    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get context with performance optimizations
      const ctx = canvas.getContext("2d", { 
        alpha: false,  // Disable alpha for performance
      });
      if (!ctx) return;

      // Cancel existing animation if any
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Apply resolution
      const { width, height } = getResolutionValues();
      canvas.width = width;
      canvas.height = height;
      
      // Enable text anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      // Set black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Create story instance
      const story = new Story({
        story: longText,
        speed: speed,
        startPosition: height, // Start from bottom
        title: title,
        ctx: ctx,
        canvas: canvas
      });
      
      storyRef.current = story;
      
      // Calculate estimated scrolling duration
      const durationSec = story.getEstimatedDuration();
      const mins = Math.floor(durationSec / 60);
      const secs = Math.floor(durationSec % 60);
      setEstimatedDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      
      // Start animation
      animationRef.current = requestAnimationFrame(animate);
      setLoading(false);
    };

    // Use timeout to allow UI to update before heavy canvas operations
    setTimeout(initializeCanvas, 50);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [resolution, title]);

  // Update story speed when changed
  useEffect(() => {
    if (storyRef.current) {
      storyRef.current.setSpeed(speed);
      
      // Update estimated duration
      const durationSec = storyRef.current.getEstimatedDuration();
      const mins = Math.floor(durationSec / 60);
      const secs = Math.floor(durationSec % 60);
      setEstimatedDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  }, [speed]);

  // Set up MediaRecorder with optimal settings
  useEffect(() => {
    const setupRecorder = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      try {
        // Clean up existing recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        
        // Use optimal FPS - higher is smoother but more resource intensive
        const stream = canvas.captureStream(30);
        
        // Try different formats with fallbacks for browser compatibility
        let options = {};
        
        // VP9 is high quality but may not be supported everywhere
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          options = { 
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: resolution === "1080p" ? 5000000 : 2500000 // Higher bitrate for better quality
          };
        } 
        // VP8 is more widely supported
        else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          options = { 
            mimeType: 'video/webm;codecs=vp8',
            videoBitsPerSecond: resolution === "1080p" ? 3000000 : 1500000 
          };
        }
        // Generic webm as last resort
        else if (MediaRecorder.isTypeSupported('video/webm')) {
          options = { 
            mimeType: 'video/webm',
            videoBitsPerSecond: resolution === "1080p" ? 3000000 : 1500000
          };
        }
        
        const recorder = new MediaRecorder(stream, options);
        
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        
        recorder.onstop = () => {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setVideoBlob(blob);
          }
          
          setIsRecording(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        };
        
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("MediaRecorder setup failed:", err);
        alert("Recording setup failed. Your browser might not support this feature.");
      }
    };
    
    setupRecorder();
  }, [resolution]);

  const handleStartRecording = () => {
    if (!mediaRecorderRef.current || isRecording) return;
    
    // Reset text position to start from beginning
    if (storyRef.current) {
      storyRef.current.reset();
    }
    
    try {
      // Clear previous recording data
      chunksRef.current = [];
      setVideoBlob(null);
      
      // Start recording with reasonable time slice
      mediaRecorderRef.current.start(1000); // Collect data every second
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer for recording duration display
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Failed to start recording. Please try again.");
    }
  };

  const handleStopRecording = () => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setShowDownloadTip(true);
      }
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;

    try {
      const url = URL.createObjectURL(videoBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `star_wars_scroll_${resolution}.webm`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download video:", err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    if (storyRef.current) {
      storyRef.current.reset();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-900 min-h-screen text-white">
      {/* Canvas container with fixed aspect ratio */}
      <div className="flex-1 flex flex-col items-center justify-start">
        <div className="relative mb-4 max-w-full" style={{ width: "auto", height: "auto" }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
              <div className="text-white">Loading...</div>
            </div>
          )}
          
          <canvas 
            ref={canvasRef} 
            className="border border-gray-700 rounded shadow-lg max-w-full" 
            style={{ 
              aspectRatio: "9/16",
              width: resolution === "720p" ? "360px" : "540px",
              height: "auto"
            }} 
          />
          
          {isRecording && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              REC {formatTime(recordingTime)}
            </div>
          )}
        </div>
        
        {videoBlob && (
          <div className="w-full max-w-md mt-4">
            <h3 className="text-lg font-medium mb-2">Preview:</h3>
            <video 
              className="w-full rounded border border-gray-700" 
              controls 
              src={URL.createObjectURL(videoBlob)}
            />
            
            {showDownloadTip && (
              <div className="mt-2 p-2 bg-blue-900 bg-opacity-50 rounded text-sm">
                Tip: If the video preview looks choppy, don't worry! The downloaded file should play smoothly.
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="w-full md:w-72 bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Star Wars Scroll Creator</h2>
        
        {/* Resolution Settings */}
        <div className="mb-4">
          <label className="block mb-2">Resolution:</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setResolution("720p")}
              className={`py-2 px-2 rounded ${resolution === "720p" ? "bg-blue-600" : "bg-gray-600"}`}
            >
              720p
            </button>
            <button 
              onClick={() => setResolution("1080p")}
              className={`py-2 px-2 rounded ${resolution === "1080p" ? "bg-blue-600" : "bg-gray-600"}`}
            >
              1080p
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Higher resolution = better quality but uses more resources
          </p>
        </div>
        
        {/* Title Input */}
        <div className="mb-4">
          <label className="block mb-1">Title Text:</label>
          <textarea 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2 py-1 bg-gray-700 rounded text-white h-20"
            placeholder="Enter title text here..."
          />
        </div>
        
        {/* Speed Control */}
        <div className="mb-4">
          <label className="block mb-1">
            Speed: {speed.toFixed(1)} 
            <span className="text-xs text-gray-400 ml-2">
              Est. Duration: {estimatedDuration}
            </span>
          </label>
          <input 
            type="range" 
            min="0.5" 
            max="2.5" 
            step="0.1" 
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        {/* Reset Button */}
        <button 
          onClick={handleReset}
          className="w-full py-2 mb-4 bg-gray-600 hover:bg-gray-700 rounded transition"
        >
          Reset Position
        </button>
        
        {/* Recording Controls */}
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={handleStartRecording} 
            disabled={isRecording}
            className={`py-2 rounded transition font-medium ${
              isRecording ? "bg-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isRecording ? "Recording..." : "Start Recording"}
          </button>
          
          <button 
            onClick={handleStopRecording} 
            disabled={!isRecording}
            className={`py-2 rounded transition ${
              !isRecording ? "bg-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Stop Recording
          </button>
          
          <button 
            onClick={handleDownload} 
            disabled={!videoBlob}
            className={`py-2 rounded transition mt-2 ${
              !videoBlob ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Download Video
          </button>
        </div>
        
        {/* Performance Tips */}
        <div className="mt-6 p-3 bg-gray-700 rounded text-sm">
          <h3 className="font-medium mb-1">Tips for Smooth Recording:</h3>
          <ul className="list-disc pl-4 space-y-1 text-gray-300">
            <li>Close other browser tabs and applications</li>
            <li>Use 720p if performance is an issue</li>
            <li>Record in shorter segments if needed</li>
            <li>Slower speed = smoother animation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App2;