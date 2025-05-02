import React from "react";

interface SetupStepProps {
  title: string;
  setTitle: (title: string) => void;
  storyText: string;
  setStoryText: (text: string) => void;
  resolution: "720p" | "1080p";
  setResolution: (resolution: "720p" | "1080p") => void;
  speed: number;
  setSpeed: (speed: number) => void;
  font: string;
  setFont: (font: string) => void;
  titleColor: string;
  setTitleColor: (color: string) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  titleFontSize: number;
  setTitleFontSize: (size: number) => void;
  contentFontSize: number;
  setContentFontSize: (size: number) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  onContinue: () => void;
}

const SetupStep: React.FC<SetupStepProps> = ({
  title,
  setTitle,
  storyText,
  setStoryText,
  resolution,
  setResolution,
  speed,
  setSpeed,
  font,
  setFont,
  titleColor,
  setTitleColor,
  textColor,
  setTextColor,
  titleFontSize,
  setTitleFontSize,
  contentFontSize,
  setContentFontSize,
  backgroundColor,
  setBackgroundColor,
  onContinue,
}) => {
  return (
    <div className="max-w-3xl mx-auto w-full bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Star Wars Scroll Creator - Setup
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div>
          <div className="mb-6">
            <label className="block mb-2 font-medium">Title Text</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter title text (will appear in yellow)..."
            />
            <p className="text-xs text-gray-400 mt-1">
              Use line breaks for multiple lines
            </p>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Main Content</label>
            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your main text content here..."
            />
            <p className="text-xs text-gray-400 mt-1">
              This is the main scrolling text that appears in white
            </p>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="mb-6">
            <label className="block mb-2 font-medium">Video Quality</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setResolution("720p")}
                className={`py-3 px-4 rounded-lg flex flex-col items-center justify-center transition ${
                  resolution === "720p"
                    ? "bg-blue-600 border-2 border-blue-400"
                    : "bg-gray-700 border border-gray-600 hover:bg-gray-600"
                }`}
              >
                <span className="font-bold">720p</span>
                <span className="text-xs mt-1">Standard Quality</span>
              </button>
              <button
                onClick={() => setResolution("1080p")}
                className={`py-3 px-4 rounded-lg flex flex-col items-center justify-center transition ${
                  resolution === "1080p"
                    ? "bg-blue-600 border-2 border-blue-400"
                    : "bg-gray-700 border border-gray-600 hover:bg-gray-600"
                }`}
              >
                <span className="font-bold">1080p</span>
                <span className="text-xs mt-1">High Quality</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Higher resolution = better quality but uses more resources
            </p>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">
              Scroll Speed: {speed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Custom Font</label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="'StarJedi', sans-serif">Star Wars</option>
              <option value="'Arial', sans-serif">Arial</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'UN-Arjuna', sans-serif">UN-Arjuna</option>
              <option value="'UN-Baron', sans-serif">UN-Baron</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Title Color</label>
            <input
              type="color"
              value={titleColor}
              onChange={(e) => setTitleColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Text Color</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">
              Title Font Size: {titleFontSize}px
            </label>
            <input
              type="range"
              min="24"
              max="60"
              value={titleFontSize}
              onChange={(e) => setTitleFontSize(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Small</span>
              <span>Medium</span>
              <span>Large</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">
              Content Font Size: {contentFontSize}px
            </label>
            <input
              type="range"
              min="16"
              max="72"
              value={contentFontSize}
              onChange={(e) => setContentFontSize(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Small</span>
              <span>Medium</span>
              <span>Large</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Background Color</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onContinue}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium text-lg"
        >
          Continue to Audio Setup
        </button>
      </div>
    </div>
  );
};

export default SetupStep;
