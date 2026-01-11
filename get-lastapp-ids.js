/**
 * Last.app IDs Helper Script
 *
 * Execute this script in the browser console to get your Organization and Location IDs
 *
 * HOW TO USE:
 * 1. Open http://localhost:8080 in your browser
 * 2. Open DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire file and press Enter
 * 5. Copy the IDs and update your .env.local file
 */

(async function getLastAppIDs() {
  console.log('🔍 Fetching Last.app Organizations and Locations...\n');

  try {
    // Import the service
    const { lastAppService } = await import('/src/services/lastapp.ts');

    // Check if authenticated
    if (!lastAppService.isAuthenticated()) {
      console.error('❌ ERROR: Not authenticated!');
      console.log('Please configure VITE_LASTAPP_TOKEN in .env.local first.');
      return;
    }

    // Step 1: Get Organizations
    console.log('📋 Step 1: Fetching Organizations...');
    const organizations = await lastAppService.getOrganizations();

    if (organizations.length === 0) {
      console.log('⚠️  No organizations found for this token.');
      return;
    }

    console.log(`\n✅ Found ${organizations.length} organization(s):\n`);

    // Display organizations
    console.table(organizations.map(org => ({
      'ID': org.id,
      'Name': org.name,
      'Currency': org.currency,
      'Timezone': org.timezone
    })));

    // Step 2: Get Locations for each organization
    for (const org of organizations) {
      console.log(`\n📍 Step 2: Fetching Locations for "${org.name}"...`);

      try {
        const locations = await lastAppService.getLocations(org.id);

        if (locations.length === 0) {
          console.log(`   ⚠️  No locations found for this organization.`);
          continue;
        }

        console.log(`   ✅ Found ${locations.length} location(s):\n`);

        console.table(locations.map(loc => ({
          'ID': loc.id,
          'Name': loc.name,
          'City': loc.city,
          'Address': loc.address
        })));

      } catch (error) {
        console.error(`   ❌ Error fetching locations for ${org.name}:`, error.message);
      }
    }

    // Step 3: Generate .env.local content
    console.log('\n📝 CONFIGURATION FOR .env.local:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Copy the following lines to your .env.local file:\n');

    if (organizations.length === 1) {
      const org = organizations[0];
      console.log(`VITE_LASTAPP_ORGANIZATION_ID=${org.id}`);

      // Get locations for the single org
      const locations = await lastAppService.getLocations(org.id);
      if (locations.length === 1) {
        console.log(`VITE_LASTAPP_LOCATION_ID=${locations[0].id}`);
      } else if (locations.length > 1) {
        console.log(`# Choose one of these Location IDs:`);
        locations.forEach(loc => {
          console.log(`# VITE_LASTAPP_LOCATION_ID=${loc.id}  # ${loc.name} - ${loc.city}`);
        });
      }
    } else {
      console.log('# Choose one Organization ID:');
      for (const org of organizations) {
        console.log(`# VITE_LASTAPP_ORGANIZATION_ID=${org.id}  # ${org.name}`);
      }
      console.log('\n# After choosing an organization, uncomment and set the Location ID:');
      console.log('# VITE_LASTAPP_LOCATION_ID=your_location_id_here');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Copy the IDs above');
    console.log('2. Update .env.local file');
    console.log('3. Restart the dev server: Ctrl+C then npm run dev');
    console.log('4. Go to /settings to validate');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\nPossible solutions:');
    console.log('- Make sure VITE_LASTAPP_TOKEN is configured in .env.local');
    console.log('- Restart the dev server to load new environment variables');
    console.log('- Check that the token is valid');
  }
})();
