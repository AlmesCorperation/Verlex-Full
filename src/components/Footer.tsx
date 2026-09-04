import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer id="verlex--footer" className="w-full bg-[#f2f2f2] text-[#444444] text-[11px] font-sans py-4 px-4 border-t border-gray-400 select-none text-center leading-relaxed">
      <div className="max-w-5xl mx-auto space-y-1.5">
        <p className="font-semibold text-gray-700">
          VERLEX &ndash; Verlex 3D Physics Sandbox ( Era Aesthetic)
        </p>
        <p className="text-gray-500">
          VERLEX is an independent physics sandbox for multiplayer building, battles, and obby adventures.
        </p>
        <p className="text-gray-500">
          All rights reserved. Powered by WebGL, WebRTC P2P multiplayer, and Three.js.
        </p>

        <div className="pt-2 flex items-center justify-center space-x-3 text-xs text-[#003399] font-medium">
          <span className="text-gray-600">Pure WebGL / Three.js Browser Sandbox</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">No Microtransactions</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">100% Free &amp; Open Sandbox</span>
        </div>
      </div>
    </footer>
  );
};
