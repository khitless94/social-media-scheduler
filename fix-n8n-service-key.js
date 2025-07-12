// Script to fix the service key in the n8n workflow JSON
// Run this in Node.js to update the service key

import fs from 'fs';

const OLD_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MDkzNywiZXhwIjoyMDY0NzY2OTM3fQ.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MDkzNywiZXhwIjoyMDY0NzY2OTM3fQ.oUxZvopxq77zraXu4h3C2v31YSSRUZqwrXc48d-R8Zs";

try {
  // Read the original workflow file
  const workflowContent = fs.readFileSync('n8n-social-media-scheduler.json', 'utf8');
  
  // Replace all instances of the old service key with the new one
  const fixedContent = workflowContent.replace(new RegExp(OLD_SERVICE_KEY, 'g'), NEW_SERVICE_KEY);
  
  // Write the fixed content to a new file
  fs.writeFileSync('n8n-social-media-scheduler-corrected.json', fixedContent);
  
  console.log('✅ Service key updated successfully!');
  console.log('📁 Fixed workflow saved as: n8n-social-media-scheduler-corrected.json');
  console.log('');
  console.log('🔧 Next steps:');
  console.log('1. Import n8n-social-media-scheduler-corrected.json into n8n');
  console.log('2. Activate the workflow');
  console.log('3. Test with a scheduled post');
  
} catch (error) {
  console.error('❌ Error fixing service key:', error.message);
}
