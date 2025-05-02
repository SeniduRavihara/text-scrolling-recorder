export class ImprovedStory {
  private ctx: CanvasRenderingContext2D;
  private story: string;
  private speed: number;
  private position: number;
  private title: string;
  private canvas: HTMLCanvasElement;
  private cachedLines: string[] = [];
  private cachedTitleLines: string[] = [];
  private totalHeight: number = 0;
  private lastTimestamp: number = 0;

  // Smooth scrolling variables
  private targetPosition: number;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  private animationStep: number = 1 / 120; // Higher precision step for smoother animation
  private textOffscreenImage: OffscreenCanvas | null = null; // For text caching

  constructor({
    ctx,
    story,
    speed = 1,
    startPosition,
    title,
    canvas,
  }: {
    ctx: CanvasRenderingContext2D;
    story: string;
    speed?: number;
    startPosition: number;
    title: string;
    canvas: HTMLCanvasElement;
  }) {
    this.story = story;
    this.speed = speed;
    this.position = startPosition;
    this.targetPosition = startPosition; // Initialize target position
    this.title = title;
    this.ctx = ctx;
    this.canvas = canvas;

    // Try to create offscreen canvas for better performance
    try {
      this.textOffscreenImage = new OffscreenCanvas(
        canvas.width,
        canvas.height * 3
      );
    } catch (e) {
      console.log(
        "OffscreenCanvas not supported, falling back to direct rendering"
      );
      this.textOffscreenImage = null;
    }

    // Pre-process text immediately for better performance
    this.preprocessText();
  }

  // Pre-process text into lines to avoid recalculating on every frame
  private preprocessText() {
    const maxWidth = this.canvas.width - 80; // Wider margin for better appearance

    // Process title
    this.ctx.font = "bold 40px 'Arial', sans-serif"; // Slightly larger font
    this.cachedTitleLines = this.wrapText(this.title.toUpperCase(), maxWidth);

    // Process main text
    this.ctx.font = "22px 'Arial', sans-serif"; // Slightly larger font
    this.cachedLines = this.wrapText(this.story, maxWidth);

    // Calculate total height
    this.totalHeight =
      this.cachedTitleLines.length * 60 + // Title lines height (increased)
      this.cachedLines.length * 36 + // Story lines height (increased)
      100; // Additional spacing between title and text

    // Pre-render text to offscreen canvas if supported
    if (this.textOffscreenImage) {
      this.preRenderText();
    }
  }

  // Pre-render all text to an offscreen canvas for better performance
  private preRenderText() {
    if (!this.textOffscreenImage) return;

    const offscreenCtx = this.textOffscreenImage.getContext("2d", {
      alpha: true,
    });
    if (!offscreenCtx) return;

    // Clear the canvas
    offscreenCtx.clearRect(
      0,
      0,
      this.textOffscreenImage.width,
      this.textOffscreenImage.height
    );

    // Configure text rendering
    offscreenCtx.textAlign = "center";
    offscreenCtx.textBaseline = "top";

    let yPos = 0;

    // Draw title
    offscreenCtx.fillStyle = "#FFDD00"; // Star Wars yellow
    offscreenCtx.font = "bold 40px 'Arial', sans-serif";

    this.cachedTitleLines.forEach((line) => {
      offscreenCtx.fillText(
        line,
        Math.round(this.textOffscreenImage!.width / 2),
        yPos
      );
      yPos += 60; // Fixed spacing for title lines
    });

    // Add space between title and main text
    yPos += 40;

    // Draw main text
    offscreenCtx.fillStyle = "white";
    offscreenCtx.font = "22px 'Arial', sans-serif";

    this.cachedLines.forEach((line) => {
      offscreenCtx.fillText(
        line,
        Math.round(this.textOffscreenImage!.width / 2),
        yPos
      );
      yPos += 36; // Fixed spacing for text lines
    });
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split("\n");

    paragraphs.forEach((paragraph) => {
      if (paragraph.trim() === "") {
        lines.push("");
        return;
      }

      const words = paragraph.split(" ");
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine + word + " ";
        const testWidth = this.ctx.measureText(testLine).width;

        if (testWidth > maxWidth && currentLine.length > 0) {
          lines.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine.trim().length > 0) {
        lines.push(currentLine.trim());
      }

      // Add an empty line after each paragraph
      lines.push("");
    });

    return lines;
  }

  // Draw current frame using the more efficient method
  public drawOnly() {
    if (this.textOffscreenImage) {
      this.drawFromOffscreen();
    } else {
      this.drawDirect(this.position);
    }
  }

  // Draw text from pre-rendered offscreen canvas (faster)
  private drawFromOffscreen() {
    if (!this.textOffscreenImage) return;

    // Calculate source and destination rectangles for drawing
    const canvas = this.canvas;
    const sourceY = 0;
    const sourceHeight = this.totalHeight + canvas.height;

    // Draw the pre-rendered text at the current position
    this.ctx.drawImage(
      this.textOffscreenImage,
      0,
      sourceY,
      this.textOffscreenImage.width,
      sourceHeight,
      0,
      Math.round(this.position),
      canvas.width,
      sourceHeight
    );
  }

  // Draw text directly to canvas (fallback method)
  private drawDirect(interpolatedPosition: number) {
    const ctx = this.ctx;
    const canvas = this.canvas;

    // Use Math.round to ensure pixel-perfect positioning (prevents text shimmering)
    const roundedPosition = Math.round(interpolatedPosition);

    // Draw title lines
    ctx.fillStyle = "#FFDD00"; // Star Wars yellow
    ctx.font = "bold 40px 'Arial', sans-serif"; // Slightly larger, clearer font
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    let yPos = roundedPosition;

    // Apply text shadow for better visibility and Star Wars feeling
    ctx.shadowColor = "rgba(255, 221, 0, 0.4)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw title lines with anti-aliasing consideration
    this.cachedTitleLines.forEach((line) => {
      // Only draw lines that are visible on screen (performance optimization)
      if (yPos >= -60 && yPos <= canvas.height) {
        ctx.fillText(line, Math.round(canvas.width / 2), yPos);
      }
      yPos += 60; // Fixed spacing for title lines (increased)
    });

    // Add space between title and main text
    yPos += 40;

    // Draw main text
    ctx.fillStyle = "white";
    ctx.font = "22px 'Arial', sans-serif"; // Slightly larger font

    // Change shadow for main text
    ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    ctx.shadowBlur = 2;

    // Draw text lines with anti-aliasing consideration
    this.cachedLines.forEach((line) => {
      // Only draw lines that are visible on screen
      if (yPos >= -36 && yPos <= canvas.height) {
        ctx.fillText(line, Math.round(canvas.width / 2), yPos);
      }
      yPos += 36; // Fixed spacing for text lines (increased)
    });

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  update(timestamp: number) {
    // Initialize timestamp on first call
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return;
    }

    // Calculate frame time delta
    const frameTime = Math.min(0.03, (timestamp - this.lastTimestamp) / 1000); // Cap at 30ms to avoid large jumps
    this.lastTimestamp = timestamp;

    // Add the frame time to our accumulated time
    this.accumulatedTime += frameTime;

    // While we have enough accumulated time for a physics update:
    while (this.accumulatedTime >= this.animationStep) {
      // Calculate precise movement amount (pixels per second * time)
      const pixelsToMove = this.speed * 60 * this.animationStep;

      // Update target position
      this.targetPosition -= pixelsToMove;

      // Update position with smooth interpolation - increased interpolation factor for more responsive scrolling
      this.position =
        this.position + (this.targetPosition - this.position) * 0.3;

      // Reduce accumulated time
      this.accumulatedTime -= this.animationStep;
    }

    // Reset position when text is fully scrolled
    if (this.position < -this.totalHeight) {
      this.position = this.canvas.height;
      this.targetPosition = this.canvas.height;
    }
  }

  render(timestamp: number) {
    // Update position based on time
    this.update(timestamp);

    // Draw with the updated position
    if (this.textOffscreenImage) {
      this.drawFromOffscreen();
    } else {
      this.drawDirect(this.position);
    }
  }

  // Utility methods
  setSpeed(speed: number) {
    this.speed = speed;
  }

  reset() {
    this.position = this.canvas.height;
    this.targetPosition = this.canvas.height;
    this.lastTimestamp = 0; // Reset timer to prevent jumps
    this.accumulatedTime = 0;
  }

  getEstimatedDuration(): number {
    // Calculate approximate duration in seconds
    // (total distance to scroll / pixels per second)
    return (this.totalHeight + this.canvas.height) / (this.speed * 60);
  }
}
