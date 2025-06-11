"use server";

import { getAllGroups, getGroupStats } from '../services/groupService';
import { getAllUsersAction } from '@/features/auth/actions/userActions';
import { getRegistrations } from '@/features/registration/actions/getRegistrations';
import type { GroupData, GroupAssignmentStats } from '../types';
import type { User } from '@/features/admin/components/groups/components/types';
import type { RegistrationWithId } from '@/features/admin/components/groups/components/types';

export interface GroupsData {
  groups: GroupData[];
  statistics: GroupAssignmentStats | null;
  users: User[];
  registrations: RegistrationWithId[];
}

/**
 * Aggregiert alle Daten für das Groups-Management: Gruppen, Statistiken, Benutzer, Anmeldungen
 */
export const fetchGroupsData = async (): Promise<GroupsData> => {
    try {
      const [groupsResult, statsResult, usersData, registrationsData] = await Promise.all([
        getAllGroups(),
        getGroupStats(),
        getAllUsersAction(),
        getRegistrations()
      ]);

      const groups = groupsResult.success && groupsResult.data ? groupsResult.data : [];
      const statistics = statsResult.success && statsResult.data ? statsResult.data : null;

      return {
        groups,
        statistics,
        users: usersData,
        registrations: registrationsData
      };
    } catch (error) {
      console.error('[fetchGroupsData] Fehler beim Laden der Gruppen-Daten:', error);
      return {
        groups: [],
        statistics: null,
        users: [],
        registrations: []
      };
    }
  }; 