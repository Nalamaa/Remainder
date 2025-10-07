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

  // ✅ Save medications
  useEffect(() => {
    localStorage.setItem("medications", JSON.stringify(medications));
  }, [medications]);

  // ✅ Load medications
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

  // ✅ Speak function for blind users
  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
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
          // Play alarm sound
          alarm.play().catch((err) => console.log("Autoplay blocked:", err));
          setRinging(true);
          setCurrentMed(med);

          // ✅ Speak medicine name for blind users
          speak(`Time to take your medicine: ${med.name}`);

          // ✅ Vibrate on mobile devices
          if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500]);
          }

          // Mark triggered
          setMedications((prev) =>
            prev.map((m) =>
              m.id === med.id ? { ...m, triggered: true } : m
            )
          );
        }
      });
    }, 1000); // check every second

    return () => clearInterval(checkReminders);
  }, [medications]);

  // ✅ Add medicine
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

  // ✅ Stop alarm
  const stopAlarm = () => {
    alarm.pause();
    alarm.currentTime = 0;
    setRinging(false);
    setCurrentMed(null);

    // ✅ Announce alarm stopped
    speak("Alarm stopped");
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

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
            aria-label="Enter medicine name"
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
            aria-label="Select time for medicine"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          {/* Weekday checkboxes */}
          <div
            style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
            aria-label="Select days of the week"
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <label key={d} style={{ fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={days.includes(d)}
                  onChange={() => toggleDay(d)}
                  aria-label={`Select ${d}`}
                />
                {d}
              </label>
            ))}
          </div>

          <button
            type="submit"
            aria-label="Add medicine reminder"
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

        {/* List */}
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
                aria-label={`Reminder: ${med.name} at ${med.time} on ${med.days.join(", ")}`}
              >
                <span>
                  <strong>{med.name}</strong> at {med.time} <br />
                  <small style={{ color: "#666" }}>{med.days.join(", ")}</small>
                </span>
                <button
                  onClick={() => deleteMedication(med.id)}
                  aria-label={`Delete reminder for ${med.name}`}
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

      {/* ✅ Modal Popup */}
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
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
              maxWidth: "400px",
            }}
            role="alert"
            aria-live="assertive"
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
              aria-label="Stop alarm"
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
