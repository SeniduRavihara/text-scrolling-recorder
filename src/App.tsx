import { useEffect, useRef, useState } from "react";

    // Long text to scroll
    const longText = `
     ඩීල් මැරේජ්...

අටවන කොටස..❣

🐞━━━━━━━⸙S💜K⸙━━━━━━━🐞

නෙතූ එහෙමම ආයෙත් ඇදෙ හාන්සි වෙද්දි දනුක වොශ් රූම් ගියෙ ඔෆිස් යන්න ලෑස්ති වෙන්න හිතාගෙන...

" මං ගිහින් එන්නං නෙතූ...ඔයා පරිස්සමට ඉන්න..මොකක් හරි අවශ්‍යතාවයක් උනොත් මට කෝල් එකක් දෙන්න..ඔයාගෙ කෑම ටික මං උඩට එවන්න කියන්නම්...."

................🌼අද එතැන් සිට🌼...............

" සීතම්මේ...නෙතූ ගැන ටිකක් බලන්න...ටිකක් අසනීපයි වගෙ ලු..අද ඔෆිස් යන්නෑ එයා... කෑම ටික උඩට ගිහින් දෙන්න..මහන්සි කරවන්න එපා..එහෙනම් මං ගිහින් එන්නං..."

කුස්සියෙ ඉදපු නිකිනිව සත පහකට ගනන් ගන්නැතුව දනුක යන්න ගියෙ කුරිරු සතුටක් හිතේ රදවගෙන...

" මං ගිහින් නෙතූව බලන්නද සීතම්මෙ?"

සීත කටත් ඇරන් නිකිනි දිහා බැලුවෙ පුදුම වෙලා...

" ඔයාට මෙච්චර රිද්දන අපෙ පොඩි සර් ගැන කිසිම තරහක් නැද්ද නිකිනි බේබි...මෙ කොහෙවත් ඉදන් ආව අනාත කෙල්ලෙක් ගෙ දුක සැප බලන්නෙ මොකටද ඔයා?"

"හ්ම්...අපි කරන දේවල් අපට ලැබෙයි සීතම්මෙ...අනික මේ වෙනකන් නෙතු මට වචනෙකින් වත් රිද්දල නෑ...එයා දන්න්ව එයා කරන්නෙ වැරැද්දක් කියල..එයත් ඉන්නව ඇත්තෙ ධනුකගෙන් බේරෙන්න බැරි කමට...මං මේ දවස් ටිකට තේරුම් ගත්ත එකම දේ තමයි ආදරේ කියන එක බලෙන් ලබාගන්න බෑ කියන එක..ඒත්..මගෙ හිතෙ ඉන්නෙ ධනුක විතරමයි...හිත පිරෙන්නෙ එ සුවදට විතරමයි...මං දන්නෑ ඇයි කියල..ඒත් මට අනිත් අයට වයිර කර කර තවත් පව් කරගහගන්න ඕන නෑ සීතම්මෙ..."

දවස් දෙක තුනට වෙනස් වෙලා මහ ගෑනියෙක් වගේ කතා කරන නිකිනි දිහා සීතා බලන් හිටියෙ කතාකරගන්න දෙයක් නැතුව...

    `;


const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

   const textRef = useRef(null);
   const [renderedText, setRenderedText] = useState("");

     useEffect(() => {
       if (textRef.current) {
         // Get the actual rendered text from the <pre> element
         const formattedText = textRef.current.innerText; // Preserves new lines and wrapped text
         setRenderedText(formattedText);
       }
     }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas to full width and height
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    // Scroll position for the text
    let yPosition = canvas.height;
    const speed = 1.5; // Scroll speed

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
      ctx.fillStyle = "white";
      ctx.font = "bold 22px UN-Baron"; // Use a readable font
      ctx.textAlign = "center"; // Center align text
      ctx.textBaseline = "top"; // Align from the top of each line

      // Split text into lines and center it
      const lines = longText.trim().split("\n");
      const lineHeight = 30;
      const totalTextHeight = lines.length * lineHeight;

      // Start text from the middle
      const startY = yPosition - totalTextHeight / 2;

      lines.forEach((line, index) => {
        ctx.fillText(
          line.trim(),
          canvas.width / 2,
          startY + index * lineHeight
        );
      });

      // Move the text upwards
      yPosition -= speed;

      // Reset if text scrolls out of view
      if (startY + totalTextHeight < 0) {
        yPosition = canvas.height;
      }

      requestAnimationFrame(draw);
    };

    draw(); // Start animation

    // Capture canvas stream
    const stream = canvas.captureStream(30);
    video.srcObject = stream;
    video.play();
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      {/* <canvas
        ref={canvasRef}
        style={{ border: "1px solid black", background: "black" }}
      /> */}
      {/* <video ref={videoRef} width="640" height="360" controls /> */}

      <div
        className="w-[500px] bg-gray-950 text-white p-4 text-center mt-20"
        style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
      >
        <p>{longText}</p>
      </div>

      {/* Button to Show Rendered Text in Console */}
      <button 
        onClick={() => console.log(renderedText)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Show Rendered Text
      </button>

      {/* Display Rendered Text Below */}
      <div className="mt-4 w-[500px] p-4 bg-gray-800 text-white">
        <h3 className="text-lg font-bold mb-2">Extracted Rendered Text:</h3>
        <p>{renderedText}</p>
      </div>
    </div>
  );
};

export default App;
