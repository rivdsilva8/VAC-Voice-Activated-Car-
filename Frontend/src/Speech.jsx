import { useState, useEffect, useRef } from "react";
import { ReactMediaRecorder } from "react-media-recorder";
import { Socket } from "./Socket";
const Speech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [keyword, setKeyword] = useState("blackbird");
  const [newKeyword, setNewKeyword] = useState("");
  const [transcript, setTranscript] = useState([]); 
  const recognitionRef = useRef(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const isRecognitionActive = useRef(false);
  const lastRecognizedKeyword = useRef(""); 
  const lastResultTimestamp = useRef(Date.now()); 
  const lastHeard = useRef(""); 
  const silenceTimer = useRef(null); 
  const [hasMounted, setHasMounted] = useState(false);
  const startAudioRef = useRef(new Audio("/yellowNotification.wav"));
  // const stopAudioRef = useRef(new Audio("/rednotification.wav"));

  // Effect to set hasMounted to true after the first render
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Effect to play sound when isListening changes
  useEffect(() => {
    if (hasMounted) {
      if (isListening === true) {
        // startAudioRef.current.play().catch((error) => {
        //   console.error("Error playing sound:", error);
        // });
      }
    }
  }, [isListening, hasMounted]);

  const toggleShowTranscript = () => {
    setShowTranscript((prevShow) => !prevShow); 
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Continuous listening
      recognitionRef.current.interimResults = true; // Allow interim results
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const lastResult = event.results[event.resultIndex][0].transcript
          .trim()
          .toLowerCase();
        console.log("Heard:", lastResult);

        // Check if the last result includes the keyword
        if (lastResult.includes(keyword)) {
          lastRecognizedKeyword.current = lastResult; // Update last recognized keyword

          if (!isRecording) {
            // Start audio recording if keyword is detected
            startAudioRecording();
          }

          // Clear the previous timer
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
          }

          // Set a new timer to add the last heard sentence after 2 seconds of silence
          silenceTimer.current = setTimeout(() => {
            setTranscript((prevTranscript) => {
              const lastTranscript = prevTranscript[prevTranscript.length - 1];
              const timeSinceLastEntry =
                Date.now() - lastResultTimestamp.current;

              // Allow duplicates after 2 seconds
              if (
                (lastTranscript !== lastHeard.current ||
                  timeSinceLastEntry >= 2000) &&
                lastHeard.current !== ""
              ) {
                lastResultTimestamp.current = Date.now(); // Update timestamp when adding a new entry
                return [...prevTranscript, lastHeard.current];
              }

              return prevTranscript; // Don't add if it's a duplicate within 2 seconds
            });
            lastHeard.current = ""; // Clear last heard sentence after adding it
          }, 1000); // 1 seconds
        }

        // Update the last heard sentence regardless, in case we want to handle it later
        lastHeard.current = lastResult;
      };
      recognitionRef.current.onend = () => {
        isRecognitionActive.current = false; // Reset recognition state
        // Restart recognition when it ends, only if we want it to listen
        if (isListening) {
          recognitionRef.current.start();
          isRecognitionActive.current = true; // Set it to active again
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Error occurred in speech recognition: ", event.error);
      };
    }
  }, [keyword]); // run when keyword is changed

  const handleToggleListening = () => {
    if (recognitionRef?.current) {
      // Check if initialized
      if (isListening) {
        recognitionRef.current.stop();
        isRecognitionActive.current = false; // Reset on stop
        setIsListening(false);
        console.log("Stopped listening.");
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current); // Clear the timer when stopping
        }
      } else {
        if (!isRecognitionActive.current) {
          recognitionRef.current.start();
          isRecognitionActive.current = true; // Set to active when starting
          setIsListening(true);
          console.log("Started listening for keyword...");
        }
      }
    } else {
      console.error("Speech recognition is not initialized.");
    }
  };

  const handleChangeKeyword = (event) => {
    event.preventDefault(); 
    if (newKeyword.trim() !== "") {
      setKeyword(newKeyword.trim()); 
      setNewKeyword(""); 
      console.log("Keyword changed to:", newKeyword);
    }
  };
  const startAudioRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      console.log("Started recording audio.");
    }
  };

  const stopAudioRecording = (stopRecording) => {
    if (isRecording) {
      stopRecording(); 
      setIsRecording(false);
      console.log("Stopped recording audio.");
    }
  };

  return (
    <div className="p-2 = flex">
      <div className="flex flex-col justify-center items-left p-5 m-2 h-1/2   bg-zinc-500 rounded-md w-1/2">
        <div className="flex items-left gap-x-2">
          <div className=" w-2/3">
            <h1 className="text-4xl text-black">Voice Control</h1>
            <h1 className="text-4xl text-black">
              Current Keyword:{" "}
              <span className="text-yellow-400">{keyword} </span>{" "}
            </h1>
            <h2 className="text-xl text-wrap w-2/3 ">
              say <span className="text-yellow-400 ">{keyword} </span> in a
              sentence to start sending commands,
              <div>
                example: <span className="text-yellow-400">{keyword} </span>{" "}
                move north
              </div>
            </h2>
          </div>
          <div className=" p-2 w-1/3 flex flex-col">
            <h1 className="text-xl">Change Keyword</h1>
            <form onSubmit={handleChangeKeyword}>
              <input
                type="text"
                value={newKeyword} 
                onChange={(e) => setNewKeyword(e.target.value)} 
                className="p-2 rounded-s-md text-black"
                placeholder="Change Keyword"
              />
              <button type="submit" className="p-2 bg-yellow-400 rounded-r-md">
                Submit
              </button>
            </form>
            <span className="bg-red-500 my-2 p-2">
              note: do NOT change keyword once you have started listening
            </span>
          </div>
        </div>

        <div className="flex flex-row pt-10">
          <button
            className={`transition duration-300 p-2 rounded-md ${
              isListening
                ? "  strobe text-black bg-yellow-500"
                : "bg-stone-600 text-white"
            }`}
            onClick={handleToggleListening}
          >
            {isListening
              ? "Currently Listening,Click to Stop listening"
              : "Start listening"}
          </button>
        </div>
        <div className="pt-5">
          <h2 className="text-2xl">Commands:</h2>
          <div className="text-lg">
            {transcript.length > 0 ? (
              <ol className="list-decimal pl-5">
                {transcript.map((sentence, index) => (
                  <li key={index}>{sentence.trim()}</li>
                ))}
              </ol>
            ) : (
              "Waiting for speech..."
            )}
          </div>
        </div>
      </div>
      <div className="p-5 bg-zinc-500 rounded-md m-2 w-1/4  h-fit">
        <h2 className="text-4xl">
          Command Array{" "}
          {transcript.length > 0 ? "(" + transcript.length + ")" : ""}:
        </h2>
        <button
          onClick={toggleShowTranscript}
          className="mt-2 p-2 bg-green-500 text-white rounded "
        >
          {showTranscript ? "Hide Commands" : "Show Commands"}
        </button>
        {showTranscript && (
          <div className="text-lg">
            {transcript.length > 0 ? (
              <p>
                [
                {transcript.map((sentence, index) => (
                  <span key={index}>
                    "{sentence.trim()}"
                    {index < transcript.length - 1 ? ", " : ""}
                  </span>
                ))}
                ]
              </p>
            ) : (
              "[]"
            )}
          </div>
        )}
      </div>

      <ReactMediaRecorder
        audio
        render={({ stopRecording, mediaBlobUrl, startRecording }) => (
          <div>
            <button
              onClick={() => stopAudioRecording(stopRecording)}
              disabled={!isRecording}
              className={`mt-4 p-2 rounded-md hidden ${
                isRecording
                  ? "bg-red-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {isRecording ? "Stop Recording" : "Recording Stopped"}
            </button>
            {mediaBlobUrl && (
              <div>
                <audio src={mediaBlobUrl} controls />
              </div>
            )}
          </div>
        )}
      />
      <Socket transcript={transcript} />
    </div>
  );
};

export default Speech;
