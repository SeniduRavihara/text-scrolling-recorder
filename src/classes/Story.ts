export class Story {
  private ctx: CanvasRenderingContext2D;
  private story: string;
  private speed: number;
  private y: number;
  private title: string;
  private canvas: HTMLCanvasElement;

  constructor({
    ctx,
    story,
    speed,
    y,
    title,
    canvas,
  }: {
    ctx: CanvasRenderingContext2D;
    story: string;
    speed: number;
    y: number;
    title: string;
    canvas: HTMLCanvasElement;
  }) {
    this.story = story;
    this.speed = speed;
    this.y = y;
    this.title = title;
    this.ctx = ctx;
    this.canvas = canvas;
  }

  draw() {
    console.log(this.title);
    
    // Use this.ctx and this.canvas instead of redeclaring canvas
    const ctx = this.ctx;
    const canvas = this.canvas;
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const lineHeight = 30;
    const maxWidth = canvas.width - 20;

    const wrapText = (text: string, maxWidth: number) => {
      const lines: string[] = [];
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

    const wrappedText = wrapText(this.story, maxWidth);
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
