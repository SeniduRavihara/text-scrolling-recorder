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
  private accumulatedTime: number = 0;
  private animationStep: number = 1 / 120;
  private textOffscreenImage: OffscreenCanvas | null = null;

  // Customization properties
  private font: string;
  private titleColor: string;
  private textColor: string;
  private titleFontSize: number;
  private contentFontSize: number;
  private backgroundColor: string;

  constructor({
    ctx,
    story,
    speed = 1,
    startPosition,
    title,
    canvas,
    font = "'Arial', sans-serif",
    titleColor = "#FFDD00",
    textColor = "white",
    titleFontSize = 40,
    contentFontSize = 22,
    backgroundColor = "#000000",
  }: {
    ctx: CanvasRenderingContext2D;
    story: string;
    speed?: number;
    startPosition: number;
    title: string;
    canvas: HTMLCanvasElement;
    font?: string;
    titleColor?: string;
    textColor?: string;
    titleFontSize?: number;
    contentFontSize?: number;
    backgroundColor?: string;
  }) {
    this.story = story;
    this.speed = speed;
    this.position = startPosition;
    this.targetPosition = startPosition;
    this.title = title;
    this.ctx = ctx;
    this.canvas = canvas;
    this.font = font;
    this.titleColor = titleColor;
    this.textColor = textColor;
    this.titleFontSize = titleFontSize;
    this.contentFontSize = contentFontSize;
    this.backgroundColor = backgroundColor;

    try {
      this.textOffscreenImage = new OffscreenCanvas(
        canvas.width,
        canvas.height * 3
      );
    } catch {
      this.textOffscreenImage = null;
    }

    this.preprocessText();
  }

  private preprocessText() {
    const maxWidth = this.canvas.width - 80;

    // Process title
    this.ctx.font = `bold ${this.titleFontSize}px ${this.font}`;
    this.cachedTitleLines = this.wrapText(this.title.toUpperCase(), maxWidth);

    // Process main text
    this.ctx.font = `${this.contentFontSize}px ${this.font}`;
    this.cachedLines = this.wrapText(this.story, maxWidth);

    // Calculate total height
    this.totalHeight =
      this.cachedTitleLines.length * (this.titleFontSize + 10) +
      this.cachedLines.length * (this.contentFontSize + 8) +
      100;

    // Pre-render text to offscreen canvas if supported
    if (this.textOffscreenImage) {
      this.preRenderText();
    }
  }

  private preRenderText() {
    if (!this.textOffscreenImage) return;

    const offscreenCtx = this.textOffscreenImage.getContext("2d", {
      alpha: true,
    });
    if (!offscreenCtx) return;

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
    offscreenCtx.fillStyle = this.titleColor;
    offscreenCtx.font = `bold ${this.titleFontSize}px ${this.font}`;

    this.cachedTitleLines.forEach((line) => {
      offscreenCtx.fillText(
        line,
        Math.round(this.textOffscreenImage!.width / 2),
        yPos
      );
      yPos += this.titleFontSize + 10;
    });

    // Add space between title and main text
    yPos += 40;

    // Draw main text
    offscreenCtx.fillStyle = this.textColor;
    offscreenCtx.font = `${this.contentFontSize}px ${this.font}`;

    this.cachedLines.forEach((line) => {
      offscreenCtx.fillText(
        line,
        Math.round(this.textOffscreenImage!.width / 2),
        yPos
      );
      yPos += this.contentFontSize + 8;
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

      lines.push("");
    });

    return lines;
  }

  public drawOnly() {
    if (this.textOffscreenImage) {
      this.drawFromOffscreen();
    } else {
      this.drawDirect(this.position);
    }
  }

  private drawFromOffscreen() {
    if (!this.textOffscreenImage) return;

    const canvas = this.canvas;
    const sourceY = 0;
    const sourceHeight = this.totalHeight + canvas.height;

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

  private drawDirect(interpolatedPosition: number) {
    const ctx = this.ctx;
    const canvas = this.canvas;

    // Clear canvas with background color
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let yPos = Math.round(interpolatedPosition);

    // Draw title lines
    ctx.fillStyle = this.titleColor;
    ctx.font = `bold ${this.titleFontSize}px ${this.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    this.cachedTitleLines.forEach((line) => {
      if (yPos >= -this.titleFontSize && yPos <= canvas.height) {
        ctx.fillText(line, Math.round(canvas.width / 2), yPos);
      }
      yPos += this.titleFontSize + 10;
    });

    yPos += 40;

    // Draw main text
    ctx.fillStyle = this.textColor;
    ctx.font = `${this.contentFontSize}px ${this.font}`;

    this.cachedLines.forEach((line) => {
      if (yPos >= -this.contentFontSize && yPos <= canvas.height) {
        ctx.fillText(line, Math.round(canvas.width / 2), yPos);
      }
      yPos += this.contentFontSize + 8;
    });
  }

  update(timestamp: number) {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return;
    }

    const frameTime = Math.min(0.03, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    this.accumulatedTime += frameTime;

    while (this.accumulatedTime >= this.animationStep) {
      const pixelsToMove = this.speed * 60 * this.animationStep;
      this.targetPosition -= pixelsToMove;
      this.position += (this.targetPosition - this.position) * 0.3;
      this.accumulatedTime -= this.animationStep;
    }

    if (this.position < -this.totalHeight) {
      this.position = this.canvas.height;
      this.targetPosition = this.canvas.height;
    }
  }

  render(timestamp: number) {
    this.update(timestamp);
    if (this.textOffscreenImage) {
      this.drawFromOffscreen();
    } else {
      this.drawDirect(this.position);
    }
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  reset() {
    this.position = this.canvas.height;
    this.targetPosition = this.canvas.height;
    this.lastTimestamp = 0;
    this.accumulatedTime = 0;
  }

  getEstimatedDuration(): number {
    return (this.totalHeight + this.canvas.height) / (this.speed * 60);
  }
}
