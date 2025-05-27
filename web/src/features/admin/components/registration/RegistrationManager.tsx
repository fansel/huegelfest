"use client";
import React, { useEffect, useState, useMemo } from "react";
import { getRegistrations } from "../../../registration/actions/getRegistrations";
import { Button } from "@/shared/components/ui/button";
import { FileText, FileDown, Search, ChevronLeft, ChevronRight, Info, Euro, Percent, Gift, Stethoscope, Car as CarIcon, Bed, Tent, Music, Hammer, Wrench, Calendar, BikeIcon, TrainIcon, LucideBike, HelpCircle, AlertTriangle, Shield, Camera, ChefHat, User } from "lucide-react";
import jsPDF from "jspdf";
import Papa from "papaparse";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { updateStatus } from '../../../registration/actions/updateRegistrationStatus';
import { Switch } from '@/shared/components/ui/switch';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  getPaginationRowModel,
  ColumnDef,
} from '@tanstack/react-table';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { deleteRegistration } from '../../../registration/actions/deleteRegistration';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { Bike } from "lucide-static";
import { formatDateBerlin } from '@/shared/utils/formatDateBerlin';

interface RegistrationWithId {
  _id: string;
  createdAt: string;
  name: string;
  days: number[];
  isMedic: boolean;
  travelType: 'zug' | 'auto' | 'fahrrad' | 'andere';
  equipment: string;
  concerns: string;
  wantsToOfferWorkshop: string;
  sleepingPreference: 'bed' | 'tent' | 'car';
  lineupContribution: string;
  paid: boolean;
  checkedIn: boolean;
  // Neue Felder
  canStaySober: boolean;
  wantsAwareness: boolean;
  programContribution: string;
  hasConcreteIdea: boolean;
  wantsKitchenHelp: boolean;
  allergies: string;
  allowsPhotos: boolean;
}

const FESTIVAL_DAYS = ["31.07.", "01.08.", "02.08.", "03.08."];

export default function RegistrationManager() {
  const { deviceType } = useDeviceContext();
  const [registrations, setRegistrations] = useState<RegistrationWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RegistrationWithId | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  useEffect(() => {
    getRegistrations().then((data) => {
      setRegistrations(data);
      setLoading(false);
    });
  }, []);

  // --- DataTable Columns ---
  const columnHelper = createColumnHelper<RegistrationWithId>();
  // Dynamisch: Sani-Spalte nur anzeigen, wenn mindestens ein Sani vorhanden ist
  const showSani = useMemo(() => registrations.some(r => r.isMedic), [registrations]);

  const columns = useMemo<ColumnDef<RegistrationWithId, any>[]>(() => {
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
      columnHelper.accessor('days', {
        header: () => (
          <Tooltip content="Anzahl Tage">
            <Calendar className="w-3 h-3" />
          </Tooltip>
        ),
        cell: info => info.getValue().length,
        filterFn: (row, columnId, filterValue) => filterValue === '' || (row.getValue(columnId) as number[]).length === Number(filterValue),
      }),
      // Sani-Spalte immer einfügen, aber nur anzeigen, wenn showSani true ist
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
    ];
    // Löschen-Spalte hinzufügen
    baseCols.push({
      id: 'actions',
      header: () => <span className="sr-only">Aktionen</span>,
      cell: info => (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Löschen"
          onClick={e => {
            e.stopPropagation();
            setDeleteId(info.row.original._id);
          }}
        >
          <span className="sr-only">Löschen</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </Button>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      meta: { className: 'w-[48px] min-w-[48px] max-w-[48px] p-0 text-center' },
    });
    return baseCols;
  }, [showSani, columnHelper]);

  // --- DataTable Setup ---
  const table = useReactTable({
    data: registrations,
    columns,
    state: {
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      // Global Name-Suche
      return String(row.getValue('name')).toLowerCase().includes(String(filterValue).toLowerCase());
    },
    debugTable: false,
    initialState: {
      pagination: {
        pageSize: rowsPerPage,
      },
    },
  });

  // --- Filter Popover State ---
  const [sleepFilter, setSleepFilter] = useState('');
  const [travelFilter, setTravelFilter] = useState('');
  const [medicFilter, setMedicFilter] = useState(false);
  const [paidFilter, setPaidFilter] = useState(''); // '', 'paid', 'notPaid'
  const [checkedInFilter, setCheckedInFilter] = useState(''); // '', 'checkedIn', 'notCheckedIn'

  // Dynamische Filteroptionen aus den Daten
  const sleepOptions = useMemo(() => Array.from(new Set(registrations.map(r => r.sleepingPreference))), [registrations]);
  const travelOptions = useMemo(() => Array.from(new Set(registrations.map(r => r.travelType))), [registrations]);

  // Filter-Handler
  useEffect(() => {
    table.getColumn('sleepingPreference')?.setFilterValue(sleepFilter);
  }, [sleepFilter]);
  useEffect(() => {
    table.getColumn('travelType')?.setFilterValue(travelFilter);
  }, [travelFilter]);
  useEffect(() => {
    table.getColumn('isMedic')?.setFilterValue(medicFilter);
  }, [medicFilter]);
  useEffect(() => {
    table.getColumn('paid')?.setFilterValue(paidFilter);
  }, [paidFilter]);
  useEffect(() => {
    table.getColumn('checkedIn')?.setFilterValue(checkedInFilter);
  }, [checkedInFilter]);

  // Calculate optimal number of rows based on available screen height
  const calculateRowsPerPage = () => {
    if (typeof window === 'undefined') return;
    // Debug-optimiert: rowHeight 36, Offset 40
    const rowHeight = 36;
    const tableHeight = window.innerHeight * 0.7 - 40; // 70% der Bildschirmhöhe abzüglich kleiner Offset
    const fittingRows = Math.floor(tableHeight / rowHeight);
    const calculatedRows = Math.max(10, Math.min(fittingRows, 100));
    console.log('[RegistrationManager] window.innerHeight:', window.innerHeight, 'tableHeight:', tableHeight, 'rowHeight:', rowHeight, 'fittingRows:', fittingRows, 'rowsPerPage:', calculatedRows);
    setRowsPerPage(calculatedRows);
  };
  useEffect(() => {
    calculateRowsPerPage();
    window.addEventListener('resize', calculateRowsPerPage);
    return () => {
      window.removeEventListener('resize', calculateRowsPerPage);
    };
  }, []);

  // Update table pagination when rowsPerPage changes
  useEffect(() => {
    table.setPageSize(rowsPerPage);
    table.setPageIndex(0);
  }, [rowsPerPage, table]);

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Festival-Registrierungen", 10, 14);
    doc.setFontSize(10);
    let y = 24;
    registrations.forEach((reg, idx) => {
      doc.text(
        `${idx + 1}. ${reg.name} | Tage: ${reg.days.map(i => FESTIVAL_DAYS[i]).join(", ")} | Sanitäter: ${reg.isMedic ? "Ja" : "Nein"} | Anreise: ${reg.travelType} | Schlaf: ${reg.sleepingPreference}`,
        10,
        y
      );
      y += 8;
      if (reg.equipment) { doc.text(`Equipment: ${reg.equipment}`, 14, y); y += 6; }
      if (reg.concerns) { doc.text(`Anliegen: ${reg.concerns}`, 14, y); y += 6; }
      if (reg.lineupContribution && reg.lineupContribution.trim()) { doc.text(`Line-Up: ${reg.lineupContribution}`, 14, y); y += 6; }
      if (reg.wantsToOfferWorkshop) { doc.text(`Workshop: ${reg.wantsToOfferWorkshop}`, 14, y); y += 6; }
      // Neue Felder
      if (reg.canStaySober) { doc.text(`Nüchtern fahren: Ja`, 14, y); y += 6; }
      if (reg.wantsAwareness) { doc.text(`Awareness: Ja`, 14, y); y += 6; }
      if (reg.programContribution) { doc.text(`Programmpunkt: ${reg.programContribution}`, 14, y); y += 6; }
      if (reg.wantsKitchenHelp) { doc.text(`Küche: Ja`, 14, y); y += 6; }
      if (reg.allergies) { doc.text(`Allergien: ${reg.allergies}`, 14, y); y += 6; }
      y += 2;
      if (y > 270) { doc.addPage(); y = 14; }
    });
    doc.save("festival-registrierungen.pdf");
  };

  // CSV Export
  const exportCSV = () => {
    const csvContent = registrations.map((reg, idx) => 
      `${idx + 1}. ${reg.name} | Tage: ${reg.days.map(i => FESTIVAL_DAYS[i]).join(", ")} | Sanitäter: ${reg.isMedic ? "Ja" : "Nein"} | Anreise: ${reg.travelType} | Schlaf: ${reg.sleepingPreference}`,
    ).join('\n');

    const jsonContent = registrations.map(reg => ({
      Name: reg.name,
      Tage: reg.days.map(i => FESTIVAL_DAYS[i]).join(", "),
      Sanitäter: reg.isMedic ? "Ja" : "Nein",
      Anreise: reg.travelType,
      Schlafplatz: reg.sleepingPreference,
      Equipment: reg.equipment,
      Anliegen: reg.concerns,
      Workshop: reg.wantsToOfferWorkshop,
      LineUp: reg.lineupContribution,
      Bezahlt: reg.paid ? "Ja" : "Nein",
      Eingecheckt: reg.checkedIn ? "Ja" : "Nein",
      // Neue Felder
      NüchternFahren: reg.canStaySober ? "Ja" : "Nein",
      Awareness: reg.wantsAwareness ? "Ja" : "Nein",
      Programmpunkt: reg.programContribution,
      Küche: reg.wantsKitchenHelp ? "Ja" : "Nein",
      Allergien: reg.allergies,
      Fotos: reg.allowsPhotos ? "Ja" : "Nein",
    }));

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "festival-registrierungen.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Detail-Drawer
  const closeDrawer = () => setSelected(null);

  // Handler für Status-Update
  const handleStatusChange = async (field: 'paid' | 'checkedIn', value: boolean) => {
    if (!selected) return;
    const res = await updateStatus(selected._id, { [field]: value });
    if (res.success && res.updated) {
      setSelected(sel => sel ? { ...sel, ...res.updated } as RegistrationWithId : sel);
      setRegistrations(regs => regs.map(r => r._id === selected._id ? { ...r, ...res.updated } as RegistrationWithId : r));
    }
  };

  // Render function for registration details - used by both mobile and desktop
  const renderRegistrationDetails = () => {
    if (!selected) return null;
    
    return (
      <div className="flex flex-col gap-6 text-[#460b6c] overflow-y-auto">
        {/* Badges for status */}
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {selected.isMedic && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
              <Stethoscope className="w-4 h-4" /> Sani
            </span>
          )}
          {!selected.paid && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold">
              <Euro className="w-4 h-4" /> Unbezahlt
            </span>
          )}
          {selected.paid && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
              <Euro className="w-4 h-4" /> Bezahlt
            </span>
          )}
          {!selected.checkedIn && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold">
              <Info className="w-4 h-4" /> Unangemeldet
            </span>
          )}
          {selected.checkedIn && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-semibold">
              <Info className="w-4 h-4" /> Angemeldet
            </span>
          )}
        </div>
        
        {/* Festival-Infos */}
        <div>
          <div className="text-xs font-semibold text-[#ff9900] mb-1 uppercase tracking-wider">Festival</div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Tage:</span>
              <span>{selected.days.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Schlafplatz:</span>
              <span>{selected.sleepingPreference === 'bed' ? 'Bett' : selected.sleepingPreference === 'tent' ? 'Zelt' : 'Auto'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CarIcon className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Anreise:</span>
              <span>{selected.travelType === 'auto' ? 'Auto' : selected.travelType === 'zug' ? 'Zug' : selected.travelType === 'fahrrad' ? 'Fahrrad' : 'Unklar'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Zeitraum:</span>
              <span className="whitespace-nowrap overflow-hidden text-ellipsis block">
                {FESTIVAL_DAYS[selected.days[0]]} – {FESTIVAL_DAYS[selected.days[selected.days.length - 1]]}
              </span>
            </div>
            {/* Neue Felder */}
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Nüchtern fahren:</span>
              <span>{selected.canStaySober ? 'Ja' : 'Nein'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Awareness:</span>
              <span>{selected.wantsAwareness ? 'Ja' : 'Nein'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Fotos:</span>
              <span>{selected.allowsPhotos ? 'Ja' : 'Nein'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Küche:</span>
              <span>{selected.wantsKitchenHelp ? 'Ja' : 'Nein'}</span>
            </div>
          </div>
        </div>
        
        {/* Persönliches */}
        <div>
          <div className="text-xs font-semibold text-[#ff9900] mb-1 uppercase tracking-wider">Persönliches</div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Sani:</span>
              <span>{selected.isMedic ? 'Ja' : 'Nein'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Line-Up:</span>
              <span>{selected.lineupContribution && selected.lineupContribution.trim() ? selected.lineupContribution : '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Workshop:</span>
              {selected.wantsToOfferWorkshop ? (
                <button
                  type="button"
                  className="ml-1 p-1 rounded hover:bg-[#ff9900]/10"
                  onClick={() => toast((t) => (
                    <div className="max-w-xs break-words">
                      <div className="font-semibold mb-1">Workshop</div>
                      <div className="mb-2 whitespace-pre-line">{selected.wantsToOfferWorkshop}</div>
                      <button onClick={() => toast.dismiss(t.id)} className="text-xs text-[#ff9900] underline">Schließen</button>
                    </div>
                  ), { duration: 8000 })}
                >
                  <span className="max-w-[80px] truncate inline-block align-bottom">{selected.wantsToOfferWorkshop}</span> <span className="text-[#ff9900]">...</span>
                </button>
              ) : <span>—</span>}
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Equipment:</span>
              {selected.equipment ? (
                <button
                  type="button"
                  className="ml-1 p-1 rounded hover:bg-[#ff9900]/10"
                  onClick={() => toast((t) => (
                    <div className="max-w-xs break-words">
                      <div className="font-semibold mb-1">Equipment</div>
                      <div className="mb-2 whitespace-pre-line">{selected.equipment}</div>
                      <button onClick={() => toast.dismiss(t.id)} className="text-xs text-[#ff9900] underline">Schließen</button>
                    </div>
                  ), { duration: 8000 })}
                >
                  <span className="max-w-[80px] truncate inline-block align-bottom">{selected.equipment}</span> <span className="text-[#ff9900]">...</span>
                </button>
              ) : <span>—</span>}
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Anliegen:</span>
              {selected.concerns ? (
                <button
                  type="button"
                  className="ml-1 p-1 rounded hover:bg-[#ff9900]/10"
                  onClick={() => toast((t) => (
                    <div className="max-w-xs break-words">
                      <div className="font-semibold mb-1">Anliegen</div>
                      <div className="mb-2 whitespace-pre-line">{selected.concerns}</div>
                      <button onClick={() => toast.dismiss(t.id)} className="text-xs text-[#ff9900] underline">Schließen</button>
                    </div>
                  ), { duration: 8000 })}
                >
                  <span className="max-w-[80px] truncate inline-block align-bottom">{selected.concerns}</span> <span className="text-[#ff9900]">...</span>
                </button>
              ) : <span>—</span>}
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ff9900]" />
              <span className="font-medium">Allergien:</span>
              {selected.allergies ? (
                <button
                  type="button"
                  className="ml-1 p-1 rounded hover:bg-[#ff9900]/10"
                  onClick={() => toast((t) => (
                    <div className="max-w-xs break-words">
                      <div className="font-semibold mb-1">Allergien & Unverträglichkeiten</div>
                      <div className="mb-2 whitespace-pre-line">{selected.allergies}</div>
                      <button onClick={() => toast.dismiss(t.id)} className="text-xs text-[#ff9900] underline">Schließen</button>
                    </div>
                  ), { duration: 8000 })}
                >
                  <span className="max-w-[80px] truncate inline-block align-bottom">{selected.allergies}</span> <span className="text-[#ff9900]">...</span>
                </button>
              ) : <span>—</span>}
            </div>
          </div>
        </div>
        
        {/* Status */}
        <div className="text-center">
          <div className="text-xs font-semibold text-[#ff9900] mb-1 uppercase tracking-wider">Status ändern</div>
          <div className="flex gap-4 items-center mt-2 justify-center">
            <button
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors border focus:outline-none focus:ring-2 ${selected.paid ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 focus:ring-green-400' : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 focus:ring-red-400'}`}
              onClick={() => handleStatusChange('paid', !selected.paid)}
              type="button"
            >
              <Euro className="w-4 h-4" /> {selected.paid ? 'Bezahlt' : 'Unbezahlt'}
            </button>
            <button
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors border focus:outline-none focus:ring-2 ${selected.checkedIn ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 focus:ring-orange-400' : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 focus:ring-red-400'}`}
              onClick={() => handleStatusChange('checkedIn', !selected.checkedIn)}
              type="button"
            >
              <Info className="w-4 h-4" /> {selected.checkedIn ? 'Angemeldet' : 'Unangemeldet'}
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-4">Erstellt: {formatDateBerlin(selected.createdAt)}</div>
        </div>
      </div>
    );
  };

  // Stil-Klassen für feste Container-Höhe und kein Scrollen im Container
  const containerStyle = "h-[calc(100vh-180px)] max-h-[1000px] flex flex-col overflow-hidden";
  const tableContainerStyle = "flex-1 overflow-hidden rounded-xl shadow border border-[#ff9900]/20 bg-white/90";

  return (
    <div className={`max-w-4xl mx-auto p-4 ${containerStyle}`}>
      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Input
          placeholder="Name suchen..."
          value={globalFilter}
          onChange={e => table.setGlobalFilter(e.target.value)}
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
      </div>
      
      {/* DataTable */}
      <div className={tableContainerStyle}>
        <table className="w-full text-sm text-[#460b6c] table-fixed">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
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
            {/* Render echte Zeilen */}
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-[#ff9900]/10 cursor-pointer"
                onClick={() => setSelected(row.original)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelected(row.original); }}
                aria-label={`Details zu ${row.original.name} anzeigen`}
              >
                {row.getVisibleCells().map(cell => {
                  const isTage = cell.column.id === 'tage';
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
            {/* Platzhalter-Zeilen, damit die Tabelle immer voll ist */}
            {Array.from({ length: Math.max(0, rowsPerPage - table.getRowModel().rows.length) }).map((_, idx) => (
              <tr key={`placeholder-${idx}`} className="border-b border-gray-200 last:border-b-0">
                {table.getAllLeafColumns().map(col => (
                  <td key={col.id} className={
                    col.id === 'actions'
                      ? 'w-[48px] min-w-[48px] max-w-[48px] p-0 text-center'
                      : (col.id === 'tage'
                          ? 'p-1.5 text-center'
                          : (col.id === 'name'
                              ? 'p-1.5 max-w-[80px] whitespace-nowrap overflow-hidden text-ellipsis'
                              : 'p-1.5'))
                  }>
                    {/* leer */}
                  </td>
                ))}
              </tr>
            ))}
            </tbody>
          </table>
      </div>
          {/* Pagination */}
          <div className="flex justify-between items-center p-2 bg-[#ff9900]/5">
        <Button size="icon" variant="ghost" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs">
          Seite {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} 
          <span className="ml-2 text-gray-500">
            ({table.getFilteredRowModel().rows.length} Anmeldungen)
          </span>
        </span>
        <Button size="icon" variant="ghost" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        </div>
      
      {/* Detail View - Conditional Rendering based on device type */}
      {deviceType === "mobile" ? (
        // Mobile: Sheet from the side 
        <Sheet open={!!selected} onOpenChange={open => !open && closeDrawer()}>
          <SheetContent side="right" className="max-w-md w-full flex flex-col px-6">
            <SheetHeader>
              <SheetTitle>
                <div className="flex flex-col items-center mb-2">
                  {selected && (
                    <span className="text-2xl font-bold text-[#460b6c] text-center tracking-wider" style={{ textTransform: 'uppercase' }}>{selected.name}</span>
                  )}
                </div>
              </SheetTitle>
            </SheetHeader>
            {renderRegistrationDetails()}
          </SheetContent>
        </Sheet>
      ) : (
        // Desktop: Dialog in the center
        <Dialog open={!!selected} onOpenChange={open => !open && closeDrawer()}>
          <DialogContent className="max-w-[800px] w-[90vw] p-6 flex flex-col max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-center">
                {selected && (
                  <span className="text-2xl font-bold text-[#460b6c] text-center tracking-wider" style={{ textTransform: 'uppercase' }}>{selected?.name}</span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto pr-2">
              {renderRegistrationDetails()}
            </div>
          </DialogContent>
        </Dialog>
      )}
        
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anmeldung löschen</DialogTitle>
          </DialogHeader>
          <div className="py-2">Möchtest du diese Anmeldung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Abbrechen</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteId) return;
                const res = await deleteRegistration(deleteId);
                if (res.success) {
                  setRegistrations(regs => regs.filter(r => r._id !== deleteId));
                  toast.success('Anmeldung gelöscht.');
                } else {
                  toast.error(res.error || 'Fehler beim Löschen.');
                }
                setDeleteId(null);
              }}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 