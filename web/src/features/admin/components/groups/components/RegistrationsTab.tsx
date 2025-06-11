"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/components/ui/popover';
import { Tooltip } from '@/shared/components/ui/tooltip';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  getPaginationRowModel,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Euro,
  Percent,
  Gift,
  Stethoscope,
  Car as CarIcon,
  Bed,
  Tent,
  Calendar,
  BikeIcon,
  TrainIcon,
  HelpCircle,
  Info,
  Edit,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Shield,
  Camera,
  ChefHat,
  User,
  FileDown,
  FileText,
  Phone,
  MessageCircle,
  Unlink,
  Trash2,
  MoreVertical
} from 'lucide-react';
import type { RegistrationWithId } from './types';
import { unlinkUserRegistrationAction, unlinkRegistrationFromUserAction } from '@/features/registration/actions/unlinkRegistration';
import { deleteRegistrationCompletelyAction } from '@/features/registration/actions/deleteRegistrationCompletely';
import { toast } from 'react-hot-toast';

interface RegistrationsTabProps {
  registrations: RegistrationWithId[];
  onSelectRegistration: (registration: RegistrationWithId) => void;
  onEditRegistration: (registration: RegistrationWithId) => void;
  onRefreshRegistrations?: () => void;
}

const FESTIVAL_DAYS = ["31.07.", "01.08.", "02.08.", "03.08."];

export function RegistrationsTab({
  registrations,
  onSelectRegistration,
  onEditRegistration,
  onRefreshRegistrations
}: RegistrationsTabProps) {
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Registration filters
  const [sleepFilter, setSleepFilter] = useState('');
  const [travelFilter, setTravelFilter] = useState('');
  const [medicFilter, setMedicFilter] = useState(false);
  const [paidFilter, setPaidFilter] = useState('');
  const [checkedInFilter, setCheckedInFilter] = useState('');
  const [awarenessFilter, setAwarenessFilter] = useState(false);
  const [soberFilter, setSoberFilter] = useState(false);
  const [photosFilter, setPhotosFilter] = useState('');
  const [kitchenFilter, setKitchenFilter] = useState(false);

  // New state for registration management
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<string | null>(null);

  // Registration DataTable Setup
  const columnHelper = createColumnHelper<RegistrationWithId>();
  const showSani = useMemo(() => registrations.some(r => r.isMedic), [registrations]);

  const registrationColumns = useMemo<ColumnDef<RegistrationWithId, any>[]>(() => {
    const baseCols: ColumnDef<RegistrationWithId, any>[] = [
      columnHelper.accessor('name', {
        header: () => (
          <Tooltip content="Name">
            <User className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => {
          const name = info.getValue() as string;
          return (
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">{name}</span>
              {info.row.original.isMedic && (
                <Tooltip content="Sanitäter">
                  <Stethoscope className="w-3 h-3 text-blue-500 flex-shrink-0" />
                </Tooltip>
              )}
              {info.row.original.canStaySober && (
                <Tooltip content="Kann nüchtern fahren">
                  <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                </Tooltip>
              )}
              {info.row.original.wantsAwareness && (
                <Tooltip content="Awareness-Team">
                  <Shield className="w-3 h-3 text-purple-500 flex-shrink-0" />
                </Tooltip>
              )}
            </div>
          );
        },
        meta: { className: 'w-[250px] min-w-[250px]' },
        filterFn: (row, columnId, filterValue) =>
          row.getValue<string>(columnId).toLowerCase().includes(filterValue.toLowerCase()),
      }),
      columnHelper.accessor('wantsKitchenHelp', {
        header: () => (
          <Tooltip content="Küche">
            <ChefHat className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => info.getValue() ? (
          <Tooltip content="Küchen-Hilfe">
            <ChefHat className="w-3 h-3 text-green-600" />
          </Tooltip>
        ) : null,
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue(columnId) === true,
      }),
      columnHelper.accessor('allowsPhotos', {
        header: () => (
          <Tooltip content="Fotos">
            <Camera className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => (
          <Tooltip content={info.getValue() ? "Fotos erlaubt" : "Keine Fotos"}>
            <Camera className={`w-3 h-3 ${info.getValue() ? 'text-green-500' : 'text-red-500'}`} />
          </Tooltip>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          if (filterValue === 'allowed') return row.getValue(columnId) === true;
          if (filterValue === 'notAllowed') return row.getValue(columnId) === false;
          return true;
        },
      }),
      columnHelper.accessor('travelType', {
        header: () => (
          <Tooltip content="Anreise">
            <CarIcon className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => {
          const type = info.getValue();
          if (type === 'auto') return <Tooltip content="Auto"><CarIcon className="w-3 h-3 text-[#ff9900]" /></Tooltip>;
          if (type === 'zug') return <Tooltip content="Zug"><TrainIcon className="w-3 h-3 text-[#ff9900]" /></Tooltip>;
          if (type === 'fahrrad') return <Tooltip content="Fahrrad"><BikeIcon className="w-3 h-3 text-[#ff9900]" /></Tooltip>;
          if (type === 'andere') return <Tooltip content="Andere"><HelpCircle className="w-3 h-3 text-[#ff9900]" /></Tooltip>;
        },
        filterFn: (row, columnId, filterValue) => filterValue === '' || row.getValue(columnId) === filterValue,
      }),
      columnHelper.accessor('sleepingPreference', {
        header: () => (
          <Tooltip content="Schlafpräferenz">
            <Bed className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info =>
          info.getValue() === 'bed' ? (
            <Tooltip content="Bett">
              <Bed className="w-3 h-3" />
            </Tooltip>
          ) : info.getValue() === 'tent' ? (
            <Tooltip content="Zelt">
              <Tent className="w-3 h-3" />
            </Tooltip>
          ) : (
            <Tooltip content="Auto (Schlaf)">
              <CarIcon className="w-3 h-3" />
            </Tooltip>
          ),
        filterFn: (row, columnId, filterValue) => filterValue === '' || row.getValue(columnId) === filterValue,
      }),
      columnHelper.accessor(row => {
        return row.days.length;
      }, {
        id: 'tage',
        header: () => (
          <div className="text-center">
            <Tooltip content="Tage">
              <Calendar className="w-3 h-3 mx-auto" />
            </Tooltip>
          </div>
        ),
        cell: info => (
          <div className="text-center">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor('paid', {
        header: () => (
          <Tooltip content="Bezahlstatus">
            <Euro className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => info.getValue() ? (
          <Tooltip content="Bezahlt">
            <Euro className="w-3 h-3 text-green-500" />
          </Tooltip>
        ) : (
          <Tooltip content="Unbezahlt">
            <Euro className="w-3 h-3 text-red-500" />
          </Tooltip>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          if (filterValue === 'paid') return row.getValue(columnId) === true;
          if (filterValue === 'unpaid') return row.getValue(columnId) === false;
          return true;
        },
      }),
      columnHelper.accessor('checkedIn', {
        header: () => (
          <Tooltip content="Anmeldestatus">
            <Info className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => info.getValue() ? (
          <Tooltip content="Angemeldet">
            <Info className="w-3 h-3 text-green-500" />
          </Tooltip>
        ) : (
          <Tooltip content="Nicht angemeldet">
            <Info className="w-3 h-3 text-red-500" />
          </Tooltip>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          if (filterValue === 'checkedIn') return row.getValue(columnId) === true;
          if (filterValue === 'notCheckedIn') return row.getValue(columnId) === false;
          return true;
        },
      }),
    ];

    // Edit column
    baseCols.push({
      id: 'actions',
      header: () => <span className="sr-only">Aktionen</span>,
      cell: info => (
        <div className="flex items-center gap-1">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-[#460b6c] truncate flex-1">{info.row.original.name}</h3>
            <div className="flex items-center gap-1 ml-2 -mt-1 -mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={e => {
                  e.stopPropagation();
                  onEditRegistration(info.row.original);
                }}
              >
                <Edit className="w-4 h-4 text-blue-500" />
              </Button>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === info.row.original._id ? null : info.row.original._id);
                  }}
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </Button>
                
                {openDropdown === info.row.original._id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                    <div className="py-1">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        onClick={e => {
                          e.stopPropagation();
                          handleUnlinkRegistration(info.row.original);
                        }}
                        disabled={isUnlinking}
                      >
                        <Unlink className="w-4 h-4 text-orange-500" />
                        {isUnlinking ? 'Verknüpfung aufheben...' : 'Verknüpfung aufheben'}
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                        onClick={e => {
                          e.stopPropagation();
                          setShowDeleteConfirmation(info.row.original._id);
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        Anmeldung löschen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      meta: { className: 'w-[100px] min-w-[100px] max-w-[100px] p-0 text-center' },
    });
    return baseCols;
  }, [showSani, columnHelper, onEditRegistration]);

  const registrationTable = useReactTable({
    data: useMemo(() => {
      return registrations.filter(registration => {
        // Name search
        if (globalFilter && !registration.name.toLowerCase().includes(globalFilter.toLowerCase())) {
          return false;
        }
        
        // Apply all other filters
        if (sleepFilter && registration.sleepingPreference !== sleepFilter) return false;
        if (travelFilter && registration.travelType !== travelFilter) return false;
        if (medicFilter && !registration.isMedic) return false;
        if (soberFilter && !registration.canStaySober) return false;
        if (awarenessFilter && !registration.wantsAwareness) return false;
        if (kitchenFilter && !registration.wantsKitchenHelp) return false;
        
        if (photosFilter) {
          if (photosFilter === 'allowed' && !registration.allowsPhotos) return false;
          if (photosFilter === 'notAllowed' && registration.allowsPhotos) return false;
        }
        
        if (paidFilter) {
          if (paidFilter === 'paid' && !registration.paid) return false;
          if (paidFilter === 'unpaid' && registration.paid) return false;
        }
        
        if (checkedInFilter) {
          if (checkedInFilter === 'checkedIn' && !registration.checkedIn) return false;
          if (checkedInFilter === 'notCheckedIn' && registration.checkedIn) return false;
        }
        
        return true;
      });
    }, [registrations, globalFilter, sleepFilter, travelFilter, medicFilter, soberFilter, 
        awarenessFilter, kitchenFilter, photosFilter, paidFilter, checkedInFilter]),
    columns: registrationColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: false,
    initialState: {
      pagination: {
        pageSize: rowsPerPage,
      },
    },
  });

  // Registration helper functions
  const sleepOptions = useMemo(() => Array.from(new Set(registrations.map(r => r.sleepingPreference))), [registrations]);
  const travelOptions = useMemo(() => Array.from(new Set(registrations.map(r => r.travelType))), [registrations]);

  const calculateRowsPerPage = () => {
    const height = window.innerHeight;
    const itemHeight = 40; // Estimated row height
    const reservedSpace = 300; // Header, filters, pagination
    const availableSpace = height - reservedSpace;
    const rows = Math.floor(availableSpace / itemHeight);
    setRowsPerPage(Math.max(10, Math.min(50, rows)));
  };

  // CSV Export - Verbesserte Excel-kompatible Version
  const exportCSV = () => {
    // Strukturierte Daten für alle Anmeldungen
    const csvData = registrations.map((reg, idx) => ({
      'Nr.': idx + 1,
      'Name': reg.name,
      'Kontakt-Art': reg.contactType === 'phone' ? 'Telefon' : reg.contactType === 'telegram' ? 'Telegram' : 'Keine Angabe',
      'Kontakt-Info': reg.contactInfo || '—',
      'Erstellt am': new Date(reg.createdAt).toLocaleDateString('de-DE'),
      'Festival-Tage': reg.days.map(i => FESTIVAL_DAYS[i]).join(', '),
      'Anzahl Tage': reg.days.length,
      'Zeitraum': `${FESTIVAL_DAYS[reg.days[0]]} - ${FESTIVAL_DAYS[reg.days[reg.days.length - 1]]}`,
      'Anreise': reg.travelType === 'auto' ? 'Auto' : reg.travelType === 'zug' ? 'Zug' : reg.travelType === 'fahrrad' ? 'Fahrrad' : 'Andere',
      'Schlafplatz': reg.sleepingPreference === 'bed' ? 'Bett' : reg.sleepingPreference === 'tent' ? 'Zelt' : 'Auto',
      'Sanitäter': reg.isMedic ? 'Ja' : 'Nein',
      'Nüchtern fahren': reg.canStaySober ? 'Ja' : 'Nein',
      'Awareness': reg.wantsAwareness ? 'Ja' : 'Nein',
      'Küche helfen': reg.wantsKitchenHelp ? 'Ja' : 'Nein',
      'Fotos erlaubt': reg.allowsPhotos ? 'Ja' : 'Nein',
      'Bezahlt': reg.paid ? 'Ja' : 'Nein',
      'Eingecheckt': reg.checkedIn ? 'Ja' : 'Nein',
      'Programmpunkt': reg.programContribution || '—',
      'Equipment': reg.equipment || '—',
      'Workshop-Angebot': reg.wantsToOfferWorkshop || '—',
      'Line-Up Beitrag': reg.lineupContribution || '—',
      'Allergien': reg.allergies || '—',
      'Anliegen': reg.concerns || '—'
    }));

    // CSV Headers
    const headers = Object.keys(csvData[0]);
    
    // CSV Content erstellen
    const csvRows = [
      headers.join(';'), // Header-Zeile mit Semikolon für deutsche Excel-Kompatibilität
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Werte in Anführungszeichen setzen, falls sie Kommas oder Semikolons enthalten
          const stringValue = String(value);
          if (stringValue.includes(';') || stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(';')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    
    // BOM für UTF-8 hinzufügen für bessere Excel-Kompatibilität
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Dateiname mit Datum
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD Format
    link.setAttribute('download', `hügelfest-anmeldungen-${dateString}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  // Effects for registration filters
  useEffect(() => {
    calculateRowsPerPage();
    window.addEventListener('resize', calculateRowsPerPage);
    return () => {
      window.removeEventListener('resize', calculateRowsPerPage);
    };
  }, []);

  useEffect(() => {
    registrationTable.setPageSize(rowsPerPage);
    registrationTable.setPageIndex(0);
  }, [rowsPerPage, registrationTable]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Handler für Verknüpfung aufheben
  const handleUnlinkRegistration = async (registration: RegistrationWithId) => {
    setIsUnlinking(true);
    setOpenDropdown(null);
    try {
      const result = await unlinkRegistrationFromUserAction(registration._id);
      if (result.success) {
        toast.success(`Verknüpfung von ${registration.name} aufgehoben`);
        onRefreshRegistrations?.();
      } else {
        toast.error(result.error || 'Fehler beim Aufheben der Verknüpfung');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsUnlinking(false);
    }
  };

  // Handler für Registration komplett löschen
  const handleDeleteRegistration = async (registration: RegistrationWithId) => {
    setIsDeleting(true);
    setOpenDropdown(null);
    setShowDeleteConfirmation(null);
    try {
      const result = await deleteRegistrationCompletelyAction(registration._id);
      if (result.success) {
        toast.success(`Anmeldung von ${registration.name} wurde gelöscht`);
        onRefreshRegistrations?.();
      } else {
        toast.error(result.error || 'Fehler beim Löschen der Anmeldung');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-300px)] flex flex-col">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end sticky top-0 bg-white z-10 p-2">
        <Input
          placeholder="Name suchen..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="w-40"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <span>Filter</span>
              {(sleepFilter || travelFilter || medicFilter || soberFilter || awarenessFilter || kitchenFilter || photosFilter || paidFilter || checkedInFilter) && (
                <div className="w-2 h-2 rounded-full bg-[#ff9900]" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="bg-white p-4 rounded shadow min-w-[280px]">
            <div className="flex flex-col gap-4">
              {/* Status Filters */}
              <div>
                <h3 className="font-medium text-[#460b6c] mb-2">Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Bezahlung</label>
                    <select value={paidFilter} onChange={e => setPaidFilter(e.target.value)} className="w-full mt-1 border rounded px-2 py-1 text-sm">
                      <option value="">Alle</option>
                      <option value="paid">Bezahlt</option>
                      <option value="unpaid">Unbezahlt</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Check-In</label>
                    <select value={checkedInFilter} onChange={e => setCheckedInFilter(e.target.value)} className="w-full mt-1 border rounded px-2 py-1 text-sm">
                      <option value="">Alle</option>
                      <option value="checkedIn">Angemeldet</option>
                      <option value="notCheckedIn">Nicht angemeldet</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Travel & Sleep */}
              <div>
                <h3 className="font-medium text-[#460b6c] mb-2">Anreise & Übernachtung</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Schlafplatz</label>
                    <select value={sleepFilter} onChange={e => setSleepFilter(e.target.value)} className="w-full mt-1 border rounded px-2 py-1 text-sm">
                      <option value="">Alle</option>
                      {sleepOptions.map(opt => (
                        <option key={opt} value={opt}>{opt === 'bed' ? 'Bett' : opt === 'tent' ? 'Zelt' : 'Auto'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Anreise</label>
                    <select value={travelFilter} onChange={e => setTravelFilter(e.target.value)} className="w-full mt-1 border rounded px-2 py-1 text-sm">
                      <option value="">Alle</option>
                      {travelOptions.map(opt => (
                        <option key={opt} value={opt}>{opt === 'auto' ? 'Auto' : opt === 'zug' ? 'Zug' : opt === 'fahrrad' ? 'Fahrrad' : 'Andere'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Roles & Preferences */}
              <div>
                <h3 className="font-medium text-[#460b6c] mb-2">Rollen & Präferenzen</h3>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={medicFilter} 
                      onChange={e => setMedicFilter(e.target.checked)}
                      className="rounded border-gray-300 text-[#ff9900] focus:ring-[#ff9900]"
                    />
                    <span>Sanitäter</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={soberFilter} 
                      onChange={e => setSoberFilter(e.target.checked)}
                      className="rounded border-gray-300 text-[#ff9900] focus:ring-[#ff9900]"
                    />
                    <span>Nüchtern fahren</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={awarenessFilter} 
                      onChange={e => setAwarenessFilter(e.target.checked)}
                      className="rounded border-gray-300 text-[#ff9900] focus:ring-[#ff9900]"
                    />
                    <span>Awareness</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={kitchenFilter} 
                      onChange={e => setKitchenFilter(e.target.checked)}
                      className="rounded border-gray-300 text-[#ff9900] focus:ring-[#ff9900]"
                    />
                    <span>Küche</span>
                  </label>
                </div>
              </div>

              {/* Photos */}
              <div>
                <h3 className="font-medium text-[#460b6c] mb-2">Fotos</h3>
                <select value={photosFilter} onChange={e => setPhotosFilter(e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
                  <option value="">Alle</option>
                  <option value="allowed">Erlaubt</option>
                  <option value="notAllowed">Nicht erlaubt</option>
                </select>
              </div>

              {/* Reset Button */}
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  setSleepFilter('');
                  setTravelFilter('');
                  setMedicFilter(false);
                  setSoberFilter(false);
                  setAwarenessFilter(false);
                  setKitchenFilter(false);
                  setPhotosFilter('');
                  setPaidFilter('');
                  setCheckedInFilter('');
                }}
              >
                Filter zurücksetzen
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Export Buttons */}
        <div className="flex gap-2 ml-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportCSV}
            className="flex items-center gap-2 text-[#460b6c] border-[#ff9900] hover:bg-[#ff9900]/10"
          >
            <FileDown className="w-4 h-4" />
            CSV Export
          </Button>
        </div>
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
            {registrationTable.getRowModel().rows.map(row => (
            <div
                key={row.id}
                onClick={() => onSelectRegistration(row.original)}
              className="bg-white rounded-xl shadow-sm border border-[#ff9900]/20 p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-[#ff9900]/40"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectRegistration(row.original); }}
                aria-label={`Details zu ${row.original.name} anzeigen`}
              >
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-[#460b6c] truncate flex-1">{row.original.name}</h3>
                <div className="flex items-center gap-1 ml-2 -mt-1 -mr-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation();
                      onEditRegistration(row.original);
                    }}
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === row.original._id ? null : row.original._id);
                      }}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </Button>
                    
                    {openDropdown === row.original._id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                        <div className="py-1">
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            onClick={e => {
                              e.stopPropagation();
                              handleUnlinkRegistration(row.original);
                            }}
                            disabled={isUnlinking}
                          >
                            <Unlink className="w-4 h-4 text-orange-500" />
                            {isUnlinking ? 'Verknüpfung aufheben...' : 'Verknüpfung aufheben'}
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                            onClick={e => {
                              e.stopPropagation();
                              setShowDeleteConfirmation(row.original._id);
                            }}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            Anmeldung löschen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex flex-wrap items-center gap-2 mt-2 mb-3">
                {row.original.isMedic && (
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full text-xs">
                    <Stethoscope className="w-3 h-3" />
                    <span>Sani</span>
                  </div>
                )}
                {row.original.canStaySober && (
                  <div className="flex items-center gap-1 bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Fahrer</span>
                  </div>
                )}
                {row.original.wantsAwareness && (
                  <div className="flex items-center gap-1 bg-purple-50 text-purple-500 px-2 py-0.5 rounded-full text-xs">
                    <Shield className="w-3 h-3" />
                    <span>Awareness-Team</span>
                  </div>
                )}
                {row.original.wantsKitchenHelp && (
                  <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs">
                    <ChefHat className="w-3 h-3" />
                    <span>Küche</span>
                  </div>
                )}
              </div>

              {/* Travel & Sleep */}
              <div className="flex items-center justify-between text-sm text-[#460b6c] mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{row.original.days.length} Tage</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Sleep Icon */}
                  {row.original.sleepingPreference === 'bed' ? (
                    <Tooltip content="Bett">
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                      </div>
                    </Tooltip>
                  ) : row.original.sleepingPreference === 'tent' ? (
                    <Tooltip content="Zelt">
                      <div className="flex items-center gap-1">
                        <Tent className="w-4 h-4" />
                      </div>
                    </Tooltip>
                  ) : (
                    <Tooltip content="Auto">
                      <div className="flex items-center gap-1">
                        <CarIcon className="w-4 h-4" />
                      </div>
                    </Tooltip>
                  )}
                  {/* Travel Icon */}
                  {row.original.travelType === 'auto' ? (
                    <Tooltip content="Anreise: Auto">
                      <CarIcon className="w-4 h-4" />
                    </Tooltip>
                  ) : row.original.travelType === 'zug' ? (
                    <Tooltip content="Anreise: Zug">
                      <TrainIcon className="w-4 h-4" />
                    </Tooltip>
                  ) : row.original.travelType === 'fahrrad' ? (
                    <Tooltip content="Anreise: Fahrrad">
                      <BikeIcon className="w-4 h-4" />
                    </Tooltip>
                  ) : (
                    <Tooltip content="Anreise: Andere">
                      <HelpCircle className="w-4 h-4" />
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Tooltip content={row.original.paid ? "Bezahlt" : "Unbezahlt"}>
                    <div className={`flex items-center gap-1 ${row.original.paid ? 'text-green-500' : 'text-red-500'}`}>
                      <Euro className="w-4 h-4" />
                    </div>
                  </Tooltip>
                  <Tooltip content={row.original.checkedIn ? "Angemeldet" : "Nicht angemeldet"}>
                    <div className={`flex items-center gap-1 ${row.original.checkedIn ? 'text-green-500' : 'text-red-500'}`}>
                      <Info className="w-4 h-4" />
                    </div>
                  </Tooltip>
                  <Tooltip content={row.original.allowsPhotos ? "Fotos erlaubt" : "Keine Fotos"}>
                    <div className={`flex items-center gap-1 ${row.original.allowsPhotos ? 'text-green-500' : 'text-red-500'}`}>
                      <Camera className="w-4 h-4" />
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center p-2 bg-[#ff9900]/5 sticky bottom-0">
        <Button size="icon" variant="ghost" disabled={!registrationTable.getCanPreviousPage()} onClick={() => registrationTable.previousPage()}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs">
          Seite {registrationTable.getState().pagination.pageIndex + 1} / {registrationTable.getPageCount()} 
          <span className="ml-2 text-gray-500">
            ({registrationTable.getFilteredRowModel().rows.length} Anmeldungen)
          </span>
        </span>
        <Button size="icon" variant="ghost" disabled={!registrationTable.getCanNextPage()} onClick={() => registrationTable.nextPage()}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Anmeldung löschen
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Sind Sie sicher, dass Sie diese Anmeldung <strong>komplett löschen</strong> möchten? 
              Dabei wird auch die Verknüpfung mit dem User-Account aufgehoben.
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirmation(null)}
                disabled={isDeleting}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const registration = registrations.find(r => r._id === showDeleteConfirmation);
                  if (registration) {
                    handleDeleteRegistration(registration);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Löschen...
                  </>
                ) : (
                  'Endgültig löschen'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 