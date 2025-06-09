'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Shield, 
  User as UserIcon,
  Clock,
  Send,
  MoreVertical,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Key,
  Archive
} from 'lucide-react';
import { sendPasswordResetAction } from '@/features/auth/actions/passwordReset';
import { changeUserRoleAction, changeShadowUserStatusAction } from '@/features/auth/actions/userActions';
import { useAuth } from '@/features/auth/AuthContext';
import toast from 'react-hot-toast';
import { ShadowUserArchive } from './ShadowUserArchive';

interface UserForReset {
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

interface UserManagementActionsProps {
  users: UserForReset[];
  onRefreshUsers: () => void;
}

export function UserManagementActions({ users, onRefreshUsers }: UserManagementActionsProps) {
  const { user: currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserForReset | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [sentResets, setSentResets] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Du hast keine Berechtigung für User-Management-Aktionen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Filter out shadow users from the main view
  const filteredUsers = users
    .filter(user => 
      !user.isShadowUser && (
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get shadow users for the archive
  const shadowUsers = users.filter(user => user.isShadowUser);

  const handleSendPasswordReset = async (user: UserForReset) => {
    if (!user.email) {
      toast.error('Dieser User hat keine E-Mail-Adresse hinterlegt');
      return;
    }

    setIsSendingReset(true);
    setSelectedUser(user);
    setOpenDropdown(null);

    try {
      const result = await sendPasswordResetAction(user.email);
      
      if (result.success) {
        setSentResets(prev => new Set(prev).add(user._id));
        toast.success(`Passwort-Reset-Link an ${user.name} gesendet`);
      } else {
        toast.error(result.error || 'Fehler beim Senden des Reset-Links');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSendingReset(false);
      setSelectedUser(null);
    }
  };

  const handleChangeUserRole = async (user: UserForReset, newRole: 'user' | 'admin') => {
    if (user._id === currentUser?.id && newRole === 'user') {
      toast.error('Sie können sich nicht selbst die Admin-Berechtigung entziehen');
      return;
    }

    setIsUpdatingUser(true);
    setSelectedUser(user);
    setOpenDropdown(null);

    try {
      const result = await changeUserRoleAction(user._id, newRole);
      
      if (result.success) {
        toast.success(`${user.name} ist jetzt ${newRole === 'admin' ? 'Admin' : 'normaler User'}`);
        if (onRefreshUsers) {
          onRefreshUsers();
        }
      } else {
        toast.error(result.error || 'Fehler beim Ändern der Rolle');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsUpdatingUser(false);
      setSelectedUser(null);
    }
  };

  const handleChangeShadowStatus = async (user: UserForReset, isShadowUser: boolean) => {
    setIsUpdatingUser(true);
    setSelectedUser(user);
    setOpenDropdown(null);

    try {
      const result = await changeShadowUserStatusAction(user._id, isShadowUser);
      
      if (result.success) {
        toast.success(`${user.name} ist jetzt ${isShadowUser ? 'Shadow User' : 'sichtbarer User'}`);
        if (onRefreshUsers) {
          onRefreshUsers();
        }
      } else {
        toast.error(result.error || 'Fehler beim Ändern des Shadow-Status');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsUpdatingUser(false);
      setSelectedUser(null);
    }
  };

  const handleArchiveUser = async (user: UserForReset) => {
    if (user._id === currentUser?.id) {
      toast.error('Sie können sich nicht selbst archivieren');
      return;
    }

    setIsUpdatingUser(true);
    setSelectedUser(user);
    setOpenDropdown(null);

    try {
      const result = await changeShadowUserStatusAction(user._id, true);
      
      if (result.success) {
        toast.success(`${user.name} wurde archiviert`);
        if (onRefreshUsers) {
          onRefreshUsers();
        }
      } else {
        toast.error(result.error || 'Fehler beim Archivieren des Users');
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
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#ff9900]" />
              <CardTitle className="flex-1">Benutzerverwaltung</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 -mr-2"
                onClick={() => setShowArchive(!showArchive)}
                title={showArchive ? "Aktive User anzeigen" : `Archiv (${shadowUsers.length})`}
              >
                {showArchive ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>
            </div>
            <CardDescription>
              Benutzerverwaltung mit Passwort-Reset und Rollenverwaltung
            </CardDescription>
          </div>
        </CardHeader>
        
        {showArchive ? (
          <CardContent className="p-0">
            <ShadowUserArchive 
              shadowUsers={shadowUsers}
              onRefreshUsers={onRefreshUsers}
            />
          </CardContent>
        ) : (
          <CardContent className="p-4 sm:p-6">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="User suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-blue-700">{filteredUsers.length}</div>
                <div className="text-xs text-blue-600">User</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-green-700">
                  {filteredUsers.filter(u => u.email).length}
                </div>
                <div className="text-xs text-green-600">Mit E-Mail</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-orange-700">
                  {sentResets.size}
                </div>
                <div className="text-xs text-orange-600">Resets</div>
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Keine User gefunden</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user._id}
                    className={`bg-white border rounded-lg p-3 ${
                      sentResets.has(user._id) ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
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
                          
                          {/* Reset sent indicator */}
                          {sentResets.has(user._id) && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Reset gesendet
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          {user.email ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="font-mono">{user.email}</span>
                            </div>
                          ) : (
                            <div className="text-orange-600">
                              <AlertCircle className="h-3 w-3 inline mr-1" />
                              Keine E-Mail hinterlegt
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
                          disabled={isSendingReset || isUpdatingUser}
                          className="border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            if (openDropdown === user._id) {
                              setOpenDropdown(null);
                            } else {
                              setOpenDropdown(user._id);
                            }
                          }}
                        >
                          {(isSendingReset || isUpdatingUser) && selectedUser?._id === user._id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1" />
                              {isSendingReset ? 'Sende...' : 'Aktualisiere...'}
                            </>
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {openDropdown === user._id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {/* Passwort Reset - nur wenn E-Mail vorhanden */}
                          {user.email && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendPasswordReset(user)}
                              className="bg-white"
                              disabled={!user.email || isSendingReset || isUpdatingUser}
                            >
                              <Key className="mr-2 h-3 w-3" />
                              {sentResets.has(user._id) ? 'Reset erneut senden' : 'Passwort-Reset'}
                            </Button>
                          )}
                          
                          {/* Admin Status Toggle */}
                          {user.role === 'admin' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChangeUserRole(user, 'user')}
                              className="bg-white"
                              disabled={user._id === currentUser?.id || isUpdatingUser}
                            >
                              <UserX className="mr-2 h-3 w-3" />
                              Admin entfernen
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChangeUserRole(user, 'admin')}
                              className="bg-white"
                              disabled={isUpdatingUser}
                            >
                              <UserCheck className="mr-2 h-3 w-3" />
                              Zu Admin machen
                            </Button>
                          )}
                          
                          {/* Shadow User Status Toggle */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeShadowStatus(user, true)}
                            className="bg-white"
                            disabled={isUpdatingUser}
                          >
                            <EyeOff className="mr-2 h-3 w-3" />
                            Als Shadow User
                          </Button>
                          
                          {/* Archive User Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleArchiveUser(user)}
                            className="bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                            disabled={user._id === currentUser?.id || isUpdatingUser}
                          >
                            <Archive className="mr-2 h-3 w-3" />
                            User archivieren
                          </Button>
                        </div>
                        
                        {/* Hinweise */}
                        <div className="text-xs text-gray-500 mt-2">
                          {user._id === currentUser?.id && (
                            <div className="text-orange-600">Sie können sich nicht selbst die Admin-Berechtigung entziehen</div>
                          )}
                          {!user.email && (
                            <div className="text-orange-600">Passwort-Reset nicht möglich: Keine E-Mail hinterlegt</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Info Box */}
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Hinweise:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Reset-Links sind 10 Minuten gültig</li>
                  <li>User ohne E-Mail-Adresse können keinen Reset-Link erhalten</li>
                  <li>Du kannst dir selbst keinen Reset-Link senden</li>
                  <li>E-Mails werden auch an unverifiziertée Adressen gesendet</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>
    </div>
  );
} 