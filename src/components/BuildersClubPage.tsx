import React from 'react';
import { sounds } from '../game/soundEngine';

interface BuildersClubPageProps {
  onPlayGame: () => void;
}

export const BuildersClubPage: React.FC<BuildersClubPageProps> = ({ onPlayGame }) => {
  return (
    <div id="verlex-builders-club-page" className="w-full bg-[#efefef] min-h-[calc(100vh-140px)] py-4 px-2 sm:px-6 select-none font-sans text-gray-800">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#e67e22] via-[#f39c12] to-[#d35400] text-white p-6 border-2 border-[#b85a00] shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-3xl">👷</span>
              <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight drop-shadow-md">
                VERLEX Builders Club
              </h1>
            </div>
            <p className="text-sm font-medium mt-1 drop-shadow-xs">
              Master Builder Mode (100% Free Sandbox &amp; Unlocks)
            </p>
          </div>
          <div className="hidden sm:block text-5xl">🔨</div>
        </div>

        {/* Perks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-400 p-4 shadow-xs text-center space-y-2">
            <div className="text-4xl">🏛️</div>
            <h3 className="font-bold text-sm text-[#1e3d7a]">Up to 10 Active Places</h3>
            <p className="text-xs text-gray-600">
              Build and host multiple custom sandbox places with physics and brickbattle tools.
            </p>
          </div>

          <div className="bg-white border border-gray-400 p-4 shadow-xs text-center space-y-2">
            <div className="text-4xl">💰</div>
            <h3 className="font-bold text-sm text-[#1e3d7a]">Free Sandbox Currency</h3>
            <p className="text-xs text-gray-600">
              Receive free daily in-game Tix &amp; R$ to unlock all Verlex catalog hats, faces, and outfits. No real money required.
            </p>
          </div>

          <div className="bg-white border border-gray-400 p-4 shadow-xs text-center space-y-2">
            <div className="text-4xl">🪖</div>
            <h3 className="font-bold text-sm text-[#1e3d7a]">Exclusive Hardhat &amp; Badge</h3>
            <p className="text-xs text-gray-600">
              Wear the iconic yellow Builder Hardhat in the 3D wardrobe customizer.
            </p>
          </div>
        </div>

        {/* Join Now CTA */}
        <div className="bg-white border border-gray-400 p-6 shadow-xs text-center space-y-3">
          <h2 className="text-lg font-black text-[#1e3d7a]">
            Ready to become a Certified Master Builder?
          </h2>
          <p className="text-xs text-gray-600 max-w-lg mx-auto">
            Experience unlimited building potential with the full 3D physics sandbox engine and brickbattle arenas.
          </p>
          <button
            onClick={() => {
              sounds.playClick();
              onPlayGame();
            }}
            className="px-6 py-2.5 bg-gradient-to-b from-[#ffd84d] via-[#f7c229] to-[#df9e0c] border-2 border-[#b87d00] text-black font-black text-sm rounded-sm shadow-md hover:brightness-105 active:translate-y-0.5"
          >
            Launch 3D Builder Sandbox Now &gt;
          </button>
        </div>
      </div>
    </div>
  );
};
