import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Wifi, 
  Cpu, 
  Sliders, 
  ShieldCheck, 
  Activity, 
  X, 
  RotateCcw, 
  Zap, 
  Layers, 
  Radio, 
  Server, 
  Share2, 
  Lock,
  CheckCircle2
} from 'lucide-react';
import { networkTopologyService } from '../services/networkTopologyService';
import { NetworkTopologyConfig, NetworkTopologyMode } from '../types';
import { sounds } from '../game/soundEngine';

interface NetworkTopologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkTopologyModal: React.FC<NetworkTopologyModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<NetworkTopologyConfig>(networkTopologyService.getConfig());
  const [activeTab, setActiveTab] = useState<'topology' | 'performance' | 'diagnostics'>('topology');

  // Simulated live diagnostic stats
  const [stats, setStats] = useState({
    ping: 18,
    bytesInSec: 14.2,
    bytesOutSec: 12.8,
    packetsPerSec: 60,
    packetLoss: 0,
  });

  useEffect(() => {
    const unsub = networkTopologyService.subscribe((cfg) => setConfig(cfg));
    return unsub;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const basePing = config.topologyMode === 'authoritative_server' ? 42 : 18;
      const jitter = (Math.random() - 0.5) * config.latencyJitterMs * 2;
      const currentPing = Math.max(5, Math.round(basePing + jitter));
      
      setStats({
        ping: currentPing,
        bytesInSec: parseFloat((12 + Math.random() * 8).toFixed(1)),
        bytesOutSec: parseFloat((10 + Math.random() * 6).toFixed(1)),
        packetsPerSec: config.targetTickRate,
        packetLoss: config.packetLossPercent,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleModeChange = (mode: NetworkTopologyMode) => {
    sounds.playClick();
    networkTopologyService.updateConfig({ topologyMode: mode });
  };

  const handleTickrateChange = (rate: 30 | 60 | 120 | 240) => {
    sounds.playClick();
    networkTopologyService.updateConfig({ targetTickRate: rate });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141721] border-2 border-[#2e3648] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1b202e] via-[#242b3d] to-[#1b202e] px-5 py-4 border-b border-[#2e3648] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md border border-indigo-400">
              <Network className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Network Topology &amp; Engine Matrix
                </h2>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-600/80 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  P2P MESH ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Configure Browser-Based P2P Topology, State Interpolation, &amp; Simulation Tickrates
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 bg-[#252c3d] hover:bg-[#333b52] text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-[#10121a] px-5 pt-3 border-b border-[#252c3d] flex space-x-4">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('topology');
            }}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'topology'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Topology Mode</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('performance');
            }}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'performance'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Tickrate &amp; Buffers</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('diagnostics');
            }}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Monitor</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar text-xs text-gray-300">
          
          {/* TAB 1: TOPOLOGY SELECTION */}
          {activeTab === 'topology' && (
            <div className="space-y-4">
              <label className="text-gray-400 font-bold uppercase tracking-wider block text-[11px]">
                Select Network Architecture
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* P2P Mesh */}
                <button
                  onClick={() => handleModeChange('p2p_mesh')}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer relative ${
                    config.topologyMode === 'p2p_mesh'
                      ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-[#181c29] border-[#293042] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2 font-extrabold text-white text-sm">
                      <Share2 className="w-4 h-4 text-indigo-400" />
                      <span>Peer-to-Peer Mesh</span>
                    </div>
                    {config.topologyMode === 'p2p_mesh' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Zero server host fees. WebRTC datachannels directly link all clients in a decentralized mesh.
                  </p>
                </button>

                {/* Authoritative Server */}
                <button
                  onClick={() => handleModeChange('authoritative_server')}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer relative ${
                    config.topologyMode === 'authoritative_server'
                      ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-[#181c29] border-[#293042] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2 font-extrabold text-white text-sm">
                      <Server className="w-4 h-4 text-purple-400" />
                      <span>Authoritative Client-Server</span>
                    </div>
                    {config.topologyMode === 'authoritative_server' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Host machine validates all hitboxes, physics state calculations, and player inputs to prevent cheats.
                  </p>
                </button>

                {/* Relay Matrix */}
                <button
                  onClick={() => handleModeChange('relay_matrix')}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer relative ${
                    config.topologyMode === 'relay_matrix'
                      ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-[#181c29] border-[#293042] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2 font-extrabold text-white text-sm">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>Relay Server Matrix</span>
                    </div>
                    {config.topologyMode === 'relay_matrix' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Routes player packets through lightweight proxy relays for NAT traversal and firewall bypass.
                  </p>
                </button>

                {/* Hybrid Star */}
                <button
                  onClick={() => handleModeChange('hybrid_star')}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer relative ${
                    config.topologyMode === 'hybrid_star'
                      ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-[#181c29] border-[#293042] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2 font-extrabold text-white text-sm">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>Hybrid Star Topology</span>
                    </div>
                    {config.topologyMode === 'hybrid_star' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Combines P2P position broadcasts with centralized inventory and score tracking.
                  </p>
                </button>
              </div>

              {/* Protocol Encoding */}
              <div className="bg-[#181c29] border border-[#293042] p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Serialization Encoder</span>
                  <div className="flex space-x-1">
                    {(['json', 'msgpack', 'flatbuffers'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => {
                          sounds.playClick();
                          networkTopologyService.updateConfig({ protocolFormat: fmt });
                        }}
                        className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-colors ${
                          config.protocolFormat === fmt
                            ? 'bg-indigo-600 text-white'
                            : 'bg-[#222838] text-gray-400 hover:text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TICKRATE & PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              {/* Target Tick Rate */}
              <div className="bg-[#181c29] border border-[#293042] p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm block">Simulation Tick Rate</span>
                    <span className="text-[11px] text-gray-400">Frequency of physics and transform delta synchronization</span>
                  </div>
                  <span className="font-mono text-indigo-400 font-bold text-sm">{config.targetTickRate} Hz</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {([30, 60, 120, 240] as const).map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleTickrateChange(rate)}
                      className={`py-2 rounded font-mono font-bold text-xs border transition-colors cursor-pointer ${
                        config.targetTickRate === rate
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                          : 'bg-[#222838] border-[#2e374d] text-gray-400 hover:text-white'
                      }`}
                    >
                      {rate} Hz
                    </button>
                  ))}
                </div>
              </div>

              {/* Interpolation Buffer */}
              <div className="bg-[#181c29] border border-[#293042] p-4 rounded-lg space-y-2">
                <div className="flex justify-between font-bold text-white">
                  <span>Interpolation Buffer Delay</span>
                  <span className="text-indigo-400 font-mono">{config.interpolationBufferMs} ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="10"
                  value={config.interpolationBufferMs}
                  onChange={(e) => {
                    networkTopologyService.updateConfig({ interpolationBufferMs: parseInt(e.target.value) });
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-[10px] text-gray-400">Higher buffer values smooth out jittery player movement at the cost of slight input delay.</p>
              </div>

              {/* Simulated Packet Loss & Jitter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#181c29] border border-[#293042] p-3.5 rounded-lg space-y-1.5">
                  <span className="font-bold text-white block">Packet Loss Simulation</span>
                  <div className="flex items-center justify-between">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={config.packetLossPercent}
                      onChange={(e) => networkTopologyService.updateConfig({ packetLossPercent: parseInt(e.target.value) })}
                      className="w-2/3 accent-red-500 cursor-pointer"
                    />
                    <span className="font-mono text-red-400 font-bold">{config.packetLossPercent}%</span>
                  </div>
                </div>

                <div className="bg-[#181c29] border border-[#293042] p-3.5 rounded-lg space-y-1.5">
                  <span className="font-bold text-white block">Latency Jitter</span>
                  <div className="flex items-center justify-between">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={config.latencyJitterMs}
                      onChange={(e) => networkTopologyService.updateConfig({ latencyJitterMs: parseInt(e.target.value) })}
                      className="w-2/3 accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono text-amber-400 font-bold">±{config.latencyJitterMs} ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE MONITOR DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#181c29] border border-[#293042] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Ping Latency</span>
                  <span className="text-base font-mono font-black text-emerald-400">{stats.ping} ms</span>
                </div>
                <div className="bg-[#181c29] border border-[#293042] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Packets In/Out</span>
                  <span className="text-base font-mono font-black text-indigo-400">{stats.packetsPerSec} / s</span>
                </div>
                <div className="bg-[#181c29] border border-[#293042] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Download Bandwidth</span>
                  <span className="text-base font-mono font-black text-cyan-400">{stats.bytesInSec} KB/s</span>
                </div>
                <div className="bg-[#181c29] border border-[#293042] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Upload Bandwidth</span>
                  <span className="text-base font-mono font-black text-amber-400">{stats.bytesOutSec} KB/s</span>
                </div>
              </div>

              {/* Peer Socket Table */}
              <div className="bg-[#181c29] border border-[#293042] p-3.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between border-b border-[#293042] pb-2">
                  <span className="font-bold text-white text-xs">Active Connected WebRTC Sockets</span>
                  <span className="text-[10px] font-mono text-indigo-400">{config.activePeersCount} / {config.maxPeerConnections} Peers</span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  {Array.from({ length: config.activePeersCount }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#11141e] px-2.5 py-1.5 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-gray-200">Peer_{i + 1} ({['US-East', 'EU-Central', 'US-West', 'AP-East'][i % 4]})</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-400">
                        <span>RTT: {stats.ping + (i * 3)}ms</span>
                        <span className="text-emerald-400">CONNECT</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-[#10121a] px-5 py-3 border-t border-[#252c3d] flex items-center justify-between">
          <button
            onClick={() => {
              sounds.playClick();
              networkTopologyService.resetToDefaults();
            }}
            className="text-gray-400 hover:text-white text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Apply Network Settings
          </button>
        </div>

      </div>
    </div>
  );
};
