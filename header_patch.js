const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const btn = `
          <span className="text-blue-200 opacity-60">|</span>
          <button
            id="nav-studio"
            onClick={() => {
              sounds.playClick();
              onNavigate('studio');
            }}
            className={\`px-2 py-0.5 hover:underline transition-colors cursor-pointer \${
              currentPage === 'studio' ? 'text-yellow-300 underline font-black' : 'text-white'
            }\`}
          >
            Studio
          </button>
`;

code = code.replace('<span className="text-blue-200 opacity-60">|</span>', btn);
fs.writeFileSync('src/components/Header.tsx', code);
