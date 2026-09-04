const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("import { ForumPage } from './components/ForumPage';", "import { ForumPage } from './components/ForumPage';\nimport { VerlexStudioPage } from './components/VerlexStudioPage';");

code = code.replace("{currentSitePage === 'forum' && <ForumPage />}", "{currentSitePage === 'forum' && <ForumPage />}\n        {currentSitePage === 'studio' && <VerlexStudioPage onLaunchGame={() => handleLaunch3DGame('studio_map')} />}");

fs.writeFileSync('src/App.tsx', code);
