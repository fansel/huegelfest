export interface GroupData {
  id: string;
  name: string;
  color: string;
  isAssignable: boolean;
  maxMembers?: number;
  description?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  deviceId: string;
  isRegistered: boolean;
  registrationDate?: string;
  joinedGroupAt: string;
}

export interface CreateGroupData {
  name: string;
  color: string;
  isAssignable: boolean;
  maxMembers?: number;
  description?: string;
}

export interface UpdateGroupData {
  name?: string;
  color?: string;
  isAssignable?: boolean;
  maxMembers?: number;
  description?: string;
}

export interface GroupWithMembers extends GroupData {
  members: GroupMember[];
}

export interface GroupAssignmentStats {
  totalUsers: number;
  usersWithGroups: number;
  usersWithoutGroups: number;
  assignableGroups: number;
  nonAssignableGroups: number;
} 