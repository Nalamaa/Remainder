import React, { useState, useEffect } from "react";

// ✅ Place "alarm.mp3" inside public/ folder
const alarm = new Audio("/alarm.mp3");
alarm.loop = true;

export default function App() {
  const [medications, setMedications] = useState([]);
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState([]);
  const [ringing, setRinging] = useState(false);
  const [currentMed, setCurrentMed] = useState(null);
  const [speaking, setSpeaking] = useState(false); // ✅ Track speaking status

  // ✅ Speak function
  const speak = (text) => {
    stopSpeaking(); // stop any previous speech
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
    setSpeaking(true);

    utter.onend = () => setSpeaking(false);
  };

  // ✅ Stop speaking function
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // ✅ Save to localStorage
  useEffect(() => {
    localStorage.setItem("medications", JSON.stringify(medications));
  }, [medications]);

  // ✅ Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("medications");
    if (saved) setMedications(JSON.parse(saved));
  }, []);

  // ✅ Toggle weekday selection
  const toggleDay = (day) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // ✅ Add new medicine
  const addMedication = (e) => {
    e.preventDefault();
    if (!name || !time || days.length === 0) return;
    setMedications([
      ...medications,
      { id: Date.now(), name, time, days, triggered: false },
    ]);
    setName("");
    setTime("");
    setDays([]);
  };

  // ✅ Delete medicine
  const deleteMedication = (id) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  // ✅ Reminder checker
  useEffect(() => {
    const checkReminders = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        now.getDay()
      ];

      medications.forEach((med) => {
        if (
          med.time === currentTime &&
          med.days.includes(currentDay) &&
          !med.triggered
        ) {
          alarm.play().catch((err) => console.log("Autoplay blocked:", err));
          setRinging(true);
          setCurrentMed(med);

          speak(`Time to take your medicine: ${med.name}`);

          if (navigator.vibrate) navigator.vibrate([500, 200, 500]);

          setMedications((prev) =>
            prev.map((m) =>
              m.id === med.id ? { ...m, triggered: true } : m
            )
          );
        }
      });
    }, 1000);

    return () => clearInterval(checkReminders);
  }, [medications]);

  // ✅ Stop alarm
  const stopAlarm = () => {
    alarm.pause();
    alarm.currentTime = 0;
    setRinging(false);
    setCurrentMed(null);
    speak("Alarm stopped");
    if (navigator.vibrate) navigator.vibrate(200);
  };

  // ✅ Voice summary (Feature #10)
  const speakDailySummary = () => {
    const today = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      new Date().getDay()
    ];
    const todayMeds = medications.filter((m) => m.days.includes(today));

    if (todayMeds.length === 0) {
      speak("Good morning! You have no medicines scheduled for today.");
      return;
    }

    let message = `Good morning! You have ${todayMeds.length} medicines today. `;
    todayMeds.forEach((m) => {
      const [hour, minute] = m.time.split(":");
      const hr = parseInt(hour);
      const period = hr >= 12 ? "PM" : "AM";
      const formattedTime = `${hr % 12 || 12}:${minute} ${period}`;
      message += `${m.name} at ${formattedTime}. `;
    });

    speak(message);
  };

  // ✅ Optional automatic summary at 8:00 AM
  useEffect(() => {
    const autoSpeak = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 8 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        speakDailySummary();
      }
    }, 1000);
    return () => clearInterval(autoSpeak);
  }, [medications]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "url('https://img.freepik.com/free-vector/hand-drawn-medical-background_23-2151338600.jpg?semt=ais_hybrid&w=740&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "20px",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          💊 Medication Reminder
        </h1>

        {/* ✅ Voice Summary Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={speakDailySummary}
            style={{
              background: "#28a745",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            🔊 Speak Today’s Summary
          </button>

          <button
            onClick={stopSpeaking}
            disabled={!speaking}
            style={{
              background: speaking ? "red" : "#ccc",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "8px",
              cursor: speaking ? "pointer" : "not-allowed",
              flex: 1,
            }}
          >
            🛑 Stop Voice Summary
          </button>
        </div>

        {/* Add Form */}
        <form
          onSubmit={addMedication}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <input
            type="text"
            placeholder="Medicine Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <label key={d}>
                <input
                  type="checkbox"
                  checked={days.includes(d)}
                  onChange={() => toggleDay(d)}
                />
                {d}
              </label>
            ))}
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 15px",
              borderRadius: "8px",
              border: "none",
              background: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </form>

        {/* List of Medications */}
        {medications.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            No medications added yet.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {medications.map((med) => (
              <li
                key={med.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px",
                  marginBottom: "10px",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <span>
                  <strong>{med.name}</strong> at {med.time} <br />
                  <small style={{ color: "#666" }}>{med.days.join(", ")}</small>
                </span>
                <button
                  onClick={() => deleteMedication(med.id)}
                  style={{
                    border: "none",
                    background: "red",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Alarm Popup */}
      {ringing && currentMed && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            <h2>⏰ Reminder</h2>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>
              Time to take your medicine: <br />
              <span style={{ color: "red" }}>{currentMed.name}</span>
            </p>
            <p style={{ fontSize: "14px", color: "#666" }}>
              ({currentMed.days.join(", ")})
            </p>
            <button
              onClick={stopAlarm}
              style={{
                marginTop: "15px",
                background: "red",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Stop Alarm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
