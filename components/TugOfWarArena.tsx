import React from 'react';

/**
 * TugOfWarArena Component
 * 
 * A standalone, minimalist 2D block-style tug-of-war visual.
 * 
 * @param {number} ropePosition - Range 0 to 100, where 50 is center.
 */
/**
 * CharacterLayer Helper Component
 * Ensures that different layers (Body/Arms) of a character stay perfectly synced.
 */
const CharacterLayer = ({ isRight, children, zIndex }: { isRight: boolean, children: React.ReactNode, zIndex: number }) => (
  <div 
    className={`absolute ${isRight ? 'right-8 md:right-16' : 'left-8 md:left-16'} top-1/2 -translate-y-1/2 scale-75 md:scale-100 origin-center transition-transform duration-300 ease-out`}
    style={{ zIndex }}
  >
    <div className={`flex flex-col items-center origin-bottom ${isRight ? 'scale-x-[-1]' : ''} rotate-[-12deg]`}>
       {children}
    </div>
  </div>
);

/**
 * TugOfWarArena Component
 * 
 * A standalone, minimalist 2D block-style tug-of-war visual.
 * 
 * @param {number} ropePosition - Range 0 to 100, where 50 is center.
 */
const TugOfWarArena = ({ ropePosition = 50 }) => {
  // Calculate relative displacement from center (50)
  // ropePosition range is now -100 to 100 (logicPos), but passed as logicPos + 50.
  // So ropePosition range is -50 to 150.
  // displacement = (ropePosition - 50) * multiplier
  const displacement = (ropePosition - 50) * 3; 

  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes vibrate-rope {
          0%, 100% { transform: translateY(-50%) translateY(0); }
          50% { transform: translateY(-50%) translateY(2px); }
        }
        .animate-vibrate-rope { 
          animation: vibrate-rope 0.15s infinite linear; 
        }
      `}</style>

      {/* Responsive Wrapper Container - Flexible height and wider reach */}
      <div className="relative w-full max-w-2xl md:max-w-4xl h-full flex items-center justify-center px-4 md:px-8">

        {/* Central Balance Line (Static) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-16 bg-slate-400 z-0 opacity-50" />

        {/* Finish Lines (Static) */}
        <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 w-1 md:w-2 h-24 bg-red-500/30 rounded-full z-0 blur-[1px]" />
        <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 w-1 md:w-2 h-24 bg-blue-500/30 rounded-full z-0 blur-[1px]" />

        {/* --- MOVING ARENA GROUP ---
            Everything inside this group moves together and shares the same Stacking Context.
        */}
        <div 
          className="absolute inset-0 pointer-events-none transform scale-100 md:scale-110 origin-center"
          style={{ 
            transform: `translateX(${displacement}px) scale(var(--tw-scale-x))`,   
            '--tw-scale-x': '1',
            '--tw-scale-y': '1'
          } as React.CSSProperties}
        >
          <div className="absolute inset-0 md:scale-110 hidden md:block" style={{ visibility: 'hidden' }} /> {/* Tailwind trigger for scales */}
          
          {/* 1. BODY LAYER (z-10) - Behind the rope */}
          <CharacterLayer isRight={false} zIndex={10}>
            <div className="w-12 h-4 bg-amber-900 rounded-t-md" />
            <div className="w-14 h-3 bg-white relative overflow-hidden border-x border-slate-200">
               <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-red-600" />
            </div>
            <div className="w-12 h-10 bg-orange-100 border-x border-orange-200" />
            <div className="w-16 h-20 bg-purple-600 rounded-sm relative" />
            <div className="flex gap-4 -mt-1">
               <div className="w-6 h-10 bg-slate-400 rounded-b-md" />
               <div className="w-6 h-8 bg-slate-400 rounded-b-md" />
            </div>
          </CharacterLayer>

          <CharacterLayer isRight={true} zIndex={10}>
            <div className="w-12 h-4 bg-amber-900 rounded-t-md" />
            <div className="w-14 h-3 bg-white relative overflow-hidden border-x border-slate-200">
               <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-red-600" />
            </div>
            <div className="w-12 h-10 bg-orange-100 border-x border-orange-200" />
            <div className="w-16 h-20 bg-red-600 rounded-sm relative" />
            <div className="flex gap-4 -mt-1">
               <div className="w-6 h-10 bg-slate-400 rounded-b-md" />
               <div className="w-6 h-8 bg-slate-400 rounded-b-md" />
            </div>
          </CharacterLayer>

          {/* 2. ROPE LAYER (z-20) - In front of body, behind arms */}
          <div 
            className="absolute inset-x-8 md:inset-x-16 top-1/2 -translate-y-1/2 h-4 bg-orange-500 rounded-full flex items-center justify-center z-20 animate-vibrate-rope"
          >
            <div className="w-6 h-10 bg-yellow-400 rounded-md shadow-sm border border-yellow-500" />
          </div>

          {/* 3. ARMS LAYER (z-30) - In front of the rope */}
          <CharacterLayer isRight={false} zIndex={30}>
            <div className="w-12 h-4 opacity-0" />
            <div className="w-14 h-3 opacity-0" />
            <div className="w-12 h-10 opacity-0" />
            <div className="w-16 h-20 relative">
               <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-12 h-5 bg-purple-700 rounded-full border border-purple-800/30" />
            </div>
            <div className="flex gap-4 opacity-0">
               <div className="w-6 h-10" />
               <div className="w-6 h-8" />
            </div>
          </CharacterLayer>

          <CharacterLayer isRight={true} zIndex={30}>
            <div className="w-12 h-4 opacity-0" />
            <div className="w-14 h-3 opacity-0" />
            <div className="w-12 h-10 opacity-0" />
            <div className="w-16 h-20 relative">
               <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-12 h-5 bg-red-700 rounded-full border border-red-800/30" />
            </div>
            <div className="flex gap-4 opacity-0">
               <div className="w-6 h-10" />
               <div className="w-6 h-8" />
            </div>
          </CharacterLayer>

        </div>

      </div>
    </div>
  );
};

export default TugOfWarArena;
