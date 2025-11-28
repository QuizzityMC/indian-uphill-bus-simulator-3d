/**
 * Multiplayer System for Indian Uphill Bus Simulator 3D
 * 
 * This module provides peer-to-peer multiplayer functionality using WebRTC.
 * Players can create or join rooms to play together.
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    MAX_PLAYERS_PER_ROOM: 8,
    PLAYER_COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
    SYNC_INTERVAL_MS: 100,
    HEARTBEAT_INTERVAL_MS: 5000,
    ROOM_CODE_LENGTH: 6,
    ICE_SERVERS: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // Generate a random room code
  function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < CONFIG.ROOM_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Generate a random player ID
  function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substring(2, 11);
  }

  // Get or create player name
  function getPlayerName() {
    let name = localStorage.getItem('multiplayerPlayerName');
    if (!name) {
      name = 'Player_' + Math.floor(Math.random() * 10000);
      localStorage.setItem('multiplayerPlayerName', name);
    }
    return name;
  }

  /**
   * MultiplayerManager - Main class for managing multiplayer functionality
   */
  class MultiplayerManager {
    constructor() {
      this.playerId = generatePlayerId();
      this.playerName = getPlayerName();
      this.playerColor = CONFIG.PLAYER_COLORS[Math.floor(Math.random() * CONFIG.PLAYER_COLORS.length)];
      this.roomCode = null;
      this.isHost = false;
      this.peers = new Map(); // peerId -> { connection, dataChannel, playerInfo }
      this.players = new Map(); // playerId -> playerInfo
      this.messageHandlers = new Map();
      this.ui = null;
      this.localOffer = null;
      this.localAnswer = null;
      
      // Add self to players
      this.players.set(this.playerId, {
        id: this.playerId,
        name: this.playerName,
        color: this.playerColor,
        isHost: false,
        lastSeen: Date.now()
      });

      this.initUI();
      this.setupMessageHandlers();
    }

    /**
     * Initialize the multiplayer UI
     */
    initUI() {
      this.ui = new MultiplayerUI(this);
      this.ui.render();
    }

    /**
     * Setup message handlers for peer communication
     */
    setupMessageHandlers() {
      this.messageHandlers.set('chat', (peerId, data) => {
        this.ui.addChatMessage(data.playerName, data.message, data.color);
      });

      this.messageHandlers.set('playerInfo', (peerId, data) => {
        this.players.set(data.playerId, {
          id: data.playerId,
          name: data.playerName,
          color: data.color,
          isHost: data.isHost,
          lastSeen: Date.now()
        });
        this.ui.updatePlayerList();
      });

      this.messageHandlers.set('playerLeft', (peerId, data) => {
        this.players.delete(data.playerId);
        this.ui.updatePlayerList();
        this.ui.addSystemMessage(`${data.playerName} left the game`);
      });

      this.messageHandlers.set('gameState', (peerId, data) => {
        // Handle game state synchronization
        // This can be extended to sync bus positions, scores, etc.
        this.handleGameStateUpdate(data);
      });

      this.messageHandlers.set('ping', (peerId, data) => {
        this.sendToPeer(peerId, { type: 'pong', timestamp: data.timestamp });
      });
    }

    /**
     * Create a new multiplayer room
     */
    async createRoom() {
      this.roomCode = generateRoomCode();
      this.isHost = true;
      this.players.get(this.playerId).isHost = true;
      
      this.ui.showRoomView(this.roomCode);
      this.ui.addSystemMessage(`Room created! Share code: ${this.roomCode}`);
      this.ui.updatePlayerList();

      // Create offer for potential peers
      await this.createOffer();
      
      return this.roomCode;
    }

    /**
     * Create a WebRTC offer
     */
    async createOffer() {
      const peerConnection = new RTCPeerConnection({ iceServers: CONFIG.ICE_SERVERS });
      
      // Create data channel
      const dataChannel = peerConnection.createDataChannel('gameData', {
        ordered: false,
        maxRetransmits: 0
      });

      this.setupDataChannel(dataChannel, 'pending');

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate) {
          // ICE gathering complete
          this.localOffer = peerConnection.localDescription.sdp;
          this.ui.showConnectionInfo(this.localOffer, true);
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      this.pendingConnection = peerConnection;
      return offer;
    }

    /**
     * Join a room using the host's offer
     */
    async joinWithOffer(offerSdp) {
      const peerConnection = new RTCPeerConnection({ iceServers: CONFIG.ICE_SERVERS });

      peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, 'host');
      };

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate) {
          // ICE gathering complete
          this.localAnswer = peerConnection.localDescription.sdp;
          this.ui.showConnectionInfo(this.localAnswer, false);
        }
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: offerSdp
      }));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.pendingConnection = peerConnection;
    }

    /**
     * Complete connection using the peer's answer
     */
    async completeConnection(answerSdp) {
      if (!this.pendingConnection) {
        console.error('No pending connection');
        return;
      }

      await this.pendingConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp
      }));
    }

    /**
     * Setup data channel event handlers
     */
    setupDataChannel(dataChannel, peerId) {
      dataChannel.onopen = () => {
        console.log('[Multiplayer] Data channel opened with:', peerId);
        
        // Store the connection
        this.peers.set(peerId, {
          connection: this.pendingConnection,
          dataChannel: dataChannel
        });

        // Send our player info
        this.sendToPeer(peerId, {
          type: 'playerInfo',
          playerId: this.playerId,
          playerName: this.playerName,
          color: this.playerColor,
          isHost: this.isHost
        });

        this.ui.addSystemMessage('Connected to peer!');
        this.ui.updatePlayerList();
        this.pendingConnection = null;
      };

      dataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(peerId, data);
        } catch (e) {
          console.error('[Multiplayer] Error parsing message:', e);
        }
      };

      dataChannel.onclose = () => {
        console.log('[Multiplayer] Data channel closed:', peerId);
        const peer = this.peers.get(peerId);
        if (peer) {
          this.peers.delete(peerId);
          // Find and remove the player associated with this peer
          for (const [playerId, player] of this.players) {
            if (playerId !== this.playerId) {
              this.players.delete(playerId);
              this.ui.addSystemMessage(`${player.name} disconnected`);
              break;
            }
          }
          this.ui.updatePlayerList();
        }
      };

      dataChannel.onerror = (error) => {
        console.error('[Multiplayer] Data channel error:', error);
      };
    }

    /**
     * Handle incoming message from peer
     */
    handleMessage(peerId, data) {
      const handler = this.messageHandlers.get(data.type);
      if (handler) {
        handler(peerId, data);
      } else {
        console.log('[Multiplayer] Unknown message type:', data.type);
      }
    }

    /**
     * Send message to a specific peer
     */
    sendToPeer(peerId, data) {
      const peer = this.peers.get(peerId);
      if (peer && peer.dataChannel && peer.dataChannel.readyState === 'open') {
        peer.dataChannel.send(JSON.stringify(data));
      }
    }

    /**
     * Broadcast message to all peers
     */
    broadcast(data) {
      for (const [peerId, peer] of this.peers) {
        if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
          peer.dataChannel.send(JSON.stringify(data));
        }
      }
    }

    /**
     * Send chat message
     */
    sendChatMessage(message) {
      if (!message.trim()) return;

      // Add to local chat
      this.ui.addChatMessage(this.playerName, message, this.playerColor, true);

      // Broadcast to peers
      this.broadcast({
        type: 'chat',
        playerName: this.playerName,
        message: message,
        color: this.playerColor
      });
    }

    /**
     * Update player name
     */
    setPlayerName(name) {
      this.playerName = name;
      localStorage.setItem('multiplayerPlayerName', name);
      this.players.get(this.playerId).name = name;
      
      // Notify peers
      this.broadcast({
        type: 'playerInfo',
        playerId: this.playerId,
        playerName: this.playerName,
        color: this.playerColor,
        isHost: this.isHost
      });
      
      this.ui.updatePlayerList();
    }

    /**
     * Handle game state update from peer
     */
    handleGameStateUpdate(data) {
      // This can be extended to handle position synchronization
      // For now, we just log it
      console.log('[Multiplayer] Game state update:', data);
    }

    /**
     * Leave the current room
     */
    leaveRoom() {
      // Notify peers
      this.broadcast({
        type: 'playerLeft',
        playerId: this.playerId,
        playerName: this.playerName
      });

      // Close all peer connections
      for (const [peerId, peer] of this.peers) {
        if (peer.dataChannel) {
          peer.dataChannel.close();
        }
        if (peer.connection) {
          peer.connection.close();
        }
      }

      this.peers.clear();
      this.roomCode = null;
      this.isHost = false;
      this.players.clear();
      
      // Re-add self
      this.players.set(this.playerId, {
        id: this.playerId,
        name: this.playerName,
        color: this.playerColor,
        isHost: false,
        lastSeen: Date.now()
      });

      this.ui.showLobbyView();
    }

    /**
     * Get list of connected players
     */
    getPlayers() {
      return Array.from(this.players.values());
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
      return {
        isConnected: this.peers.size > 0,
        peerCount: this.peers.size,
        roomCode: this.roomCode,
        isHost: this.isHost
      };
    }
  }

  /**
   * MultiplayerUI - Handles all UI rendering and interactions
   */
  class MultiplayerUI {
    constructor(manager) {
      this.manager = manager;
      this.container = null;
      this.isMinimized = false;
      this.currentView = 'lobby'; // 'lobby', 'room', 'join', 'connect'
    }

    /**
     * Create and render the multiplayer UI
     */
    render() {
      // Create container
      this.container = document.createElement('div');
      this.container.id = 'multiplayer-panel';
      this.container.innerHTML = this.getLobbyHTML();
      document.body.appendChild(this.container);

      // Add styles
      this.addStyles();

      // Setup event listeners
      this.setupEventListeners();
    }

    /**
     * Add CSS styles for the multiplayer UI
     */
    addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        #multiplayer-panel {
          position: fixed;
          top: 10px;
          right: 10px;
          width: 320px;
          background: rgba(30, 30, 30, 0.95);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          z-index: 10000;
          color: #fff;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        #multiplayer-panel.minimized {
          width: 180px;
        }

        #multiplayer-panel.minimized .mp-content {
          display: none;
        }

        .mp-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }

        .mp-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mp-header h3::before {
          content: '🎮';
        }

        .mp-toggle {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mp-toggle:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .mp-content {
          padding: 16px;
        }

        .mp-section {
          margin-bottom: 16px;
        }

        .mp-section-title {
          font-size: 11px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .mp-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #444;
          border-radius: 6px;
          background: #2a2a2a;
          color: #fff;
          font-size: 13px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .mp-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .mp-input::placeholder {
          color: #666;
        }

        .mp-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 8px;
        }

        .mp-btn:last-child {
          margin-bottom: 0;
        }

        .mp-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .mp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .mp-btn-secondary {
          background: #3a3a3a;
          color: #fff;
        }

        .mp-btn-secondary:hover {
          background: #444;
        }

        .mp-btn-danger {
          background: #dc3545;
          color: white;
        }

        .mp-btn-danger:hover {
          background: #c82333;
        }

        .mp-btn-small {
          padding: 8px 12px;
          font-size: 12px;
          width: auto;
        }

        .mp-room-code {
          background: #2a2a2a;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 16px;
        }

        .mp-room-code-label {
          font-size: 11px;
          color: #888;
          margin-bottom: 4px;
        }

        .mp-room-code-value {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 4px;
          color: #667eea;
        }

        .mp-player-list {
          max-height: 150px;
          overflow-y: auto;
        }

        .mp-player-item {
          display: flex;
          align-items: center;
          padding: 8px;
          background: #2a2a2a;
          border-radius: 6px;
          margin-bottom: 6px;
        }

        .mp-player-item:last-child {
          margin-bottom: 0;
        }

        .mp-player-color {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 10px;
        }

        .mp-player-name {
          flex: 1;
          font-size: 13px;
        }

        .mp-player-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #667eea;
          margin-left: 8px;
        }

        .mp-chat-container {
          background: #2a2a2a;
          border-radius: 8px;
          overflow: hidden;
        }

        .mp-chat-messages {
          height: 120px;
          overflow-y: auto;
          padding: 10px;
        }

        .mp-chat-message {
          margin-bottom: 8px;
          font-size: 12px;
          line-height: 1.4;
        }

        .mp-chat-message:last-child {
          margin-bottom: 0;
        }

        .mp-chat-message-name {
          font-weight: 600;
        }

        .mp-chat-message-text {
          color: #ccc;
        }

        .mp-chat-message-system {
          color: #888;
          font-style: italic;
          text-align: center;
        }

        .mp-chat-input-container {
          display: flex;
          border-top: 1px solid #444;
        }

        .mp-chat-input {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: #fff;
          font-size: 12px;
        }

        .mp-chat-input:focus {
          outline: none;
        }

        .mp-chat-send {
          padding: 10px 16px;
          background: #667eea;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 12px;
        }

        .mp-chat-send:hover {
          background: #764ba2;
        }

        .mp-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #888;
          margin-bottom: 12px;
        }

        .mp-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #dc3545;
        }

        .mp-status-dot.connected {
          background: #28a745;
        }

        .mp-textarea {
          width: 100%;
          height: 80px;
          padding: 10px;
          border: 1px solid #444;
          border-radius: 6px;
          background: #2a2a2a;
          color: #fff;
          font-size: 11px;
          font-family: monospace;
          resize: vertical;
          box-sizing: border-box;
        }

        .mp-textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .mp-help-text {
          font-size: 11px;
          color: #888;
          margin-top: 8px;
          line-height: 1.4;
        }

        .mp-divider {
          height: 1px;
          background: #444;
          margin: 16px 0;
        }

        .mp-btn-group {
          display: flex;
          gap: 8px;
        }

        .mp-btn-group .mp-btn {
          flex: 1;
        }
      `;
      document.head.appendChild(style);
    }

    /**
     * Get lobby view HTML
     */
    getLobbyHTML() {
      return `
        <div class="mp-header" id="mp-header">
          <h3>Multiplayer</h3>
          <button class="mp-toggle" id="mp-toggle">−</button>
        </div>
        <div class="mp-content">
          <div class="mp-section">
            <div class="mp-section-title">Your Name</div>
            <input type="text" class="mp-input" id="mp-player-name" value="${this.manager.playerName}" placeholder="Enter your name">
          </div>
          
          <div class="mp-section">
            <div class="mp-section-title">Create Game</div>
            <button class="mp-btn mp-btn-primary" id="mp-create-room">Create Room</button>
          </div>
          
          <div class="mp-divider"></div>
          
          <div class="mp-section">
            <div class="mp-section-title">Join Game</div>
            <button class="mp-btn mp-btn-secondary" id="mp-join-room">Join Room</button>
          </div>
        </div>
      `;
    }

    /**
     * Get room view HTML
     */
    getRoomHTML(roomCode) {
      return `
        <div class="mp-header" id="mp-header">
          <h3>Multiplayer</h3>
          <button class="mp-toggle" id="mp-toggle">−</button>
        </div>
        <div class="mp-content">
          <div class="mp-room-code">
            <div class="mp-room-code-label">ROOM CODE</div>
            <div class="mp-room-code-value">${roomCode}</div>
          </div>
          
          <div class="mp-status">
            <div class="mp-status-dot ${this.manager.peers.size > 0 ? 'connected' : ''}"></div>
            <span>${this.manager.peers.size > 0 ? 'Connected' : 'Waiting for players...'}</span>
          </div>
          
          <div class="mp-section">
            <div class="mp-section-title">Connection</div>
            <button class="mp-btn mp-btn-secondary" id="mp-show-offer">Show Connection Info</button>
            <button class="mp-btn mp-btn-secondary" id="mp-enter-answer">Enter Peer's Response</button>
          </div>
          
          <div class="mp-section">
            <div class="mp-section-title">Players (${this.manager.getPlayers().length})</div>
            <div class="mp-player-list" id="mp-player-list">
              ${this.getPlayerListHTML()}
            </div>
          </div>
          
          <div class="mp-section">
            <div class="mp-section-title">Chat</div>
            <div class="mp-chat-container">
              <div class="mp-chat-messages" id="mp-chat-messages"></div>
              <div class="mp-chat-input-container">
                <input type="text" class="mp-chat-input" id="mp-chat-input" placeholder="Type a message...">
                <button class="mp-chat-send" id="mp-chat-send">Send</button>
              </div>
            </div>
          </div>
          
          <button class="mp-btn mp-btn-danger" id="mp-leave-room">Leave Room</button>
        </div>
      `;
    }

    /**
     * Get join view HTML
     */
    getJoinHTML() {
      return `
        <div class="mp-header" id="mp-header">
          <h3>Multiplayer</h3>
          <button class="mp-toggle" id="mp-toggle">−</button>
        </div>
        <div class="mp-content">
          <div class="mp-section">
            <div class="mp-section-title">Paste Host's Connection Info</div>
            <textarea class="mp-textarea" id="mp-offer-input" placeholder="Paste the host's connection info here..."></textarea>
            <div class="mp-help-text">
              Ask the host to click "Show Connection Info" and paste their info here.
            </div>
          </div>
          
          <div class="mp-btn-group">
            <button class="mp-btn mp-btn-secondary" id="mp-join-back">Back</button>
            <button class="mp-btn mp-btn-primary" id="mp-join-connect">Connect</button>
          </div>
        </div>
      `;
    }

    /**
     * Get connection info view HTML
     */
    getConnectionInfoHTML(info, isOffer) {
      return `
        <div class="mp-header" id="mp-header">
          <h3>Multiplayer</h3>
          <button class="mp-toggle" id="mp-toggle">−</button>
        </div>
        <div class="mp-content">
          <div class="mp-section">
            <div class="mp-section-title">${isOffer ? 'Your Connection Info' : 'Your Response'}</div>
            <textarea class="mp-textarea" id="mp-connection-info" readonly>${info}</textarea>
            <div class="mp-help-text">
              ${isOffer 
                ? 'Copy this and send it to the player who wants to join. They will paste it in their "Join Room" screen.'
                : 'Copy this and send it back to the host. They will paste it in "Enter Peer\'s Response".'}
            </div>
          </div>
          
          <div class="mp-btn-group">
            <button class="mp-btn mp-btn-secondary" id="mp-connection-back">Back</button>
            <button class="mp-btn mp-btn-primary" id="mp-connection-copy">Copy to Clipboard</button>
          </div>
        </div>
      `;
    }

    /**
     * Get answer input view HTML
     */
    getAnswerInputHTML() {
      return `
        <div class="mp-header" id="mp-header">
          <h3>Multiplayer</h3>
          <button class="mp-toggle" id="mp-toggle">−</button>
        </div>
        <div class="mp-content">
          <div class="mp-section">
            <div class="mp-section-title">Paste Peer's Response</div>
            <textarea class="mp-textarea" id="mp-answer-input" placeholder="Paste the peer's response here..."></textarea>
            <div class="mp-help-text">
              After the peer connects with your info, they will get a response. Paste it here to complete the connection.
            </div>
          </div>
          
          <div class="mp-btn-group">
            <button class="mp-btn mp-btn-secondary" id="mp-answer-back">Back</button>
            <button class="mp-btn mp-btn-primary" id="mp-answer-connect">Connect</button>
          </div>
        </div>
      `;
    }

    /**
     * Get player list HTML
     */
    getPlayerListHTML() {
      const players = this.manager.getPlayers();
      return players.map(player => `
        <div class="mp-player-item">
          <div class="mp-player-color" style="background: ${player.color}"></div>
          <span class="mp-player-name">${this.escapeHtml(player.name)}</span>
          ${player.id === this.manager.playerId ? '<span class="mp-player-badge">You</span>' : ''}
          ${player.isHost ? '<span class="mp-player-badge">Host</span>' : ''}
        </div>
      `).join('');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      this.container.addEventListener('click', (e) => {
        const target = e.target;
        
        // Toggle minimize
        if (target.id === 'mp-toggle' || target.id === 'mp-header') {
          if (target.id !== 'mp-toggle' && e.target.closest('#mp-toggle')) return;
          this.toggleMinimize();
        }
        
        // Create room
        if (target.id === 'mp-create-room') {
          this.savePlayerName();
          this.manager.createRoom();
        }
        
        // Join room
        if (target.id === 'mp-join-room') {
          this.savePlayerName();
          this.showJoinView();
        }
        
        // Back to lobby from join
        if (target.id === 'mp-join-back') {
          this.showLobbyView();
        }
        
        // Connect with offer
        if (target.id === 'mp-join-connect') {
          const offerInput = document.getElementById('mp-offer-input');
          if (offerInput && offerInput.value.trim()) {
            this.manager.joinWithOffer(offerInput.value.trim());
          }
        }
        
        // Show offer
        if (target.id === 'mp-show-offer') {
          if (this.manager.localOffer) {
            this.showConnectionInfo(this.manager.localOffer, true);
          } else {
            this.showConnectionInfo('Generating connection info... Please wait a moment and try again.', true);
          }
        }
        
        // Enter answer
        if (target.id === 'mp-enter-answer') {
          this.showAnswerInputView();
        }
        
        // Back from connection info
        if (target.id === 'mp-connection-back') {
          if (this.manager.roomCode) {
            this.showRoomView(this.manager.roomCode);
          } else {
            this.showLobbyView();
          }
        }
        
        // Copy connection info
        if (target.id === 'mp-connection-copy') {
          const textarea = document.getElementById('mp-connection-info');
          if (textarea) {
            textarea.select();
            document.execCommand('copy');
            target.textContent = 'Copied!';
            setTimeout(() => {
              target.textContent = 'Copy to Clipboard';
            }, 2000);
          }
        }
        
        // Back from answer input
        if (target.id === 'mp-answer-back') {
          this.showRoomView(this.manager.roomCode);
        }
        
        // Connect with answer
        if (target.id === 'mp-answer-connect') {
          const answerInput = document.getElementById('mp-answer-input');
          if (answerInput && answerInput.value.trim()) {
            this.manager.completeConnection(answerInput.value.trim());
            this.showRoomView(this.manager.roomCode);
          }
        }
        
        // Leave room
        if (target.id === 'mp-leave-room') {
          this.manager.leaveRoom();
        }
        
        // Send chat
        if (target.id === 'mp-chat-send') {
          this.sendChatFromInput();
        }
      });

      // Chat input enter key
      this.container.addEventListener('keydown', (e) => {
        if (e.target.id === 'mp-chat-input' && e.key === 'Enter') {
          this.sendChatFromInput();
        }
        
        // Player name change
        if (e.target.id === 'mp-player-name' && e.key === 'Enter') {
          this.savePlayerName();
        }
      });

      // Player name blur
      this.container.addEventListener('blur', (e) => {
        if (e.target.id === 'mp-player-name') {
          this.savePlayerName();
        }
      }, true);
    }

    /**
     * Save player name from input
     */
    savePlayerName() {
      const input = document.getElementById('mp-player-name');
      if (input && input.value.trim()) {
        this.manager.setPlayerName(input.value.trim());
      }
    }

    /**
     * Send chat message from input
     */
    sendChatFromInput() {
      const input = document.getElementById('mp-chat-input');
      if (input && input.value.trim()) {
        this.manager.sendChatMessage(input.value.trim());
        input.value = '';
      }
    }

    /**
     * Toggle minimize state
     */
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      this.container.classList.toggle('minimized', this.isMinimized);
      const toggle = document.getElementById('mp-toggle');
      if (toggle) {
        toggle.textContent = this.isMinimized ? '+' : '−';
      }
    }

    /**
     * Show lobby view
     */
    showLobbyView() {
      this.currentView = 'lobby';
      this.container.innerHTML = this.getLobbyHTML();
      this.setupEventListeners();
    }

    /**
     * Show room view
     */
    showRoomView(roomCode) {
      this.currentView = 'room';
      this.container.innerHTML = this.getRoomHTML(roomCode);
      this.setupEventListeners();
    }

    /**
     * Show join view
     */
    showJoinView() {
      this.currentView = 'join';
      this.container.innerHTML = this.getJoinHTML();
      this.setupEventListeners();
    }

    /**
     * Show connection info view
     */
    showConnectionInfo(info, isOffer) {
      this.currentView = 'connect';
      this.container.innerHTML = this.getConnectionInfoHTML(info, isOffer);
      this.setupEventListeners();
    }

    /**
     * Show answer input view
     */
    showAnswerInputView() {
      this.currentView = 'answer';
      this.container.innerHTML = this.getAnswerInputHTML();
      this.setupEventListeners();
    }

    /**
     * Update player list
     */
    updatePlayerList() {
      const list = document.getElementById('mp-player-list');
      if (list) {
        list.innerHTML = this.getPlayerListHTML();
      }
      
      // Update status
      const statusDot = this.container.querySelector('.mp-status-dot');
      const statusText = this.container.querySelector('.mp-status span');
      if (statusDot) {
        statusDot.classList.toggle('connected', this.manager.peers.size > 0);
      }
      if (statusText) {
        statusText.textContent = this.manager.peers.size > 0 ? 'Connected' : 'Waiting for players...';
      }
      
      // Update player count
      const playerCount = this.container.querySelector('.mp-section-title');
      if (playerCount && playerCount.textContent.includes('Players')) {
        playerCount.textContent = `Players (${this.manager.getPlayers().length})`;
      }
    }

    /**
     * Add chat message to the chat window
     */
    addChatMessage(name, message, color, isOwnMessage = false) {
      const container = document.getElementById('mp-chat-messages');
      if (!container) return;

      const msgEl = document.createElement('div');
      msgEl.className = 'mp-chat-message';
      msgEl.innerHTML = `
        <span class="mp-chat-message-name" style="color: ${color}">${this.escapeHtml(name)}:</span>
        <span class="mp-chat-message-text">${this.escapeHtml(message)}</span>
      `;
      container.appendChild(msgEl);
      container.scrollTop = container.scrollHeight;
    }

    /**
     * Add system message to chat
     */
    addSystemMessage(message) {
      const container = document.getElementById('mp-chat-messages');
      if (!container) return;

      const msgEl = document.createElement('div');
      msgEl.className = 'mp-chat-message';
      msgEl.innerHTML = `<span class="mp-chat-message-system">${this.escapeHtml(message)}</span>`;
      container.appendChild(msgEl);
      container.scrollTop = container.scrollHeight;
    }
  }

  // Initialize multiplayer when DOM is ready
  function initMultiplayer() {
    window.multiplayerManager = new MultiplayerManager();
    console.log('[Multiplayer] System initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMultiplayer);
  } else {
    initMultiplayer();
  }

  // Export for external access
  window.MultiplayerManager = MultiplayerManager;
})();
