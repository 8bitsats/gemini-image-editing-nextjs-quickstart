"use client";

import { useState } from "react";
import { ElevenLabsVoiceWidget, VoiceWidgetToggle } from "./ElevenLabsVoiceWidget";

export function VoiceWidgetManager() {
  const [showWidget, setShowWidget] = useState(true);

  return (
    <>
      {showWidget ? (
        <ElevenLabsVoiceWidget />
      ) : (
        <VoiceWidgetToggle onShow={() => setShowWidget(true)} />
      )}
    </>
  );
}