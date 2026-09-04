import React, { useState, useEffect } from 'react';
import { sounds } from '../game/soundEngine';
import { 
  Pin, 
  MessageSquare, 
  Eye, 
  PlusCircle, 
  ArrowLeft, 
  Search, 
  Folder, 
  User, 
  Clock, 
  ChevronRight, 
  Send,
  Sparkles,
  Bookmark
} from 'lucide-react';

interface ForumPost {
  id: string;
  author: string;
  content: string;
  time: string;
  role?: string;
  colorSeed?: string;
}

interface ForumThread {
  id: string;
  title: string;
  author: string;
  replies: number;
  views: number;
  category: string;
  time: string;
  pinned?: boolean;
  content: string;
  posts: ForumPost[];
}

interface ForumPageProps {
  playerName: string;
}

const CATEGORIES = [
  'All Discussions',
  'News & Announcements',
  'VERLEX Talk',
  'Building & Scripting',
  'Trading',
  'Creations & Showcases'
];

const PRELOADED_THREADS: ForumThread[] = [
  {
    id: 'thread-1',
    title: 'Update: Physics engine now supports bouncy spheres & trampolines!',
    author: 'Builderman',
    replies: 4,
    views: 8900,
    category: 'News & Announcements',
    time: '1 hour ago',
    pinned: true,
    content: 'Greeting Verlexians! We have just rolled out a major update to the physics engine. In addition to standard anchored blocks, unanchored parts now support custom bouncy elasticity coefficients and physical springs! Try building a trampoline using high-elasticity parts in your custom maps today!',
    posts: [
      {
        id: 'reply-1-1',
        author: 'LuaScripter',
        content: 'Awesome update! I already built a giant pinball machine using these bouncy spheres. The physics feel so nostalgic!',
        time: '45 mins ago',
        role: 'Scripter',
        colorSeed: '#22c55e'
      },
      {
        id: 'reply-1-2',
        author: 'BrickMaster',
        content: 'Is there a limit on how high the elasticity can go? I set a block to 2.5 and got launched into orbit immediately LOL!',
        time: '30 mins ago',
        role: 'Builder',
        colorSeed: '#eab308'
      },
      {
        id: 'reply-1-3',
        author: 'Telamon',
        content: 'Working as intended! Orbit launches are a classic feature of quality physics. Keep up the high velocity!',
        time: '15 mins ago',
        role: 'Admin',
        colorSeed: '#ef4444'
      },
      {
        id: 'reply-1-4',
        author: 'VerlexCollector',
        content: 'Amazing work Builderman, the ragdoll burials look incredibly funny too! Keep the updates coming!',
        time: '5 mins ago',
        role: 'Trader',
        colorSeed: '#3b82f6'
      }
    ]
  },
  {
    id: 'thread-2',
    title: 'How do you build a rocket launcher tower in Crossroads?',
    author: 'BrickMaster',
    replies: 3,
    views: 1240,
    category: 'VERLEX Talk',
    time: '12 mins ago',
    content: 'I want to build an automated brick-dispenser tower that fires rocket launcher tools when clicked, but the scripts are getting unanchored blocks tangled. What is the best spacing layout?',
    posts: [
      {
        id: 'reply-2-1',
        author: 'LuaScripter',
        content: 'Make sure your dispenser brick is Anchored=true, and the spawned rocket tools are set to CanCollide=false until equipped. That stops them from colliding inside the dispenser tube.',
        time: '9 mins ago',
        role: 'Scripter',
        colorSeed: '#22c55e'
      },
      {
        id: 'reply-2-2',
        author: 'BrickMaster',
        content: 'Oh! Setting CanCollide to false inside the spawning tube worked perfectly! Thank you so much LuaScripter!',
        time: '5 mins ago',
        role: 'Builder',
        colorSeed: '#eab308'
      },
      {
        id: 'reply-2-3',
        author: 'Telamon',
        content: 'Classic crossroads trick! Try adding a minor spawn velocity push to clear the exit tube cleanly.',
        time: '2 mins ago',
        role: 'Admin',
        colorSeed: '#ef4444'
      }
    ]
  },
  {
    id: 'thread-3',
    title: 'Need help scripting a moving conveyor belt for my Obby',
    author: 'LuaScripter',
    replies: 2,
    views: 540,
    category: 'Building & Scripting',
    time: '3 hours ago',
    content: 'Im trying to code a part that slides players in a specific direction using CFrame velocity, but it seems to bug out when the player jumps. Does anybody have an optimized script segment?',
    posts: [
      {
        id: 'reply-3-1',
        author: 'Builderman',
        content: 'Try using the "conveyorSpeed" field! We recently added native conveyor mechanics inside PartData. Set conveyorSpeed to a non-zero value, and the physics solver handles moving players automatically without script loops.',
        time: '2 hours ago',
        role: 'Dev',
        colorSeed: '#ec4899'
      },
      {
        id: 'reply-3-2',
        author: 'LuaScripter',
        content: 'Whoa, I did not realize conveyorSpeed was natively supported in PartData. It works incredibly smoothly even when jumping!',
        time: '1 hour ago',
        role: 'Scripter',
        colorSeed: '#22c55e'
      }
    ]
  },
  {
    id: 'thread-4',
    title: 'Trading Fedora for Domino Crown (Serious inquiries)',
    author: 'VerlexCollector',
    replies: 1,
    views: 920,
    category: 'Trading',
    time: '5 hours ago',
    content: 'Looking to trade my classic Black Fedora catalog item for a Domino Crown. Excellent condition. Message me in-game or reply below!',
    posts: [
      {
        id: 'reply-4-1',
        author: 'Telamon',
        content: 'Id offer you a classic Clockwork Crown, but the Domino Crown trading value is sky-high right now! Good luck with the trade.',
        time: '4 hours ago',
        role: 'Admin',
        colorSeed: '#ef4444'
      }
    ]
  },
  {
    id: 'thread-5',
    title: 'Show off your custom T-Shirt designs here!',
    author: 'Telamon',
    replies: 1,
    views: 3400,
    category: 'Creations & Showcases',
    time: 'Yesterday',
    content: 'Post screenshots or descriptions of your custom avatar T-Shirt files here! Lets see who has the best design in the VERLEX community.',
    posts: [
      {
        id: 'reply-5-1',
        author: 'BrickMaster',
        content: 'I made a classic retro "I Love Bricks" decal t-shirt that matches my yellow avatar head perfectly!',
        time: '18 hours ago',
        role: 'Builder',
        colorSeed: '#eab308'
      }
    ]
  }
];

export const ForumPage: React.FC<ForumPageProps> = ({ playerName }) => {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Discussions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  
  // Create New Thread Modal states
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('VERLEX Talk');
  const [newContent, setNewContent] = useState<string>('');

  // Reply state
  const [replyContent, setReplyContent] = useState<string>('');

  // Load threads from localStorage or preloaded
  useEffect(() => {
    const saved = localStorage.getItem('verlex_forum_threads');
    if (saved) {
      try {
        setThreads(JSON.parse(saved));
      } catch (err) {
        setThreads(PRELOADED_THREADS);
      }
    } else {
      setThreads(PRELOADED_THREADS);
      localStorage.setItem('verlex_forum_threads', JSON.stringify(PRELOADED_THREADS));
    }
  }, []);

  // Sync threads to localStorage
  const saveThreadsToStorage = (updatedThreads: ForumThread[]) => {
    setThreads(updatedThreads);
    localStorage.setItem('verlex_forum_threads', JSON.stringify(updatedThreads));
  };

  // Filter threads by Category & Search
  const filteredThreads = threads.filter(t => {
    const matchesCategory = selectedCategory === 'All Discussions' || t.category === selectedCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Thread Click (increments views)
  const handleSelectThread = (thread: ForumThread) => {
    sounds.playClick();
    
    // Update views count
    const updated = threads.map(t => {
      if (t.id === thread.id) {
        const updatedThread = { ...t, views: t.views + 1 };
        setSelectedThread(updatedThread);
        return updatedThread;
      }
      return t;
    });
    
    saveThreadsToStorage(updated);
  };

  // Submit a new thread
  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    sounds.playClick();

    const newThread: ForumThread = {
      id: `thread-${Date.now()}`,
      title: newTitle,
      author: playerName || 'Verlexian',
      replies: 0,
      views: 1,
      category: newCategory,
      time: 'Just now',
      content: newContent,
      posts: []
    };

    const updated = [newThread, ...threads];
    saveThreadsToStorage(updated);

    // Reset fields
    setNewTitle('');
    setNewContent('');
    setShowCreateForm(false);
    
    // Switch to category of created thread to view it
    setSelectedCategory(newCategory);
    setSelectedThread(newThread);
  };

  // Submit a reply
  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedThread) return;

    sounds.playClick();

    const newPost: ForumPost = {
      id: `reply-${Date.now()}`,
      author: playerName || 'Verlexian',
      content: replyContent,
      time: 'Just now',
      role: 'Member',
      colorSeed: '#8b5cf6'
    };

    const updated = threads.map(t => {
      if (t.id === selectedThread.id) {
        const updatedThread = {
          ...t,
          replies: t.replies + 1,
          posts: [...t.posts, newPost]
        };
        setSelectedThread(updatedThread);
        return updatedThread;
      }
      return t;
    });

    saveThreadsToStorage(updated);
    setReplyContent('');
  };

  // User Color Generator based on name for beautiful retro profiles
  const getNameColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[hash % colors.length];
  };

  return (
    <div id="verlex-forum-page" className="w-full bg-[#f3f4f6] min-h-[calc(100vh-140px)] py-6 px-4 md:px-8 select-none font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Forum Header Banner */}
        <div className="bg-gradient-to-r from-[#1e3d7a] to-[#3b60a3] border-b-4 border-yellow-400 p-6 shadow-md text-white rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏛️</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide">
                VERLEX Community Forums
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Join active discussions, share builds, trade classic items, and seek scripting help!
            </p>
          </div>
          <button 
            onClick={() => {
              sounds.playClick();
              setShowCreateForm(true);
              setSelectedThread(null);
            }}
            className="flex items-center justify-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black text-xs uppercase px-4 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition duration-200 cursor-pointer self-start md:self-auto"
          >
            <PlusCircle size={16} />
            Create New Topic
          </button>
        </div>

        {/* Create Thread Dialog Panel */}
        {showCreateForm && (
          <div className="bg-white border-2 border-yellow-400 rounded-xl p-6 shadow-xl relative animate-fade-in">
            <button 
              onClick={() => {
                sounds.playClick();
                setShowCreateForm(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-black text-[#1e3d7a] mb-4 flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={18} />
              Publish a New Topic
            </h3>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Topic Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. How to code a sliding teleporter with sound effects"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#1e3d7a] focus:outline-none text-sm text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Forum Category</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#1e3d7a] focus:outline-none text-sm text-gray-900 bg-white"
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Author Name</label>
                  <input 
                    type="text" 
                    disabled
                    value={playerName}
                    className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg text-sm text-gray-500 bg-gray-50 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Topic Message</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Write your forum post content here. Share code segments, build plans, or inquiries..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#1e3d7a] focus:outline-none text-sm text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowCreateForm(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#1e3d7a] hover:bg-[#2b529e] text-white font-bold text-xs uppercase px-5 py-2.5 rounded-lg transition cursor-pointer shadow"
                >
                  Publish Topic
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ----------------- SUBFORUM VIEW / THREAD LIST ----------------- */}
        {!selectedThread ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Sidebar Subforums */}
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
                  Forum Sub-Boards
                </h2>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => {
                    const count = cat === 'All Discussions' 
                      ? threads.length 
                      : threads.filter(t => t.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedCategory(cat);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          selectedCategory === cat 
                            ? 'bg-[#1e3d7a] text-white shadow' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Folder size={14} className={selectedCategory === cat ? 'text-yellow-300' : 'text-gray-400'} />
                          <span>{cat}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                          selectedCategory === cat ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Forum Quick stats */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-xs text-gray-500 space-y-2.5">
                <h3 className="font-extrabold text-gray-800 uppercase text-[10px] tracking-wider">Board Stats</h3>
                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                  <span>Total Threads:</span>
                  <strong className="text-gray-800 font-mono">{threads.length}</strong>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                  <span>Total Replies:</span>
                  <strong className="text-gray-800 font-mono">
                    {threads.reduce((acc, t) => acc + t.replies, 0)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Your Player ID:</span>
                  <span className="font-mono text-gray-800 font-bold bg-neutral-100 px-1.5 py-0.5 rounded">
                    {playerName}
                  </span>
                </div>
              </div>
            </div>

            {/* Forum Thread Listing */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Search Bar / Filters */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input 
                    type="text"
                    placeholder="Search thread titles, bodies, authors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#1e3d7a] bg-gray-50"
                  />
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => {
                      sounds.playClick();
                      setSearchQuery('');
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700 shrink-0 cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>

              {/* Threads Board Layout */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#1e3d7a] to-[#2c4b8b] text-white py-3 px-4 font-black text-xs tracking-wider uppercase flex justify-between">
                  <span>{selectedCategory} Board Topics</span>
                  <span>{filteredThreads.length} topics found</span>
                </div>

                {filteredThreads.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <span className="text-3xl block">📋</span>
                    <h4 className="text-sm font-black text-gray-700">No Active Threads</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      There are no discussions matching your criteria. Be the first to start a conversation!
                    </p>
                    <button 
                      onClick={() => {
                        sounds.playClick();
                        setShowCreateForm(true);
                      }}
                      className="mt-3 bg-[#1e3d7a] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-opacity-90"
                    >
                      New Topic
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredThreads.map((t, idx) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectThread(t)}
                        className={`p-4 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between gap-4 transition duration-150 ${
                          t.pinned ? 'bg-yellow-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {t.pinned && (
                              <span className="flex items-center gap-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-yellow-200 shadow-2xs">
                                <Pin size={8} /> Pinned
                              </span>
                            )}
                            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                              {t.category}
                            </span>
                            <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                              <User size={10} /> {t.author}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-[#003399] hover:underline leading-snug break-words">
                            {t.title}
                          </h4>
                          
                          <p className="text-xs text-gray-500 line-clamp-1 break-words">
                            {t.content}
                          </p>
                        </div>

                        {/* Thread Metadata Counts */}
                        <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-gray-500 font-mono text-[11px]">
                          <div className="text-center">
                            <span className="flex items-center justify-center gap-0.5 text-gray-700 font-bold">
                              <MessageSquare size={12} className="text-blue-500" />
                              {t.replies}
                            </span>
                            <span className="text-[9px] text-gray-400 uppercase font-sans">Replies</span>
                          </div>
                          <div className="text-center hidden sm:block">
                            <span className="flex items-center justify-center gap-0.5 font-bold">
                              <Eye size={12} className="text-gray-400" />
                              {t.views}
                            </span>
                            <span className="text-[9px] text-gray-400 uppercase font-sans">Views</span>
                          </div>
                          <div className="text-right text-[11px] shrink-0 font-sans text-gray-400">
                            <span className="block text-gray-600 font-semibold">{t.time}</span>
                            <span>last post</span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          
          // ----------------- DETAILED THREAD VIEW -----------------
          <div className="space-y-4">
            
            {/* Thread Navigation / Back header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  sounds.playClick();
                  setSelectedThread(null);
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer shadow-2xs"
              >
                <ArrowLeft size={14} />
                Back to Topics
              </button>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>Boards</span>
                <ChevronRight size={12} />
                <span className="font-semibold text-gray-800">{selectedThread.category}</span>
              </div>
            </div>

            {/* Main Thread Content Container */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
              
              {/* Thread Subject Line Banner */}
              <div className="bg-[#1e3d7a] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-yellow-400">
                <div className="space-y-1">
                  <span className="bg-blue-900/40 text-blue-100 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                    {selectedThread.category}
                  </span>
                  <h2 className="text-base sm:text-lg font-black leading-snug">
                    {selectedThread.title}
                  </h2>
                </div>
                <div className="flex gap-4 text-xs font-mono text-blue-100 shrink-0">
                  <span className="flex items-center gap-1"><Eye size={12} /> {selectedThread.views} Views</span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} /> {selectedThread.replies} Replies</span>
                </div>
              </div>

              {/* POST LISTING */}
              <div className="divide-y divide-gray-100">
                
                {/* 1. Original Post (OP) */}
                <div className="flex flex-col md:flex-row bg-white">
                  {/* Left Column: Author Card */}
                  <div className="w-full md:w-44 bg-gray-50/50 p-4 border-b md:border-b-0 md:border-r border-gray-100 text-center flex flex-row md:flex-col items-center justify-between md:justify-center gap-4">
                    <div className="flex md:flex-col items-center gap-3 md:gap-2">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-black shadow-inner"
                        style={{ backgroundColor: getNameColor(selectedThread.author) }}
                      >
                        {selectedThread.author.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left md:text-center">
                        <h4 className="font-extrabold text-sm text-[#003399] leading-tight break-all">
                          {selectedThread.author}
                        </h4>
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-yellow-200 mt-1">
                          Original Poster
                        </span>
                      </div>
                    </div>
                    <div className="text-right md:text-center text-[10px] text-gray-400">
                      <span>Joined: 2026</span>
                    </div>
                  </div>

                  {/* Right Column: Message content */}
                  <div className="flex-1 p-5 sm:p-6 space-y-4">
                    <div className="text-xs text-gray-400 border-b border-gray-100 pb-2 flex justify-between">
                      <span className="flex items-center gap-1"><Clock size={11} /> Posted {selectedThread.time}</span>
                      <span className="font-mono text-[10px]">#1</span>
                    </div>
                    <div className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap font-sans">
                      {selectedThread.content}
                    </div>
                  </div>
                </div>

                {/* 2. List of replies */}
                {selectedThread.posts.map((post, postIdx) => (
                  <div key={post.id} className="flex flex-col md:flex-row bg-white hover:bg-gray-50/20 transition-colors">
                    {/* Left Column: Reply Author Card */}
                    <div className="w-full md:w-44 bg-gray-50/50 p-4 border-b md:border-b-0 md:border-r border-gray-100 text-center flex flex-row md:flex-col items-center justify-between md:justify-center gap-4">
                      <div className="flex md:flex-col items-center gap-3 md:gap-2">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-black shadow-inner"
                          style={{ backgroundColor: post.colorSeed || getNameColor(post.author) }}
                        >
                          {post.author.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left md:text-center">
                          <h4 className="font-extrabold text-sm text-[#003399] leading-tight break-all">
                            {post.author}
                          </h4>
                          <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full border mt-1 ${
                            post.role === 'Admin' || post.role === 'Dev'
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : post.role === 'Scripter' || post.role === 'Builder'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            {post.role || 'Member'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right md:text-center text-[10px] text-gray-400">
                        <span>Joined: 2026</span>
                      </div>
                    </div>

                    {/* Right Column: Reply Content */}
                    <div className="flex-1 p-5 sm:p-6 space-y-4">
                      <div className="text-xs text-gray-400 border-b border-gray-100 pb-2 flex justify-between">
                        <span className="flex items-center gap-1"><Clock size={11} /> Replied {post.time}</span>
                        <span className="font-mono text-[10px]">#{postIdx + 2}</span>
                      </div>
                      <div className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap font-sans">
                        {post.content}
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </div>

            {/* Quick Reply Form segment */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-md">
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Bookmark size={12} className="text-blue-600" />
                Post a Quick Reply
              </h3>
              <form onSubmit={handlePostReply} className="space-y-3">
                <textarea
                  required
                  rows={3}
                  placeholder="Type your forum reply here. Keep replies helpful and respectful..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full px-4 py-2 text-xs border border-gray-200 rounded-lg focus:border-[#1e3d7a] focus:outline-none text-gray-900 bg-gray-50"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    Posting as <strong>{playerName}</strong>
                  </span>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-[#1e3d7a] hover:bg-[#2b529e] text-white font-extrabold text-xs uppercase px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer"
                  >
                    <Send size={11} />
                    Post Comment
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
