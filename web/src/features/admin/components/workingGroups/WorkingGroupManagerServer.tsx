import React from 'react';
import { getWorkingGroupsArrayAction } from '../../../workingGroups/actions/getWorkingGroupColors';
import WorkingGroupManagerClient from './WorkingGroupManagerClient';

export default async function WorkingGroupManagerServer() {
  // Load initial data server-side
  const initialWorkingGroups = await getWorkingGroupsArrayAction();
  
  return (
    <WorkingGroupManagerClient 
      initialWorkingGroups={initialWorkingGroups}
    />
  );
} 