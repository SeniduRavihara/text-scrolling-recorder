import React, { useState, useRef, useEffect } from "react";
import { ImprovedStory } from "../classes/Story";

interface PreviewRecordStepProps {
  title: string;
  storyText: string;
  resolution: "720p" | "1080p";
  speed: number;
  onBackToSetup: () => void;
  audioFile: File | null;
}

/**
 * Second step of the Star Wars scroll creator
 * Handles preview, playback control, and video recording
 * Optimized for YouTube Shorts with 9:16 vertical aspect ratio
 */
const PreviewRecordStep: React.FC<PreviewRecordStepProps> = ({
  title,
  storyText,
  resolution,
  speed,
  onBackToSetup,
  audioFile,
}) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const storyRef = useRef<ImprovedStory | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false); // Start paused for better user experience
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [showDownloadTip, setShowDownloadTip] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState("0:00");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Fixed display dimensions - now vertical (9:16 aspect ratio)
  const displayWidth = 270; // Narrower width for preview
  const displayHeight = Math.round(displayWidth * (16 / 9)); // Calculate height based on 9:16 ratio

  // Get resolution values based on setting - adjusted for 9:16 aspect ratio for Shorts
  const getResolutionValues = () => {
    return resolution === "720p"
      ? { width: 720, height: 1280 } // 9:16 ratio for 720p
      : { width: 1080, height: 1920 }; // 9:16 ratio for 1080p
  };

  // Animation function
  const animate = (timestamp: number) => {
    if (!storyRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Use black background (non-transparent) for better performance
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Only update position if playing
    if (isPlaying) {
      // Use the stable rendering method with timestamp
      storyRef.current.render(timestamp);
    } else {
      // Just draw at current position without updating
      storyRef.current.drawOnly();
    }

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
        alpha: false, // Disable alpha for performance
      });
      if (!ctx) return;

      // Cancel existing animation if any
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // Apply resolution - now vertical for YouTube Shorts
      const { width, height } = getResolutionValues();
      canvas.width = width;
      canvas.height = height;

      // Enable text anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Set black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Create story instance with improved smoothing
      // Note: May need to adjust text positioning in Story class for vertical orientation
      const story = new ImprovedStory({
        story: storyText,
        speed: speed,
        startPosition: height, // Start from bottom
        title: title,
        ctx: ctx,
        canvas: canvas,
      });

      storyRef.current = story;

      // Calculate estimated scrolling duration
      const durationSec = story.getEstimatedDuration();
      const mins = Math.floor(durationSec / 60);
      const secs = Math.floor(durationSec % 60);
      setEstimatedDuration(`${mins}:${secs.toString().padStart(2, "0")}`);

      // Draw the initial frame without starting animation
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      story.drawOnly();

      // Only start animation if isPlaying is true
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }

      setLoading(false);
    };

    // Use timeout to allow UI to update before heavy canvas operations
    setTimeout(initializeCanvas, 50);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [resolution, title, storyText]);

  // Handle play/pause functionality
  useEffect(() => {
    if (isPlaying) {
      // Start animation if not already running
      if (!animationRef.current && storyRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }

      // Start audio if available and not already playing
      if (audioBufferRef.current && !isAudioPlaying) {
        playAudio();
      }
    } else {
      // Stop animation if running
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;

        // Draw the current frame so it doesn't disappear
        if (storyRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d", { alpha: false });
          if (ctx) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
            storyRef.current.drawOnly();
          }
        }
      }

      // Stop audio if playing
      stopAudio();
    }
  }, [isPlaying]);

  // Update story speed when changed
  useEffect(() => {
    if (storyRef.current) {
      storyRef.current.setSpeed(speed);

      // Update estimated duration
      const durationSec = storyRef.current.getEstimatedDuration();
      const mins = Math.floor(durationSec / 60);
      const secs = Math.floor(durationSec % 60);
      setEstimatedDuration(`${mins}:${secs.toString().padStart(2, "0")}`);
    }
  }, [speed]);

  // Load audio file when available
  useEffect(() => {
    const loadAudio = async () => {
      if (!audioFile) return;

      try {
        // Create new audio context
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        // Load audio file
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Store the buffer for later use
        audioBufferRef.current = audioBuffer;
      } catch (err) {
        console.error("Failed to load audio file:", err);
        alert("Failed to load audio file. Please try a different file.");
      }
    };

    loadAudio();

    return () => {
      // Clean up audio resources
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [audioFile]);

  // Set up MediaRecorder with optimal settings
  useEffect(() => {
    const setupRecorder = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        // Clean up existing recorder
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }

        // Get video stream from canvas - using 60fps for smooth scrolling
        const videoStream = canvas.captureStream(60);

        // Prepare audio stream if available
        let combinedStream: MediaStream;

        if (audioBufferRef.current && audioContextRef.current) {
          // We'll create a new stream destination when recording starts
          combinedStream = new MediaStream([...videoStream.getVideoTracks()]);
        } else {
          combinedStream = videoStream;
        }

        // Try different formats with fallbacks - optimize for vertical video
        let options = {};
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
          options = {
            mimeType: "video/webm;codecs=vp9",
            videoBitsPerSecond: resolution === "1080p" ? 8000000 : 4000000,
          };
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          options = {
            mimeType: "video/webm;codecs=vp8",
            videoBitsPerSecond: resolution === "1080p" ? 5000000 : 2500000,
          };
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          options = {
            mimeType: "video/webm",
            videoBitsPerSecond: resolution === "1080p" ? 5000000 : 2500000,
          };
        }

        const recorder = new MediaRecorder(combinedStream, options);

        // Handle data chunks
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        // Finalize blob when recording stops
        recorder.onstop = () => {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
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
        alert(
          "Recording setup failed. Your browser might not support this feature."
        );
      }
    };

    setupRecorder();
  }, [resolution]);

  // Helper function to play audio
  const playAudio = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    try {
      // Create new audio source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.loop = true;

      // Connect to audio output
      source.connect(audioContextRef.current.destination);

      // Start playback
      source.start();

      // Save reference for later cleanup
      audioSourceRef.current = source;
      setIsAudioPlaying(true);
    } catch (err) {
      console.error("Failed to play audio:", err);
    }
  };

  // Helper function to stop audio
  const stopAudio = () => {
    if (!audioSourceRef.current) return;

    try {
      // Stop and disconnect audio source
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
      setIsAudioPlaying(false);
    } catch (err) {
      console.error("Failed to stop audio:", err);
    }
  };

  // Handlers
  const handleStartRecording = () => {
    if (!mediaRecorderRef.current || isRecording) return;

    // Reset text position to start from beginning
    if (storyRef.current) {
      storyRef.current.reset();

      // Ensure playback is active during recording
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }

    try {
      // Clear previous recording data
      chunksRef.current = [];
      setVideoBlob(null);

      // Create a new audio source for recording if available
      if (audioBufferRef.current && audioContextRef.current) {
        // Stop existing audio if playing
        stopAudio();

        // Create and configure new source
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.loop = true;

        // Create media stream destination for recording
        const dest = audioContextRef.current.createMediaStreamDestination();
        source.connect(dest);

        // Also connect to audio output
        source.connect(audioContextRef.current.destination);

        // Start audio
        source.start();

        // Save reference
        audioSourceRef.current = source;
        setIsAudioPlaying(true);

        // Get the audio stream and add it to the recorder's stream
        const audioStream = dest.stream;
        const videoStream = canvasRef.current!.captureStream(60);

        // Create a new combined stream with both audio and video
        const combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...audioStream.getAudioTracks(),
        ]);

        // Update the MediaRecorder with the new combined stream
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stream
            .getTracks()
            .forEach((track) => track.stop());

          let options = {};
          if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
            options = {
              mimeType: "video/webm;codecs=vp9,opus",
              videoBitsPerSecond: resolution === "1080p" ? 8000000 : 4000000,
            };
          } else if (
            MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ) {
            options = {
              mimeType: "video/webm;codecs=vp8,opus",
              videoBitsPerSecond: resolution === "1080p" ? 5000000 : 2500000,
            };
          } else if (MediaRecorder.isTypeSupported("video/webm")) {
            options = {
              mimeType: "video/webm",
              videoBitsPerSecond: resolution === "1080p" ? 5000000 : 2500000,
            };
          }

          mediaRecorderRef.current = new MediaRecorder(combinedStream, options);

          // Reattach event handlers
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };

          mediaRecorderRef.current.onstop = () => {
            if (chunksRef.current.length > 0) {
              const blob = new Blob(chunksRef.current, { type: "video/webm" });
              setVideoBlob(blob);
            }
            setIsRecording(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
          };
        }
      }

      // Start recording with reasonable time slice
      mediaRecorderRef.current.start(1000); // Collect data every second

      setIsRecording(true);
      setRecordingTime(0);

      // Start timer for recording duration display
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
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

        // Stop audio playback
        stopAudio();
      }
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    if (storyRef.current) {
      storyRef.current.reset();

      // Draw the initial frame after reset
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          storyRef.current.drawOnly();
        }
      }

      // If currently playing, restart audio
      if (isPlaying) {
        stopAudio();
        playAudio();
      }
    }
  };

  const handleAudioToggle = () => {
    if (isAudioPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;

    try {
      const url = URL.createObjectURL(videoBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `star_wars_scroll_vertical_${resolution}.webm`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download video:", err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full">
      {/* Canvas container - adjusted for vertical video */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-medium mb-4">
          Preview (Vertical 9:16 Format)
        </h3>

        <div
          className="relative mb-6"
          style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
          }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
              <div className="text-white">Loading...</div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="border border-gray-700 rounded shadow-lg"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
              objectFit: "contain",
            }}
          />

          {isRecording && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              REC {formatTime(recordingTime)}
            </div>
          )}
        </div>

        {/* Play/Pause Controls */}
        <div className="flex space-x-3 mb-4">
          <button
            onClick={handlePlayPause}
            className={`px-6 py-2 rounded font-medium transition ${
              isPlaying
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            onClick={handleReset}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition font-medium"
          >
            Reset
          </button>

          <button
            onClick={onBackToSetup}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded transition font-medium"
          >
            Back to Setup
          </button>
        </div>

        {/* Audio indicator (only show if audio file is available) */}
        {audioFile && (
          <div className="flex items-center mt-2">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isAudioPlaying ? "bg-green-500" : "bg-gray-500"
              }`}
            ></div>
            <span className="text-sm text-gray-300">
              Audio: {isAudioPlaying ? "Playing" : "Paused"}
            </span>
          </div>
        )}

        {/* Recording info */}
        <div className="w-full max-w-md mt-2 text-center">
          <p className="text-sm text-gray-300">
            Estimated Duration: {estimatedDuration}
          </p>
          <p className="text-sm text-gray-300 mt-1">
            Optimized for YouTube Shorts and vertical video platforms
          </p>
        </div>
      </div>

      {/* Recording controls */}
      <div className="w-full md:w-72 bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
        <h3 className="text-xl font-medium mb-4">Recording</h3>

        {!videoBlob ? (
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-2">Before You Record:</h4>
              <ul className="list-disc pl-4 space-y-1 text-gray-300 text-sm">
                <li>Check if preview looks correct</li>
                <li>Close other browser tabs</li>
                <li>Recording will start from the beginning</li>
                <li>The recording will continue until you stop it</li>
                <li>Format is 9:16 (vertical) for YouTube Shorts</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-4">
              <button
                onClick={handleStartRecording}
                disabled={isRecording}
                className={`py-3 rounded-lg transition font-medium ${
                  isRecording
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isRecording ? "Recording..." : "Start Recording"}
              </button>

              <button
                onClick={handleStopRecording}
                disabled={!isRecording}
                className={`py-3 rounded-lg transition ${
                  !isRecording
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Stop Recording
              </button>
            </div>

            {isRecording && (
              <div className="bg-red-900 bg-opacity-30 p-3 rounded-lg text-center">
                <div className="font-bold">Recording in Progress</div>
                <div className="text-xl mt-1">{formatTime(recordingTime)}</div>
              </div>
            )}

            <div className="mt-auto pt-4">
              <div className="text-xs text-gray-400">
                Using {resolution} vertical format • {speed.toFixed(1)}x speed
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Video Preview:</h3>
              <video
                className="w-full rounded border border-gray-700"
                controls
                src={URL.createObjectURL(videoBlob)}
              />
            </div>

            {showDownloadTip && (
              <div className="mt-2 p-3 bg-blue-900 bg-opacity-50 rounded-lg text-sm mb-4">
                <p>
                  <span className="font-bold">Tip:</span> If the video preview
                  looks choppy, don't worry! The downloaded file should play
                  smoothly.
                </p>
              </div>
            )}

            <button
              onClick={handleDownload}
              className="py-3 bg-green-600 hover:bg-green-700 rounded-lg transition font-medium"
            >
              Download Video
            </button>

            <button
              onClick={() => {
                setVideoBlob(null);
                setShowDownloadTip(false);
              }}
              className="py-2 mt-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Record Another Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewRecordStep;
