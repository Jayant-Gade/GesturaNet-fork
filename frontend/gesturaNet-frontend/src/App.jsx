import React, { useEffect, useState } from 'react';
import useGestureSocket from './hooks/useGestureSocket';
import SurgicalDashboard from './pages/SurgicalDashboard';

export default function App() {
  const WS_URL = 'ws://localhost:5000/ws'; // Connect to dynamic host
  const { state, log, sendCommand } = useGestureSocket(WS_URL);

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <SurgicalDashboard
        state={state}
        log={log}
        sendCommand={sendCommand}
      />
    </div>
  );
}