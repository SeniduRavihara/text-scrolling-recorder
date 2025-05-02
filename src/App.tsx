import { useState } from "react";
import { longText } from "./constants";
import SetupStep from "./components/SetupStep";
import PreviewRecordStep from "./components/PreviewRecordStep";


const App = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("EPISODE IV\nA NEW HOPE");
  const [storyText, setStoryText] = useState(longText);
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");
  const [speed, setSpeed] = useState(1);

  const handleContinueToPreview = () => setCurrentStep(2);
  const handleBackToSetup = () => setCurrentStep(1);

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 min-h-screen text-white w-screen">
      {/* Step indicators */}
      <div className="w-full max-w-3xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center ${
                currentStep >= 1 ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              1
            </div>
            <div className="ml-2">Setup</div>
          </div>

          <div
            className={`h-1 flex-1 mx-4 ${
              currentStep >= 2 ? "bg-blue-600" : "bg-gray-700"
            }`}
          ></div>

          <div className="flex items-center">
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center ${
                currentStep >= 2 ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              2
            </div>
            <div className="ml-2">Preview & Record</div>
          </div>
        </div>
      </div>

      {/* Render appropriate step component */}
      {currentStep === 1 ? (
        <SetupStep
          title={title}
          setTitle={setTitle}
          storyText={storyText}
          setStoryText={setStoryText}
          resolution={resolution}
          setResolution={setResolution}
          speed={speed}
          setSpeed={setSpeed}
          onContinue={handleContinueToPreview}
        />
      ) : (
        <PreviewRecordStep
          title={title}
          storyText={storyText}
          resolution={resolution}
          speed={speed}
          onBackToSetup={handleBackToSetup}
        />
      )}
    </div>
  );
};

export default App;
