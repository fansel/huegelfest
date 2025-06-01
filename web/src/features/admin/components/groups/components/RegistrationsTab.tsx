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
  MessageCircle
} from 'lucide-react';
import type { RegistrationWithId } from './types';

interface RegistrationsTabProps {
  registrations: RegistrationWithId[];
  onSelectRegistration: (registration: RegistrationWithId) => void;
  onEditRegistration: (registration: RegistrationWithId) => void;
}

const FESTIVAL_DAYS = ["31.07.", "01.08.", "02.08.", "03.08."];

export function RegistrationsTab({
  registrations,
  onSelectRegistration,
  onEditRegistration
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
          const [vorname, ...rest] = name.trim().split(' ');
          const nachname = rest.length > 0 ? rest[0] : '';
          const display = nachname ? `${vorname} ${nachname.charAt(0).toUpperCase()}.` : vorname;
          return (
            <span className="max-w-[80px] whitespace-nowrap overflow-hidden text-ellipsis inline-block align-bottom">{display}</span>
          );
        },
        filterFn: (row, columnId, filterValue) =>
          row.getValue<string>(columnId).toLowerCase().includes(filterValue.toLowerCase()),
      }),
      columnHelper.accessor(row => {
        if (row.contactType === 'none' || !row.contactInfo?.trim()) return '';
        return `${row.contactType === 'phone' ? 'Tel' : 'TG'}: ${row.contactInfo}`;
      }, {
        id: 'contact',
        header: () => (
          <Tooltip content="Kontakt">
            <Phone className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => {
          const contactValue = info.getValue() as string;
          if (!contactValue) return null;
          
          const isPhone = contactValue.startsWith('Tel:');
          const contactInfo = contactValue.substring(4); // Remove "Tel:" or "TG:"
          
          return (
            <Tooltip content={contactValue}>
              <div className="flex items-center gap-1">
                {isPhone ? <Phone className="w-3 h-3 text-[#ff9900]" /> : <MessageCircle className="w-3 h-3 text-[#ff9900]" />}
                <span className="max-w-[60px] whitespace-nowrap overflow-hidden text-ellipsis text-xs">
                  {contactInfo}
                </span>
              </div>
            </Tooltip>
          );
        },
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.toLowerCase().includes(filterValue.toLowerCase());
        },
      }),
      columnHelper.accessor('isMedic', {
        header: () => (
          <Tooltip content="Sanitäter">
            <Stethoscope className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => info.getValue() ? (
          <Tooltip content="Sanitäter">
            <Stethoscope className="w-3 h-3 text-blue-500" />
          </Tooltip>
        ) : null,
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue(columnId) === true,
      }),
      columnHelper.accessor('canStaySober', {
        header: () => (
          <Tooltip content="Nüchtern fahren">
            <AlertTriangle className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => info.getValue() ? (
          <Tooltip content="Kann nüchtern fahren">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
          </Tooltip>
        ) : null,
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue(columnId) === true,
      }),
      columnHelper.accessor('wantsAwareness', {
        header: () => (
          <Tooltip content="Awareness">
            <Shield className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => info.getValue() ? (
          <Tooltip content="Awareness-Team">
            <Shield className="w-3 h-3 text-purple-500" />
          </Tooltip>
        ) : null,
        filterFn: (row, columnId, filterValue) => !filterValue || row.getValue(columnId) === true,
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
        <Button
          variant="ghost"
          size="icon"
          aria-label="Bearbeiten"
          onClick={e => {
            e.stopPropagation();
            onEditRegistration(info.row.original);
          }}
        >
          <span className="sr-only">Bearbeiten</span>
          <Edit className="w-5 h-5 text-blue-500" />
        </Button>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      meta: { className: 'w-[48px] min-w-[48px] max-w-[48px] p-0 text-center' },
    });
    return baseCols;
  }, [showSani, columnHelper, onEditRegistration]);

  const registrationTable = useReactTable({
    data: registrations,
    columns: registrationColumns,
    state: {
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      return String(row.getValue('name')).toLowerCase().includes(String(filterValue).toLowerCase());
    },
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
    registrationTable.getColumn('sleepingPreference')?.setFilterValue(sleepFilter);
  }, [sleepFilter, registrationTable]);
  
  useEffect(() => {
    registrationTable.getColumn('travelType')?.setFilterValue(travelFilter);
  }, [travelFilter, registrationTable]);
  
  useEffect(() => {
    registrationTable.getColumn('isMedic')?.setFilterValue(medicFilter);
  }, [medicFilter, registrationTable]);
  
  useEffect(() => {
    registrationTable.getColumn('canStaySober')?.setFilterValue(soberFilter);
  }, [soberFilter, registrationTable]);
  
  useEffect(() => {
    registrationTable.getColumn('wantsAwareness')?.setFilterValue(awarenessFilter);
  }, [awarenessFilter, registrationTable]);
  
  useEffect(() => {
    registrationTable.getColumn('wantsKitchenHelp')?.setFilterValue(kitchenFilter);
  }, [kitchenFilter, registrationTable]);
  
  useEffect(() => {
    registrationTable.getColumn('allowsPhotos')?.setFilterValue(photosFilter);
  }, [photosFilter, registrationTable]);
  
  useEffect(() => {
    registrationTable.getColumn('paid')?.setFilterValue(paidFilter);
  }, [paidFilter, registrationTable]);
  
  useEffect(() => {
    registrationTable.getColumn('checkedIn')?.setFilterValue(checkedInFilter);
  }, [checkedInFilter, registrationTable]);

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

  return (
    <div className="h-[calc(100vh-300px)] max-h-[800px] flex flex-col overflow-hidden">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Input
          placeholder="Name suchen..."
          value={globalFilter}
          onChange={e => registrationTable.setGlobalFilter(e.target.value)}
          className="w-40"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Filter</Button>
          </PopoverTrigger>
          <PopoverContent className="bg-white p-4 rounded shadow min-w-[220px]">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#460b6c]">Schlaf</label>
              <select value={sleepFilter} onChange={e => setSleepFilter(e.target.value)} className="border rounded px-2 py-1">
                <option value="">Alle</option>
                {sleepOptions.map(opt => (
                  <option key={opt} value={opt}>{opt === 'bed' ? 'Bett' : opt === 'tent' ? 'Zelt' : 'Auto'}</option>
                ))}
              </select>
              <label className="text-xs font-semibold text-[#460b6c]">Anreise</label>
              <select value={travelFilter} onChange={e => setTravelFilter(e.target.value)} className="border rounded px-2 py-1">
                <option value="">Alle</option>
                {travelOptions.map(opt => (
                  <option key={opt} value={opt}>{opt === 'auto' ? 'Auto' : opt === 'zug' ? 'Zug' : opt === 'fahrrad' ? 'Fahrrad' : 'Andere'}</option>
                ))}
              </select>
              <label className="text-xs font-semibold text-[#460b6c]">Sanitäter</label>
              <input type="checkbox" checked={medicFilter} onChange={e => setMedicFilter(e.target.checked)} />
              <label className="text-xs font-semibold text-[#460b6c]">Nüchtern fahren</label>
              <input type="checkbox" checked={soberFilter} onChange={e => setSoberFilter(e.target.checked)} />
              <label className="text-xs font-semibold text-[#460b6c]">Awareness</label>
              <input type="checkbox" checked={awarenessFilter} onChange={e => setAwarenessFilter(e.target.checked)} />
              <label className="text-xs font-semibold text-[#460b6c]">Küche</label>
              <input type="checkbox" checked={kitchenFilter} onChange={e => setKitchenFilter(e.target.checked)} />
              <label className="text-xs font-semibold text-[#460b6c]">Fotos</label>
              <select value={photosFilter} onChange={e => setPhotosFilter(e.target.value)} className="border rounded px-2 py-1">
                <option value="">Alle</option>
                <option value="allowed">Erlaubt</option>
                <option value="notAllowed">Nicht erlaubt</option>
              </select>
              <label className="text-xs font-semibold text-[#460b6c]">Bezahlstatus</label>
              <select value={paidFilter} onChange={e => setPaidFilter(e.target.value)} className="border rounded px-2 py-1">
                <option value="">Alle</option>
                <option value="paid">Bezahlt</option>
                <option value="unpaid">Unbezahlt</option>
              </select>
              <label className="text-xs font-semibold text-[#460b6c]">Anmeldestatus</label>
              <select value={checkedInFilter} onChange={e => setCheckedInFilter(e.target.value)} className="border rounded px-2 py-1">
                <option value="">Alle</option>
                <option value="checkedIn">Angemeldet</option>
                <option value="notCheckedIn">Nicht angemeldet</option>
              </select>
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

      {/* DataTable */}
      <div className="flex-1 overflow-hidden rounded-xl shadow border border-[#ff9900]/20 bg-white/90">
        <table className="w-full text-sm text-[#460b6c] table-fixed">
          <thead>
            {registrationTable.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={
                      header.column.id === 'actions'
                        ? 'w-[48px] min-w-[48px] max-w-[48px] p-0 text-center bg-[#ff9900]/10'
                        : 'p-2 text-left font-semibold bg-[#ff9900]/10'
                    }
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {registrationTable.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-[#ff9900]/10 cursor-pointer"
                onClick={() => onSelectRegistration(row.original)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectRegistration(row.original); }}
                aria-label={`Details zu ${row.original.name} anzeigen`}
              >
                {row.getVisibleCells().map(cell => {
                  return (
                    <td
                      key={cell.id}
                      className={
                        cell.column.id === 'actions'
                          ? 'w-[48px] min-w-[48px] max-w-[48px] p-0 text-center'
                          : (cell.column.id === 'tage'
                              ? 'p-1.5 text-center'
                              : (cell.column.id === 'name'
                                  ? 'p-1.5 max-w-[80px] whitespace-nowrap overflow-hidden text-ellipsis'
                                  : 'p-1.5'))
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Placeholder rows */}
            {Array.from({ length: Math.max(0, rowsPerPage - registrationTable.getRowModel().rows.length) }).map((_, idx) => (
              <tr key={`placeholder-${idx}`} className="border-b border-gray-200 last:border-b-0">
                {registrationTable.getAllLeafColumns().map(col => (
                  <td key={col.id} className={
                    col.id === 'actions'
                      ? 'w-[48px] min-w-[48px] max-w-[48px] p-0 text-center'
                      : (col.id === 'tage'
                          ? 'p-1.5 text-center'
                          : (col.id === 'name'
                              ? 'p-1.5 max-w-[80px] whitespace-nowrap overflow-hidden text-ellipsis'
                              : 'p-1.5'))
                  }>
                    {/* empty */}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center p-2 bg-[#ff9900]/5">
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
    </div>
  );
} 