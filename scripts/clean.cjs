const fs = require('node:fs');
for (const dir of ['.test-build', 'dist']) {
  fs.rmSync(dir, { recursive: true, force: true });
}
