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
  Eye, 
  User as UserIcon,
  Clock,
  MoreVertical,
  UserCheck,
  UserX,
  Key,
  EyeOff
} from 'lucide-react';
import { sendPasswordResetAction } from '@/features/auth/actions/passwordReset';
import { changeUserRoleAction, changeShadowUserStatusAction } from '@/features/auth/actions/userActions';
import { useAuth } from '@/features/auth/AuthContext';
import toast from 'react-hot-toast';

interface ShadowUser {
  _id: string;
  name: string;
  email?: string;
  username?: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  isShadowUser?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
}

interface ShadowUserManagementProps {
  shadowUsers: ShadowUser[];
  onRefreshUsers?: () => void;
}

export function ShadowUserManagement({ shadowUsers, onRefreshUsers }: ShadowUserManagementProps) {
  const { user: currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ShadowUser | null>(null);
  const [sentResets, setSentResets] = useState<Set<string>>(new Set());

  // Filter shadow users based on search term
  const filteredShadowUsers = shadowUsers.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

  const handleSendPasswordReset = async (user: ShadowUser) => {
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

  const handleChangeUserRole = async (user: ShadowUser, newRole: 'user' | 'admin') => {
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

  const handleRestoreFromShadow = async (user: ShadowUser) => {
    setIsUpdatingUser(true);
    setSelectedUser(user);
    setOpenDropdown(null);

    try {
      const result = await changeShadowUserStatusAction(user._id, false);
      
      if (result.success) {
        toast.success(`${user.name} wurde aus dem Shadow-Modus entfernt`);
        if (onRefreshUsers) {
          onRefreshUsers();
        }
      } else {
        toast.error(result.error || 'Fehler beim Entfernen aus Shadow-Modus');
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

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nur Administratoren können Shadow-User verwalten.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeOff className="h-5 w-5 text-purple-600" />
          Shadow User Verwaltung
        </CardTitle>
        <CardDescription>
          Ausgeblendete Benutzer verwalten - diese sind für normale User nicht sichtbar
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Shadow User suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">{filteredShadowUsers.length}</div>
            <div className="text-sm text-purple-600">Shadow User</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {filteredShadowUsers.filter(u => u.email).length}
            </div>
            <div className="text-sm text-gray-600">Mit E-Mail</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">
              {sentResets.size}
            </div>
            <div className="text-sm text-orange-600">Reset-Links gesendet</div>
          </div>
        </div>

        {/* Shadow User List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredShadowUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <EyeOff className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Keine Shadow User gefunden</p>
              <p className="text-sm mt-2">Shadow User sind ausgeblendete Accounts, die nur von Admins verwaltet werden können.</p>
            </div>
          ) : (
            filteredShadowUsers.map(user => (
              <div 
                key={user._id}
                className={`border border-purple-200 rounded-lg p-4 bg-purple-50/50 transition-colors ${
                  sentResets.has(user._id) ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 opacity-75">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-700 truncate">
                        {user.name}
                      </h3>
                      
                      {/* Role Badge */}
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="opacity-75">
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                      
                      {/* Shadow Badge */}
                      <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-100">
                        Shadow
                      </Badge>
                      
                      {/* Reset sent indicator */}
                      {sentResets.has(user._id) && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Reset gesendet
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500 space-y-1">
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
                      className="border-purple-300 hover:bg-purple-50"
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
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1" />
                          {isSendingReset ? 'Sende...' : 'Aktualisiere...'}
                        </>
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {openDropdown === user._id && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {/* Wiederherstellen */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreFromShadow(user)}
                        className="bg-white border-green-300 text-green-700 hover:bg-green-50"
                        disabled={isUpdatingUser}
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        Sichtbar machen
                      </Button>
                      
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
                    </div>
                    
                    {/* Hinweise */}
                    <div className="text-xs text-gray-500 mt-2">
                      <div className="text-purple-600 mb-1">
                        ⚠️ Shadow User sind für normale User nicht sichtbar und können nur von Admins verwaltet werden.
                      </div>
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
          <EyeOff className="h-4 w-4" />
          <AlertDescription>
            <strong>Shadow User:</strong> Diese Accounts sind für normale User unsichtbar und können nur von Administratoren verwaltet werden.
            Um einen Shadow User wieder sichtbar zu machen, klicken Sie auf "Sichtbar machen".
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 