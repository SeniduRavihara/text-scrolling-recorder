import { useState, useEffect, useRef } from "react";

// Available fonts from the fonts directory
const availableFonts = [
  {
    name: "un-abhaya-bold-prod",
    path: "/fonts/sinhalaUnicode/un-abhaya-bold-prod.ttf",
  },
  { name: "UN-Arjuna", path: "/fonts/sinhalaUnicode/un-arjuna.ttf" },
  { name: "UN-basuru", path: "/fonts/sinhalaUnicode/un-basuru.ttf" },
];

export default function SinhalaTextEditor() {
  // State for text properties
  const [text, setText] = useState("ආයුබෝවන්"); // Default Sinhala text "Ayubowan"
  const [fontSize, setFontSize] = useState(36);
  const [fontColor, setFontColor] = useState("#000000");
  const [selectedFont, setSelectedFont] = useState(availableFonts[0]);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Load fonts with FontFace API
  useEffect(() => {
    availableFonts.forEach((font) => {
      const newFont = new FontFace(font.name, `url(${font.path})`);
      newFont
        .load()
        .then((loadedFont) => {
          document.fonts.add(loadedFont);
          // Redraw when font is loaded
          drawText();
        })
        .catch((err) => {
          console.error(`Failed to load font: ${font.name}`, err);
        });
    });
  }, []);

  // Draw text on canvas
  const drawText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.font = `${fontSize}px "${selectedFont.name}"`;
    ctx.fillStyle = fontColor;

    // Draw text at position
    ctx.fillText(text, position.x, position.y);
  };

  // Update canvas when properties change
  useEffect(() => {
    drawText();
  }, [text, fontSize, fontColor, selectedFont, position]);

  // Handle mouse events for dragging
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is near text
    const ctx = canvas.getContext("2d");
    const textMetrics = ctx.measureText(text);
    const textHeight = fontSize; // Approximate height

    if (
      x >= position.x &&
      x <= position.x + textMetrics.width &&
      y >= position.y - textHeight &&
      y <= position.y
    ) {
      setIsDragging(true);
      setDragOffset({
        x: x - position.x,
        y: y - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({
      x: x - dragOffset.x,
      y: y - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col p-4 w-full max-w-4xl mx-auto bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Sinhala Text Editor
      </h2>

      {/* Canvas Area */}
      <div className="relative w-full h-64 mb-4 bg-white border border-gray-300 rounded">
        <canvas
          ref={canvasRef}
          width={800}
          height={250}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Text Input */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Text:</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            rows={2}
          />
        </div>

        {/* Font Selector */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Font:</label>
          <select
            value={selectedFont.name}
            onChange={(e) => {
              const font = availableFonts.find(
                (f) => f.name === e.target.value
              );
              if (font) setSelectedFont(font);
            }}
            className="w-full p-2 border border-gray-300 rounded"
          >
            {availableFonts.map((font) => (
              <option key={font.name} value={font.name}>
                {font.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Font Size */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Font Size: {fontSize}px</label>
          <input
            type="range"
            min="12"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Font Color */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Font Color:</label>
          <div className="flex items-center">
            <input
              type="color"
              value={fontColor}
              onChange={(e) => setFontColor(e.target.value)}
              className="w-12 h-8 border border-gray-300"
            />
            <input
              type="text"
              value={fontColor}
              onChange={(e) => setFontColor(e.target.value)}
              className="ml-2 p-2 border border-gray-300 rounded w-full"
            />
          </div>
        </div>

        {/* Position Controls */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">
            Position (Drag text to move):
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <span className="mr-2">X:</span>
              <input
                type="number"
                value={Math.round(position.x)}
                onChange={(e) =>
                  setPosition({ ...position, x: parseInt(e.target.value) || 0 })
                }
                className="p-2 border border-gray-300 rounded w-full"
              />
            </div>
            <div className="flex items-center">
              <span className="mr-2">Y:</span>
              <input
                type="number"
                value={Math.round(position.y)}
                onChange={(e) =>
                  setPosition({ ...position, y: parseInt(e.target.value) || 0 })
                }
                className="p-2 border border-gray-300 rounded w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          Tips: Click and drag text to reposition. Type Sinhala Unicode text in
          the text area.
        </p>
      </div>
    </div>
  );
}
