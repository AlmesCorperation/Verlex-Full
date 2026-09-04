import React, { useState, useEffect } from 'react';
import { AvatarConfig, AvatarHat, AvatarFace, AvatarTShirt, AvatarShirt, AvatarPants, UGCItem } from '../types';
import { sounds } from '../game/soundEngine';
import { economyService } from '../services/economyService';
import { ugcService } from '../services/ugcService';
import { Coins, Sparkles, AlertCircle, Shirt, Scissors, Plus, Check, ShoppingCart, Tag } from 'lucide-react';

interface CatalogPageProps {
  avatarConfig: AvatarConfig;
  onChangeConfig: (newConfig: Partial<AvatarConfig>) => void;
  onNavigateToWardrobe: () => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  avatarConfig,
  onChangeConfig,
  onNavigateToWardrobe,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Hats' | 'Faces' | 'Shirts' | 'Pants' | 'T-Shirts' | 'UGC'>('All');
  const [verbucks, setVerbucks] = useState<number>(economyService.getVerbucks());
  const [ownedItems, setOwnedItems] = useState<string[]>(economyService.getOwnedCatalogItems());
  const [purchaseNotice, setPurchaseNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // UGC Studio Creator state
  const [ugcList, setUgcList] = useState<UGCItem[]>(ugcService.getUgcItems());
  const [ugcForm, setUgcForm] = useState({
    name: 'Custom Cyber Hoodie',
    type: 'shirt' as 'shirt' | 'pants' | 'tshirt' | 'hat',
    pattern: 'Cyber',
    primaryColor: '#e74c3c',
    secondaryColor: '#00f0ff',
    price: 30,
    description: 'Fresh user generated clothing created with Verlex UGC Studio!',
  });

  useEffect(() => {
    const update = () => {
      setVerbucks(economyService.getVerbucks());
      setOwnedItems(economyService.getOwnedCatalogItems());
      setUgcList(ugcService.getUgcItems());
    };
    update();
    const unsubEconomy = economyService.subscribe(update);
    const unsubUgc = ugcService.subscribe(update);
    return () => {
      unsubEconomy();
      unsubUgc();
    };
  }, []);

  // Built-in Verlex Official Catalog Catalog Items
  const officialCatalogItems = [
    // SHIRTS
    {
      id: 'red_tuxedo',
      name: 'Classic Crimson Tuxedo',
      type: 'shirt' as const,
      subType: 'red_tuxedo' as AvatarShirt,
      priceType: 'V$' as const,
      price: 45,
      creator: 'Verlex',
      icon: '👔',
      description: 'Elegant velvet crimson suit coat with satin black lapels and bowtie.',
    },
    {
      id: 'verlex_hoodie',
      name: 'VERLEX Admin Pullover Hoodie',
      type: 'shirt' as const,
      subType: 'verlex_hoodie' as AvatarShirt,
      priceType: 'V$' as const,
      price: 30,
      creator: 'Verlex',
      icon: '🧥',
      description: 'Official oversized black hoodie with metallic gold embroidered V logo.',
    },
    {
      id: 'galaxy_suit',
      name: 'Nebula Galaxy Suit',
      type: 'shirt' as const,
      subType: 'galaxy_suit' as AvatarShirt,
      priceType: 'V$' as const,
      price: 80,
      creator: 'Telamon',
      icon: '🌌',
      description: 'Cosmic space suit woven from sparkling stardust nebula silk.',
    },
    {
      id: 'cyber_armor',
      name: 'Cyberpunk Exo-Jacket',
      type: 'shirt' as const,
      subType: 'cyber_armor' as AvatarShirt,
      priceType: 'V$' as const,
      price: 60,
      creator: 'Clockwork',
      icon: '🦾',
      description: 'High-tech armor plating with neon cyan wiring accents.',
    },
    {
      id: 'denim_jacket',
      name: 'Vintage Builder Denim Jacket',
      type: 'shirt' as const,
      subType: 'denim_jacket' as AvatarShirt,
      priceType: 'TIX' as const,
      price: 25,
      creator: 'Builderman',
      icon: '👕',
      description: 'Rugged blue denim jacket with brass stud rivets.',
    },
    {
      id: 'royalty_shirt',
      name: 'Golden Royalty Tunic',
      type: 'shirt' as const,
      subType: 'royalty_shirt' as AvatarShirt,
      priceType: 'V$' as const,
      price: 120,
      creator: 'Shedletsky',
      icon: '👑',
      description: 'Royal court tunic embroidered with pure gold thread.',
    },

    // PANTS
    {
      id: 'blue_jeans',
      name: 'Classic Ripped Blue Jeans',
      type: 'pants' as const,
      subType: 'blue_jeans' as AvatarPants,
      priceType: 'V$' as const,
      price: 20,
      creator: 'Verlex',
      icon: '👖',
      description: 'Standard dark wash indigo jeans with distressed knee patches.',
    },
    {
      id: 'cargo_pants',
      name: 'Tactical Shadow Cargo Pants',
      type: 'pants' as const,
      subType: 'cargo_pants' as AvatarPants,
      priceType: 'V$' as const,
      price: 35,
      creator: 'Clockwork',
      icon: '🩳',
      description: 'Heavy duty tactical cargo pants with utility straps and leg holsters.',
    },
    {
      id: 'tuxedo_slacks',
      name: 'Black Tuxedo Slacks',
      type: 'pants' as const,
      subType: 'tuxedo_slacks' as AvatarPants,
      priceType: 'V$' as const,
      price: 25,
      creator: 'Verlex',
      icon: '👖',
      description: 'Tailored black dress trousers with shiny leather belt.',
    },
    {
      id: 'black_joggers',
      name: 'Streetwear Black Joggers',
      type: 'pants' as const,
      subType: 'black_joggers' as AvatarPants,
      priceType: 'TIX' as const,
      price: 15,
      creator: 'Builderman',
      icon: '👖',
      description: 'Comfortable athletic sweatpants with white side stripes.',
    },
    {
      id: 'royal_leggings',
      name: 'Royal Guard Greaves',
      type: 'pants' as const,
      subType: 'royal_leggings' as AvatarPants,
      priceType: 'V$' as const,
      price: 75,
      creator: 'Shedletsky',
      icon: '🛡️',
      description: 'Polished silver plate armor leg guards.',
    },

    // HATS & FACES
    {
      id: 'verlex_cap',
      name: 'VERLEX Baseball Cap',
      type: 'hat' as const,
      subType: 'verlex_cap' as AvatarHat,
      priceType: 'V$' as const,
      price: 15,
      creator: 'Verlex',
      icon: '🧢',
      description: 'The definitive red baseball cap with embroidered VERLEX V logo.',
    },
    {
      id: 'fedora',
      name: 'Black Fedora',
      type: 'hat' as const,
      subType: 'fedora' as AvatarHat,
      priceType: 'V$' as const,
      price: 50,
      creator: 'Verlex',
      icon: '🎩',
      description: 'Dapper black felt fedora with a crisp crimson ribbon band.',
    },
    {
      id: 'domino',
      name: 'Domino Crown',
      type: 'hat' as const,
      subType: 'domino' as AvatarHat,
      priceType: 'V$' as const,
      price: 300,
      creator: 'Verlex',
      icon: '👑',
      description: 'Ancient royal crown encrusted with glowing green emerald dominoes.',
    },
    {
      id: 'cool',
      name: 'Cool Sunglasses Face',
      type: 'face' as const,
      subType: 'cool' as AvatarFace,
      priceType: 'V$' as const,
      price: 30,
      creator: 'Verlex',
      icon: '😎',
      description: 'Dark reflective shades with a confident smirk.',
    },
    {
      id: 'epic',
      name: 'Epic Face',
      type: 'face' as const,
      subType: 'epic' as AvatarFace,
      priceType: 'V$' as const,
      price: 100,
      creator: 'Telamon',
      icon: '😃',
      description: 'The timeless joyful smile for true brick battling legends.',
    },
  ];

  const handleBuyOfficialItem = (item: typeof officialCatalogItems[0]) => {
    sounds.playClick();
    if (ownedItems.includes(item.id)) {
      // Equip if owned
      if (item.type === 'shirt') onChangeConfig({ shirt: item.subType as AvatarShirt });
      else if (item.type === 'pants') onChangeConfig({ pants: item.subType as AvatarPants });
      else if (item.type === 'hat') onChangeConfig({ hat: item.subType as AvatarHat });
      else if (item.type === 'face') onChangeConfig({ face: item.subType as AvatarFace });
      
      setPurchaseNotice({ type: 'success', text: `Equipped ${item.name}!` });
      setTimeout(() => setPurchaseNotice(null), 3000);
      return;
    }

    if (item.priceType === 'V$' && verbucks < item.price) {
      sounds.playError();
      setPurchaseNotice({ type: 'error', text: `Insufficient Verbucks (V$). You need V$${item.price}!` });
      setTimeout(() => setPurchaseNotice(null), 3000);
      return;
    }

    // Process purchase
    if (item.priceType === 'V$') {
      economyService.spendVerbucks(item.price);
    }
    economyService.addOwnedItem(item.id);

    // Auto-equip on purchase
    if (item.type === 'shirt') onChangeConfig({ shirt: item.subType as AvatarShirt });
    else if (item.type === 'pants') onChangeConfig({ pants: item.subType as AvatarPants });
    else if (item.type === 'hat') onChangeConfig({ hat: item.subType as AvatarHat });
    else if (item.type === 'face') onChangeConfig({ face: item.subType as AvatarFace });

    setPurchaseNotice({ type: 'success', text: `Purchased and equipped ${item.name}!` });
    setTimeout(() => setPurchaseNotice(null), 3000);
  };

  const handleBuyUgcItem = (item: UGCItem) => {
    sounds.playClick();
    if (ownedItems.includes(item.id)) {
      if (item.type === 'shirt') onChangeConfig({ shirt: item.id });
      else if (item.type === 'pants') onChangeConfig({ pants: item.id });
      setPurchaseNotice({ type: 'success', text: `Equipped UGC item ${item.name}!` });
      setTimeout(() => setPurchaseNotice(null), 3000);
      return;
    }

    if (verbucks < item.price) {
      sounds.playError();
      setPurchaseNotice({ type: 'error', text: `Insufficient Verbucks (V$) for UGC item!` });
      setTimeout(() => setPurchaseNotice(null), 3000);
      return;
    }

    economyService.spendVerbucks(item.price);
    economyService.addOwnedItem(item.id);
    ugcService.incrementSales(item.id);

    if (item.type === 'shirt') onChangeConfig({ shirt: item.id });
    else if (item.type === 'pants') onChangeConfig({ pants: item.id });

    setPurchaseNotice({ type: 'success', text: `Purchased UGC Item ${item.name}!` });
    setTimeout(() => setPurchaseNotice(null), 3000);
  };

  const handlePublishUgc = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();

    if (!ugcForm.name.trim()) return;

    ugcService.publishUgcItem({
      name: ugcForm.name,
      type: ugcForm.type,
      category: ugcForm.type === 'shirt' ? 'Shirts' : ugcForm.type === 'pants' ? 'Pants' : 'T-Shirts',
      creator: 'Verlexian',
      price: ugcForm.price,
      currency: 'V$',
      pattern: ugcForm.pattern,
      primaryColor: ugcForm.primaryColor,
      secondaryColor: ugcForm.secondaryColor,
      description: ugcForm.description,
    });

    setPurchaseNotice({ type: 'success', text: `Published ${ugcForm.name} to the UGC Store!` });
    setSelectedCategory('UGC');
    setTimeout(() => setPurchaseNotice(null), 3000);
  };

  return (
    <div id="verlex-catalog-page" className="w-full bg-[#efefef] min-h-[calc(100vh-140px)] py-4 px-2 sm:px-6 font-sans text-gray-800 select-none">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Header Bar */}
        <div className="bg-white border border-gray-400 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1e3d7a] flex items-center space-x-2">
              <Shirt className="w-6 h-6 text-[#1e3d7a]" />
              <span>VERLEX Official Catalog &amp; UGC Clothing Studio</span>
            </h1>
            <p className="text-xs text-gray-600">
              Customize your R6 Avatar with Shirts, Pants, Accessories, or create &amp; publish custom UGC clothing!
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-[#fff9e6] border border-[#e6c200] px-3 py-1.5 rounded flex items-center space-x-1.5 font-bold text-xs text-[#8a7100]">
              <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Balance: <strong className="font-mono text-black text-sm">V${verbucks}</strong></span>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onNavigateToWardrobe();
              }}
              className="px-3 py-1.5 bg-[#5c87de] hover:bg-[#4a73c5] text-white font-extrabold text-xs border border-[#1e3d7a] flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Wardrobe Customizer</span>
            </button>
          </div>
        </div>

        {/* Purchase / Notice Banner */}
        {purchaseNotice && (
          <div className={`p-3 border text-xs font-bold rounded flex items-center space-x-2 animate-fadeIn ${
            purchaseNotice.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{purchaseNotice.text}</span>
          </div>
        )}

        {/* Category Navigation Bar */}
        <div className="flex flex-wrap items-center space-x-1 border-b border-gray-400 pb-1 text-xs font-bold">
          {(['All', 'Shirts', 'Pants', 'Hats', 'Faces', 'UGC'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sounds.playClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 border border-b-0 cursor-pointer flex items-center space-x-1 ${
                selectedCategory === cat
                  ? 'bg-[#5c87de] text-white border-[#1e3d7a]'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-400'
              }`}
            >
              {cat === 'UGC' && <Scissors className="w-3.5 h-3.5 text-amber-400" />}
              <span>{cat === 'UGC' ? '✨ Create & Sell UGC' : `${cat}`}</span>
            </button>
          ))}
        </div>

        {/* UGC CREATOR TAB */}
        {selectedCategory === 'UGC' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-gray-400 p-6 shadow-xs">
            {/* Create Form */}
            <form onSubmit={handlePublishUgc} className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-base font-black text-[#1e3d7a] flex items-center space-x-2">
                  <Scissors className="w-5 h-5 text-indigo-600" />
                  <span>UGC Clothing Studio &amp; Designer</span>
                </h2>
                <p className="text-xs text-gray-500">Design custom Shirts &amp; Pants, set your price, and earn V$ whenever other players buy!</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Item Title</label>
                <input
                  type="text"
                  value={ugcForm.name}
                  onChange={(e) => setUgcForm({ ...ugcForm, name: e.target.value })}
                  className="w-full bg-white border border-gray-400 p-2 font-bold text-xs focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Clothing Type</label>
                  <select
                    value={ugcForm.type}
                    onChange={(e) => setUgcForm({ ...ugcForm, type: e.target.value as any })}
                    className="w-full bg-white border border-gray-400 p-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="shirt">Shirt / Hoodie</option>
                    <option value="pants">Pants / Cargo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Pattern Style</label>
                  <select
                    value={ugcForm.pattern}
                    onChange={(e) => setUgcForm({ ...ugcForm, pattern: e.target.value })}
                    className="w-full bg-white border border-gray-400 p-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="Flame">Flame Burst</option>
                    <option value="Cyber">Cyber Neon</option>
                    <option value="Galaxy">Space Galaxy</option>
                    <option value="Stripes">Athletic Stripes</option>
                    <option value="Plaid">Classic Plaid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Primary Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={ugcForm.primaryColor}
                      onChange={(e) => setUgcForm({ ...ugcForm, primaryColor: e.target.value })}
                      className="w-8 h-8 cursor-pointer"
                    />
                    <span className="font-mono text-xs">{ugcForm.primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Secondary Accent</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={ugcForm.secondaryColor}
                      onChange={(e) => setUgcForm({ ...ugcForm, secondaryColor: e.target.value })}
                      className="w-8 h-8 cursor-pointer"
                    />
                    <span className="font-mono text-xs">{ugcForm.secondaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Price in Verbucks (V$)</label>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  value={ugcForm.price}
                  onChange={(e) => setUgcForm({ ...ugcForm, price: parseInt(e.target.value) || 10 })}
                  className="w-full bg-white border border-gray-400 p-2 font-mono font-bold text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] border border-[#b87d00] text-black font-black text-xs uppercase tracking-wider rounded-xs shadow cursor-pointer hover:brightness-105"
              >
                🚀 Publish to UGC Catalog
              </button>
            </form>

            {/* Live UGC Preview */}
            <div className="bg-gray-50 border border-gray-300 p-5 flex flex-col items-center justify-center space-y-4">
              <span className="text-xs font-bold text-gray-500 uppercase">Live 2D Texture Preview</span>
              <div 
                className="w-48 h-48 rounded-lg border-2 border-dashed border-gray-400 flex flex-col items-center justify-center p-4 relative shadow-inner"
                style={{ backgroundColor: ugcForm.primaryColor }}
              >
                <div 
                  className="w-32 h-32 rounded flex flex-col items-center justify-center text-center p-2 shadow-md border"
                  style={{ backgroundColor: ugcForm.secondaryColor, borderColor: ugcForm.primaryColor }}
                >
                  <Shirt className="w-12 h-12 text-white" />
                  <span className="font-extrabold text-white text-xs mt-1 drop-shadow">{ugcForm.pattern}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 text-center">
                This preview renders automatically on the 3D avatar rig once equipped!
              </p>
            </div>
          </div>
        ) : (
          /* ITEMS GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* UGC Items */}
            {ugcList.map((ugc) => {
              const isOwned = ownedItems.includes(ugc.id);
              const isEquipped = avatarConfig.shirt === ugc.id || avatarConfig.pants === ugc.id;

              return (
                <div key={ugc.id} className="bg-white border-2 border-indigo-200 p-3 shadow-xs flex flex-col justify-between hover:border-indigo-500 transition-all">
                  <div>
                    <div 
                      className="h-32 w-full rounded border flex flex-col items-center justify-center p-2 relative shadow-inner"
                      style={{ backgroundColor: ugc.primaryColor }}
                    >
                      <div className="w-20 h-20 rounded flex items-center justify-center shadow" style={{ backgroundColor: ugc.secondaryColor }}>
                        <Shirt className="w-8 h-8 text-white" />
                      </div>
                      <span className="absolute top-1 right-1 bg-indigo-900 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-black">
                        UGC
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <h3 className="font-extrabold text-xs text-[#003399] line-clamp-1">{ugc.name}</h3>
                      <div className="text-[11px] text-gray-500 flex items-center justify-between mt-0.5">
                        <span>By: <strong>{ugc.creator}</strong></span>
                        <span className="font-mono text-emerald-700 font-bold">V${ugc.price}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyUgcItem(ugc)}
                    className={`mt-3 w-full py-1.5 font-extrabold text-xs border rounded-xs cursor-pointer flex items-center justify-center space-x-1 ${
                      isEquipped
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : isOwned
                        ? 'bg-indigo-600 text-white border-indigo-700'
                        : 'bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] text-black border-[#b87d00]'
                    }`}
                  >
                    <span>{isEquipped ? 'Equipped' : isOwned ? 'Equip UGC Item' : `Buy for V$${ugc.price}`}</span>
                  </button>
                </div>
              );
            })}

            {/* Official Items */}
            {officialCatalogItems
              .filter(item => selectedCategory === 'All' || item.type === selectedCategory.toLowerCase().slice(0, -1) || (selectedCategory === 'Shirts' && item.type === 'shirt') || (selectedCategory === 'Pants' && item.type === 'pants') || (selectedCategory === 'Hats' && item.type === 'hat') || (selectedCategory === 'Faces' && item.type === 'face'))
              .map((item) => {
                const isOwned = ownedItems.includes(item.id);
                const isEquipped = (item.type === 'shirt' && avatarConfig.shirt === item.subType) ||
                                  (item.type === 'pants' && avatarConfig.pants === item.subType) ||
                                  (item.type === 'hat' && avatarConfig.hat === item.subType) ||
                                  (item.type === 'face' && avatarConfig.face === item.subType);

                return (
                  <div key={item.id} className="bg-white border border-gray-400 p-3 shadow-xs flex flex-col justify-between hover:border-blue-600 transition-all">
                    <div>
                      <div className="h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center text-5xl">
                        {item.icon}
                      </div>

                      <div className="mt-2.5">
                        <h3 className="font-bold text-xs text-[#003399] line-clamp-1">{item.name}</h3>
                        <div className="text-[11px] text-gray-500 flex items-center justify-between mt-0.5">
                          <span>Creator: <strong>{item.creator}</strong></span>
                          <span className="font-mono text-amber-700 font-bold">{item.priceType}{item.price}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyOfficialItem(item)}
                      className={`mt-3 w-full py-1.5 font-extrabold text-xs border rounded-xs cursor-pointer flex items-center justify-center space-x-1 ${
                        isEquipped
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : isOwned
                          ? 'bg-[#5c87de] text-white border-[#1e3d7a]'
                          : 'bg-gradient-to-b from-[#ffd84d] to-[#df9e0c] text-black border-[#b87d00]'
                      }`}
                    >
                      <span>{isEquipped ? 'Equipped' : isOwned ? 'Equip Item' : `Buy for ${item.priceType}${item.price}`}</span>
                    </button>
                  </div>
                );
            })}

          </div>
        )}

      </div>
    </div>
  );
};
