/**
 * WebRTC Connection utility for voice assistant testing
 * Based on the working_dashboard.html implementation
 */

export interface WebRTCConfig {
  serverUrl: string;
  assistantId?: string;
  turnHost?: string;
  turnUsername?: string;
  turnPassword?: string;
}

export interface TranscriptMessage {
  type: 'transcript';
  role: 'user' | 'assistant';
  text: string;
}

export interface UserSpeakingMessage {
  type: 'user-speaking';
  speaking: boolean;
}

export interface WebRTCEventHandlers {
  onConnectionStateChange?: (state: string) => void;
  onIceConnectionStateChange?: (state: string) => void;
  onIceGatheringStateChange?: (state: string) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (stream: MediaStream) => void;
  onDataChannelOpen?: () => void;
  onDataChannelClose?: () => void;
  onDataChannelError?: (error: Event) => void;
  onDataChannelMessage?: (message: string) => void;
  onTranscript?: (transcript: TranscriptMessage) => void;
  onUserSpeaking?: (speaking: boolean) => void;
  onLog?: (message: string) => void;
  onError?: (error: Error) => void;
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private sendQueue: string[] = [];
  private isConnected = false;
  private config: WebRTCConfig;
  private eventHandlers: WebRTCEventHandlers;

  constructor(config: WebRTCConfig, eventHandlers: WebRTCEventHandlers = {}) {
    this.config = config;
    this.eventHandlers = eventHandlers;
  }

  /**
   * Build ICE servers configuration
   */
  private buildIceServers() {
    const TURN_HOST = this.config.turnHost || "13.204.190.15";
    const TURN_USERNAME = this.config.turnUsername || "botuser";
    const TURN_PASSWORD = this.config.turnPassword || "supersecret";

    const stun = [{ urls: ["stun:stun.l.google.com:19302"] }];

    return [
      ...stun,
      {
        urls: [
          `turn:${TURN_HOST}:3478?transport=udp`,
          `turn:${TURN_HOST}:3478?transport=tcp`
        ],
        username: TURN_USERNAME,
        credential: TURN_PASSWORD,
      },
    ];
  }

  /**
   * Log messages with timestamp
   */
  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    this.eventHandlers.onLog?.(logMessage);
  }

  /**
   * Send data through the data channel
   */
  private safeSend(obj: any) {
    const msg = typeof obj === "string" ? obj : JSON.stringify(obj);
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(msg);
    } else {
      this.sendQueue.push(msg);
    }
  }

  /**
   * Start the WebRTC connection
   */
  async startCall(): Promise<void> {
    try {
      this.log('Starting WebRTC connection...');

      // Get microphone access
      this.log('Requesting microphone access...');
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.log('✅ Microphone access granted');

      // Create peer connection with deterministic TURN configuration
      const iceServers = this.buildIceServers();
      this.peerConnection = new RTCPeerConnection({
        iceServers: iceServers,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Create data channel with send queue
      this.dataChannel = this.peerConnection.createDataChannel("app", {
        negotiated: true,
        id: 0
      });

      this.dataChannel.onopen = () => {
        this.log('✅ Data channel opened');
        // Send queued messages
        while (this.sendQueue.length > 0) {
          const msg = this.sendQueue.shift();
          if (msg) this.dataChannel!.send(msg);
        }
        this.eventHandlers.onDataChannelOpen?.();
      };

      this.dataChannel.onclose = () => {
        this.log('Data channel closed');
        this.eventHandlers.onDataChannelClose?.();
      };

      this.dataChannel.onerror = (error) => {
        this.log(`Data channel error: ${error}`);
        this.eventHandlers.onDataChannelError?.(error);
      };

      this.dataChannel.onmessage = (event) => {
        // Always call the raw message handler
        this.eventHandlers.onDataChannelMessage?.(event.data);
        
        // Try to parse and handle structured messages
        try {
          const data = JSON.parse(event.data);
          
          // Handle transcript messages
          if (data.type === 'transcript' && data.text) {
            this.eventHandlers.onTranscript?.({
              type: 'transcript',
              role: data.role || 'assistant',
              text: data.text
            });
          }
          
          // Handle user-speaking events (VAD - Voice Activity Detection)
          else if (data.type === 'user-speaking') {
            this.eventHandlers.onUserSpeaking?.(data.speaking);
          }
        } catch (e) {
          // Not JSON or malformed - ignore and let raw handler deal with it
          console.debug('Non-JSON data channel message:', event.data);
        }
      };

      // Handle incoming audio
      this.peerConnection.ontrack = (event) => {
        this.log('✅ Received audio stream from bot');
        const stream = event.streams[0];
        this.eventHandlers.onTrack?.(stream);
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection!.connectionState;
        this.log(`Connection state: ${state}`);
        this.eventHandlers.onConnectionStateChange?.(state);
        
        if (state === 'connected') {
          this.isConnected = true;
          this.log('🎉 Successfully connected to bot!');
        } else if (state === 'disconnected' || state === 'failed') {
          this.log(`❌ Connection failed: ${state}`);
          this.log('VNet troubleshooting:');
          this.log('1. Check if both servers can reach each other on port 7860');
          this.log('2. Verify no firewall blocking WebRTC ports (UDP 1024-65535)');
          this.log('3. Try using internal IP addresses instead of external ones');
          this.log('4. Check if STUN/TURN servers are accessible from your VNet');
          this.endCall();
        }
      };

      // Handle ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection!.iceConnectionState;
        this.log(`ICE connection state: ${state}`);
        this.eventHandlers.onIceConnectionStateChange?.(state);
        
        if (state === 'failed') {
          this.log('❌ ICE connection failed - this usually means network/firewall issues');
        }
      };

      // Handle ICE gathering state
      this.peerConnection.onicegatheringstatechange = () => {
        const state = this.peerConnection!.iceGatheringState;
        this.log(`ICE gathering state: ${state}`);
        this.eventHandlers.onIceGatheringStateChange?.(state);
      };

      // Handle ICE candidates for debugging
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.log(`ICE candidate: ${event.candidate.candidate} (${event.candidate.type})`);
          this.eventHandlers.onIceCandidate?.(event.candidate);
        } else {
          this.log('ICE gathering complete');
        }
      };

      // Create offer
      this.log('Creating WebRTC offer...');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer to bot server
      this.log(`Sending offer to: ${this.config.serverUrl}/api/offer`);
      const response = await fetch(`${this.config.serverUrl}/api/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
          assistant_id: this.config.assistantId || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const answer = await response.json();
      this.log('✅ Received answer from bot server');

      // Set remote description
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`❌ Failed to start call: ${errorMessage}`);
      this.eventHandlers.onError?.(error instanceof Error ? error : new Error(errorMessage));
      await this.cleanup();
      throw error;
    }
  }

  /**
   * End the WebRTC connection
   */
  async endCall(): Promise<void> {
    this.log('Ending call...');
    await this.cleanup();
  }

  /**
   * Send a message through the data channel
   */
  sendMessage(message: any): void {
    this.safeSend(message);
  }

  /**
   * Check if the connection is active
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the local audio stream
   */
  get localAudioStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Mute or unmute the local microphone
   */
  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      this.log(muted ? '🔇 Microphone muted' : '🎤 Microphone unmuted');
    }
  }

  /**
   * Clean up resources
   */
  private async cleanup(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear send queue
    this.sendQueue = [];

    this.isConnected = false;
  }
}
