// Legacy component (client-side data fetching)
export { GroupsOverview } from './GroupsOverview';

// Updated component (using fetchGroupsData action)
export { GroupsOverviewUpdated } from './GroupsOverviewUpdated';

// Real-time components
export { GroupsOverviewWebSocket } from './GroupsOverviewWebSocket';
export { GroupsOverviewRealtime } from './GroupsOverviewRealtime';
export { GroupsOverviewPolling } from './GroupsOverviewPolling';

// Server-side rendering components
export { GroupsOverviewServer } from './GroupsOverviewServer';
export { GroupsOverviewClient } from './GroupsOverviewClient';

// Sub-components
export { GroupsTab } from './GroupsTab';
export { UsersTab } from './UsersTab';
export { RegistrationsTab } from './RegistrationsTab'; 