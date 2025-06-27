// MIDI and Audio utilities for DJ Booth
export interface MIDIDevice {
  id: string;
  name: string;
  input: MIDIInput;
}

export interface ControlChange {
  channel: number;
  cc: number;
  value: number;
}

export class MidiDispatcher extends EventTarget {
  private access: MIDIAccess | null = null;
  public activeMidiInputId: string | null = null;

  async getMidiAccess(): Promise<string[]> {
    if (this.access) {
      return Array.from(this.access.inputs.keys());
    }

    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
    } catch (error) {
      console.warn('MIDI access not supported.', error);
      return [];
    }

    const inputIds = Array.from(this.access.inputs.keys());

    if (inputIds.length > 0 && this.activeMidiInputId === null) {
      this.activeMidiInputId = inputIds[0];
    }

    for (const input of this.access.inputs.values()) {
      input.onmidimessage = (event: MIDIMessageEvent) => {
        if (input.id !== this.activeMidiInputId) return;

        const { data } = event;
        if (!data) {
          console.error('MIDI message has no data');
          return;
        }

        const statusByte = data[0];
        const channel = statusByte & 0x0f;
        const messageType = statusByte & 0xf0;

        const isControlChange = messageType === 0xb0;
        if (!isControlChange) return;

        const detail: ControlChange = { cc: data[1], value: data[2], channel };
        this.dispatchEvent(
          new CustomEvent<ControlChange>('cc-message', { detail }),
        );
      };
    }

    return inputIds;
  }

  getDeviceName(id: string): string | null {
    if (!this.access) {
      return null;
    }
    const input = this.access.inputs.get(id);
    return input ? input.name : null;
  }
}

export class AudioAnalyser extends EventTarget {
  readonly node: AnalyserNode;
  private readonly freqData: Uint8Array;
  private rafId: number | null = null;

  constructor(context: AudioContext) {
    super();
    this.node = context.createAnalyser();
    this.node.smoothingTimeConstant = 0;
    this.freqData = new Uint8Array(this.node.frequencyBinCount);
    this.loop = this.loop.bind(this);
  }

  getCurrentLevel() {
    this.node.getByteFrequencyData(this.freqData);
    const avg = this.freqData.reduce((a, b) => a + b, 0) / this.freqData.length;
    return avg / 0xff;
  }

  loop() {
    this.rafId = requestAnimationFrame(this.loop);
    const level = this.getCurrentLevel();
    this.dispatchEvent(new CustomEvent('audio-level-changed', { detail: level }));
  }

  start = this.loop;

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Audio encoding/decoding utilities
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const buffer = ctx.createBuffer(
    numChannels,
    data.length / 2 / numChannels,
    sampleRate,
  );

  const dataInt16 = new Int16Array(data.buffer);
  const l = dataInt16.length;
  const dataFloat32 = new Float32Array(l);
  for (let i = 0; i < l; i++) {
    dataFloat32[i] = dataInt16[i] / 32768.0;
  }

  // Extract interleaved channels
  if (numChannels === 1) {
    buffer.copyToChannel(dataFloat32, 0);
  } else {
    for (let i = 0; i < numChannels; i++) {
      const channel = dataFloat32.filter(
        (_, index) => index % numChannels === i,
      );
      buffer.copyToChannel(channel, i);
    }
  }

  return buffer;
}