/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import { ImprovedStory } from "../classes/Story";

interface PreviewRecordStepProps {
  title: string;
  storyText: string;
  resolution: "720p" | "1080p";
  speed: number;
  font: string;
  titleColor: string;
  textColor: string;
  titleFontSize: number;
  contentFontSize: number;
  backgroundColor: string;
  onBackToSetup: () => void;
  audioFile: File | null;
}

const PreviewRecordStep: React.FC<PreviewRecordStepProps> = ({
  title,
  storyText,
  resolution,
  speed,
  font,
  titleColor,
  textColor,
  titleFontSize,
  contentFontSize,
  backgroundColor,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [showDownloadTip, setShowDownloadTip] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState("0:00");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Fixed display dimensions
  const displayWidth = 360;
  const displayHeight = Math.round(displayWidth * (16 / 9));

  // Get resolution values based on setting
  const getResolutionValues = () => {
    return resolution === "720p"
      ? { width: 720, height: 1280 }
      : { width: 1080, height: 1920 };
  };

  // Animation function
  const animate = (timestamp: number) => {
    if (!storyRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Use custom background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isPlaying) {
      storyRef.current.render(timestamp);
    } else {
      storyRef.current.drawOnly();
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Initialize canvas and story with proper dimensions
  useEffect(() => {
    setLoading(true);
    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const { width, height } = getResolutionValues();
      canvas.width = width;
      canvas.height = height;

      // Enable text anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Set background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Create story instance
      const story = new ImprovedStory({
        story: storyText,
        speed: speed,
        startPosition: height,
        title: title,
        ctx: ctx,
        canvas: canvas,
        font: font,
        titleColor: titleColor,
        textColor: textColor,
        titleFontSize: titleFontSize,
        contentFontSize: contentFontSize,
        backgroundColor: backgroundColor,
      });

      storyRef.current = story;

      // Calculate estimated duration
      const durationSec = story.getEstimatedDuration();
      const mins = Math.floor(durationSec / 60);
      const secs = Math.floor(durationSec % 60);
      setEstimatedDuration(`${mins}:${secs.toString().padStart(2, "0")}`);

      // Draw initial frame
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      story.drawOnly();

      setLoading(false);
    };

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
      if (!animationRef.current && storyRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;

        if (storyRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d", { alpha: false });
          if (ctx) {
            ctx.fillStyle = backgroundColor;
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
    }
  }, [isPlaying]);

  // Update story speed when changed
  useEffect(() => {
    if (storyRef.current) {
      storyRef.current.setSpeed(speed);
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
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;
      } catch (err) {
        console.error("Failed to load audio file:", err);
        alert("Failed to load audio file. Please try a different file.");
      }
    };

    loadAudio();
    return () => {
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
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }

        const videoStream = canvas.captureStream(60);
        let combinedStream: MediaStream;

        if (audioBufferRef.current && audioContextRef.current) {
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBufferRef.current;
          source.loop = true;

          const dest = audioContextRef.current.createMediaStreamDestination();
          source.connect(dest);
          source.connect(audioContextRef.current.destination);

          combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } else {
          combinedStream = videoStream;
        }

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

        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }

        const recorder = new MediaRecorder(combinedStream, options);

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

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

  // Handlers
  const handleStartRecording = () => {
    if (!mediaRecorderRef.current || isRecording) return;

    if (storyRef.current) {
      storyRef.current.reset();
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }

    try {
      chunksRef.current = [];
      setVideoBlob(null);

      // Create new audio source for recording
      if (audioBufferRef.current && audioContextRef.current) {
        stopAudio();

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.loop = true;

        const dest = audioContextRef.current.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioContextRef.current.destination);

        source.start();

        audioSourceRef.current = source;
        setIsAudioPlaying(true);

        const audioStream = dest.stream;
        const videoStream = canvasRef.current!.captureStream(60);

        const combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...audioStream.getAudioTracks(),
        ]);

        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }

        let options = {};
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
          options = { mimeType: "video/webm;codecs=vp9,opus" };
        } else if (
          MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ) {
          options = { mimeType: "video/webm;codecs=vp8,opus" };
        } else {
          options = { mimeType: "video/webm" };
        }

        mediaRecorderRef.current = new MediaRecorder(combinedStream, options);

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

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
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

        if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current.disconnect();
          audioSourceRef.current = null;
          setIsAudioPlaying(false);
        }
      }
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      if (audioBufferRef.current && !isAudioPlaying) {
        playAudio();
      }
    } else {
      stopAudio();
    }
    setIsPlaying(!isPlaying);
  };

  const playAudio = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    try {
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.loop = true;

      source.connect(audioContextRef.current.destination);
      source.start();

      audioSourceRef.current = source;
      setIsAudioPlaying(true);
    } catch (err) {
      console.error("Failed to play audio:", err);
    }
  };

  const stopAudio = () => {
    if (!audioSourceRef.current) return;
    try {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
      setIsAudioPlaying(false);
    } catch (err) {
      console.error("Failed to stop audio:", err);
    }
  };

  const handleReset = () => {
    if (storyRef.current) {
      storyRef.current.reset();

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          storyRef.current.drawOnly();
        }
      }

      if (isPlaying) {
        stopAudio();
        playAudio();
      }
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format the background color for display
//   const displayBackgroundColor = backgroundColor.startsWith("#")
//     ? backgroundColor
//     : `#${backgroundColor}`;

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full">
      {/* Canvas container */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-medium mb-4">Preview</h3>
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

        {/* Audio indicator */}
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
                Using {resolution} resolution • {speed.toFixed(1)}x speed
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
                src={URL.createObjectURL(videoBlob!)}
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
