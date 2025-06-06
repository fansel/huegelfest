'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Search, 
  User as UserIcon,
  Clock,
  MoreVertical,
  Eye,
  EyeOff,
  Key,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { changeShadowUserStatusAction } from '@/features/auth/actions/userActions';
import { useAuth } from '@/features/auth/AuthContext';
import toast from 'react-hot-toast';

interface ShadowUser {
  _id: string;
  name: string;
  email?: string;
  username?: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  isShadowUser: boolean;
  lastLogin?: Date;
  createdAt?: Date;
}

interface ShadowUserArchiveProps {
  shadowUsers: ShadowUser[];
  onRefreshUsers: () => void;
}

export function ShadowUserArchive({ shadowUsers, onRefreshUsers }: ShadowUserArchiveProps) {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ShadowUser | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  if (!isAdmin) {
    return null;
  }

  // Filter and sort shadow users
  const filteredUsers = shadowUsers
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleRestoreUser = async (user: ShadowUser) => {
    setIsUpdatingUser(true);
    setSelectedUser(user);
    setOpenDropdown(null);

    try {
      const result = await changeShadowUserStatusAction(user._id, false);
      
      if (result.success) {
        toast.success(`${user.name} wurde wiederhergestellt`);
        onRefreshUsers();
      } else {
        toast.error(result.error || 'Fehler beim Wiederherstellen des Users');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsUpdatingUser(false);
      setSelectedUser(null);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Nie';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-purple-600" />
          Shadow User Archiv
        </CardTitle>
        <CardDescription>
          Verwaltung archivierter Shadow User
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Shadow User suchen (Name, E-Mail, Username)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* User List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Archive className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Keine archivierten Shadow User gefunden</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user._id}
                className="border border-purple-200 rounded-lg p-4 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {user.name}
                      </h3>
                      
                      {/* Role Badge */}
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                      
                      {/* Shadow Badge */}
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        <Archive className="h-3 w-3 mr-1" />
                        Archiviert
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{user.email}</span>
                        </div>
                      )}
                      
                      {user.username && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          <span>@{user.username}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>Letzter Login: {formatDate(user.lastLogin)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdatingUser}
                      className="border-purple-300 hover:bg-purple-50"
                      onClick={() => {
                        if (openDropdown === user._id) {
                          setOpenDropdown(null);
                        } else {
                          setOpenDropdown(user._id);
                        }
                      }}
                    >
                      {(isUpdatingUser && selectedUser?._id === user._id) ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1" />
                          Aktualisiere...
                        </>
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {openDropdown === user._id && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreUser(user)}
                      className="w-full justify-start bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                      disabled={isUpdatingUser}
                    >
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      <span className="truncate">User wiederherstellen</span>
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 