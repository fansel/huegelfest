import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import tags from 'lucide-static/tags.json';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import toast from 'react-hot-toast';
import { createCategoryAction } from '@/features/categories/actions/createCategory';
import { updateCategoryAction } from '@/features/categories/actions/updateCategory';
import { deleteCategoryAction } from '@/features/categories/actions/deleteCategory';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';

// Props-Interface ggf. anpassen
interface AdminCategoriesTabProps {
  categories: any[];
  setCategories: (cats: any[]) => void;
  loading: boolean;
  error: string | null;
  // ... weitere Props nach Bedarf ...
}

function toPascalCase(kebab: string) {
  return kebab.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

// Hilfsfunktion: Default-Kategorien oben, Rest alphabetisch
function sortCategories(cats: any[]) {
  const defaults = cats.filter(cat => cat.isDefault);
  const rest = cats.filter(cat => !cat.isDefault).sort((a, b) =>
    a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
  );
  return [...defaults, ...rest];
}

const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({ categories, setCategories, loading, error }) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<{ name: string; color: string; icon: string }>({ name: '', color: '#ff9900', icon: '' });
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState('');
  const [iconPage, setIconPage] = useState(0);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<{ id: string; name: string } | null>(null);
  const ICONS_PER_PAGE = 24;

  const iconList = Object.entries(tags).map(([name, tags]) => ({ name, tags: tags as string[] }));
  const filteredIcons = iconList.filter((icon: { name: string; tags: string[] }) => {
    const term = iconSearch.toLowerCase();
    return (
      icon.name.toLowerCase().includes(term) ||
      icon.tags.some((tag: string) => tag.toLowerCase().includes(term))
    );
  });
  const pageCount = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
  const pagedIcons = filteredIcons.slice(iconPage * ICONS_PER_PAGE, (iconPage + 1) * ICONS_PER_PAGE);

  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';

  // Reset beim Schließen
  useEffect(() => {
    if (!showCategoryModal) {
      setEditCategoryId(null);
      setCategoryForm({ name: '', color: '#ff9900', icon: '' });
      setIconSearch('');
      setIconPage(0);
    }
  }, [showCategoryModal]);

  // --- Handler für optimistisches UI ---
  const handleCreateCategory = async () => {
    if (!categoryForm.name || !categoryForm.icon) return;
    const optimisticCategory = {
      _id: 'optimistic-' + Math.random(),
      name: categoryForm.name,
      color: '#ff9900',
      icon: categoryForm.icon,
      isDefault: false,
    };
    const prevCategories = [...categories];
    setCategories(sortCategories([optimisticCategory, ...categories]));
    setShowCategoryModal(false);
    try {
      const result = await createCategoryAction({ name: categoryForm.name, color: '#ff9900', icon: categoryForm.icon });
      if (result && result._id) {
        setCategories(sortCategories([result, ...categories]));
        toast.success('Kategorie angelegt');
      } else {
        setCategories(sortCategories(prevCategories));
        toast.error('Fehler beim Anlegen der Kategorie');
      }
    } catch (err) {
      setCategories(sortCategories(prevCategories));
      toast.error('Fehler beim Anlegen der Kategorie');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryId || !categoryForm.name || !categoryForm.icon) return;
    const prevCategories = [...categories];
    setCategories(sortCategories(categories.map(cat => cat._id === editCategoryId ? { ...cat, name: categoryForm.name, icon: categoryForm.icon } : cat)));
    setEditCategoryId(null);
    setCategoryForm({ name: '', color: '#ff9900', icon: '' });
    try {
      const result = await updateCategoryAction(editCategoryId, { name: categoryForm.name, color: '#ff9900', icon: categoryForm.icon });
      if (!result || (result as any).message) {
        setCategories(sortCategories(prevCategories));
        toast.error('Fehler beim Aktualisieren der Kategorie');
      } else {
        toast.success('Kategorie aktualisiert');
        setShowCategoryModal(false);
      }
    } catch (err) {
      setCategories(sortCategories(prevCategories));
      toast.error('Fehler beim Aktualisieren der Kategorie');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const prevCategories = [...categories];
    setCategories(sortCategories(categories.filter(cat => cat._id !== id)));
    setConfirmDeleteCategory(null);
    try {
      await deleteCategoryAction(id);
      toast.success('Kategorie gelöscht');
    } catch (err) {
      setCategories(sortCategories(prevCategories));
      toast.error('Fehler beim Löschen der Kategorie');
    }
  };

  // --- UI ---
  if (isMobile) {
    return (
      <div className="max-w-lg mx-auto w-full">
        <div className="flex justify-between items-center mb-4 px-4">
          <h3 className="text-xl font-bold text-[#460b6c]">Kategorien</h3>
        </div>
        <ul className="space-y-3 px-4">
          {categories.map(cat => (
            <li key={cat._id} className="bg-white shadow rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="rounded-full border-2 border-white shadow p-2 bg-gray-50">{(() => { const IconComponent = (LucideIcons as any)[cat.icon]; return IconComponent ? <IconComponent className="text-2xl" style={{ color: cat.color }} /> : null; })()}</span>
                <span className="font-medium text-gray-800 truncate">{cat.name}</span>
              </div>
              {cat.isDefault && <span className="ml-auto flex-shrink-0 text-gray-400" title="Standard-Kategorie"><Lock /></span>}
              {!cat.isDefault && (
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => { setEditCategoryId(cat._id); setCategoryForm({ name: cat.name, color: cat.color, icon: cat.icon }); setShowCategoryModal(true); }}
                    aria-label="Bearbeiten"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setConfirmDeleteCategory({ id: cat._id, name: cat.name })}
                    aria-label="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {/* Floating-Button unten zum Kategorie anlegen */}
        <div className="mt-6 flex justify-center mb-6 px-4">
          <Button
            variant="default"
            size="icon"
            onClick={() => { setShowCategoryModal(true); setEditCategoryId(null); setCategoryForm({ name: '', color: '#ff9900', icon: '' }); }}
            aria-label="Neue Kategorie anlegen"
            className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        {/* Modal für Kategorie anlegen/bearbeiten */}
        {showCategoryModal && (
          <Sheet open={showCategoryModal} onOpenChange={setShowCategoryModal}>
            <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[60vh]">
              <SheetHeader>
                <SheetTitle>{editCategoryId ? 'Kategorie bearbeiten' : 'Kategorie anlegen'}</SheetTitle>
              </SheetHeader>
              <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-4 py-8">
                <label htmlFor="category-name" className="text-sm font-medium text-gray-700">Name</label>
                <Input
                  id="category-name"
                  placeholder="Name"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full"
                  autoFocus
                />
                <label htmlFor="category-icon" className="text-sm font-medium text-gray-700">Icon</label>
                <Input
                  type="text"
                  placeholder="Icon suchen..."
                  className="border-b border-gray-200 px-2 py-1 mb-1 w-full"
                  value={iconSearch}
                  onChange={e => { setIconSearch(e.target.value); setIconPage(0); }}
                  id="category-icon"
                />
                <span className="text-xs text-gray-400 mb-1">Suche nach englischen Begriffen (z.B. music, food, party)</span>
                <div className="grid grid-cols-6 gap-2">
                  {pagedIcons.map((icon: { name: string; tags: string[] }) => {
                    const Icon = (LucideIcons as any)[toPascalCase(icon.name)];
                    if (!Icon) return null;
                    const isSelected = categoryForm.icon === toPascalCase(icon.name);
                    return (
                      <Button
                        key={icon.name}
                        size="icon"
                        variant={isSelected ? 'default' : 'outline'}
                        className={isSelected ? 'border-[#ff9900] bg-[#ff9900]/10 text-[#ff9900]' : ''}
                        style={isSelected ? { borderColor: '#ff9900', background: '#fff7e6' } : {}}
                        onClick={() => setCategoryForm(f => ({ ...f, icon: toPascalCase(icon.name) }))}
                        title={icon.tags && icon.tags.length ? icon.tags.join(', ') : icon.name}
                      >
                        <Icon className="text-2xl" title={icon.name} />
                      </Button>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2 px-6 pb-6 pt-2">
                  <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>Abbrechen</Button>
                  <Button className="bg-[#ff9900] hover:bg-orange-600 w-full" onClick={editCategoryId ? handleUpdateCategory : handleCreateCategory}>{editCategoryId ? 'Speichern' : 'Anlegen'}</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
        {confirmDeleteCategory && (
          <AlertDialog open={!!confirmDeleteCategory} onOpenChange={open => { if (!open) setConfirmDeleteCategory(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchtest du die Kategorie "{confirmDeleteCategory.name}" wirklich löschen?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="secondary" className="text-[#ff9900] border-[#ff9900]">Abbrechen</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive" className="bg-[#ff9900] hover:bg-orange-600 border-none" onClick={() => handleDeleteCategory(confirmDeleteCategory.id)}>Löschen</Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  }

  // --- Desktop ---
  return (
    <div className="relative min-h-[60vh] pb-24 flex flex-col max-w-5xl mx-auto">
      {/* Gemeinsame Header-Row */}
      <div className="flex flex-row items-center gap-8 mt-8 mb-6">
        <h2 className="text-2xl font-bold text-[#460b6c] flex-1">{editCategoryId ? 'Kategorie bearbeiten' : 'Neue Kategorie anlegen'}</h2>
        <h2 className="text-2xl font-bold text-[#460b6c] flex-1 text-center">Kategorien</h2>
      </div>
      <div className="flex flex-row gap-8 justify-center items-start">
        {/* Linke Spalte: Immer sichtbares Formular wie im GroupManager */}
        <div className="w-full max-w-lg flex-shrink-0">
          <div className="bg-white/90 rounded-2xl shadow-2xl border-2 border-gray-200 p-6 sticky top-8">
            <div className="flex flex-col gap-4">
              <label htmlFor="category-name" className="text-sm font-medium text-gray-700">Kategoriename</label>
              <Input
                id="category-name"
                placeholder="Kategoriename"
                value={categoryForm.name}
                onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full"
                autoFocus
              />
              <label htmlFor="category-icon" className="text-sm font-medium text-gray-700">Icon</label>
              <Input
                type="text"
                placeholder="Icon suchen..."
                className="border-b border-gray-200 px-2 py-1 mb-1 w-full"
                value={iconSearch}
                onChange={e => { setIconSearch(e.target.value); setIconPage(0); }}
                id="category-icon"
              />
              <span className="text-xs text-gray-400 mb-1">Suche nach englischen Begriffen (z.B. music, food, party)</span>
              <div className="grid grid-cols-6 gap-2">
                {pagedIcons.map((icon: { name: string; tags: string[] }) => {
                  const Icon = (LucideIcons as any)[toPascalCase(icon.name)];
                  if (!Icon) return null;
                  const isSelected = categoryForm.icon === toPascalCase(icon.name);
                  return (
                    <Button
                      key={icon.name}
                      size="icon"
                      variant={isSelected ? 'default' : 'outline'}
                      className={isSelected ? 'border-[#ff9900] bg-[#ff9900]/10 text-[#ff9900]' : ''}
                      style={isSelected ? { borderColor: '#ff9900', background: '#fff7e6' } : {}}
                      onClick={() => setCategoryForm(f => ({ ...f, icon: toPascalCase(icon.name) }))}
                      title={icon.tags && icon.tags.length ? icon.tags.join(', ') : icon.name}
                    >
                      <Icon className="text-2xl" title={icon.name} />
                    </Button>
                  );
                })}
              </div>
              {/* Pagination für Icons */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <Button size="icon" variant="outline" onClick={() => setIconPage(p => Math.max(0, p - 1))} disabled={iconPage === 0} aria-label="Vorherige Seite">
                  &lt;
                </Button>
                <span className="text-xs text-gray-500">Seite {iconPage + 1} / {pageCount}</span>
                <Button size="icon" variant="outline" onClick={() => setIconPage(p => Math.min(pageCount - 1, p + 1))} disabled={iconPage >= pageCount - 1} aria-label="Nächste Seite">
                  &gt;
                </Button>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                {editCategoryId && (
                  <Button variant="secondary" onClick={() => { setEditCategoryId(null); setCategoryForm({ name: '', color: '#ff9900', icon: '' }); }}>Abbrechen</Button>
                )}
                <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={editCategoryId ? handleUpdateCategory : handleCreateCategory}>{editCategoryId ? 'Speichern' : 'Anlegen'}</Button>
              </div>
            </div>
          </div>
        </div>
        {/* Rechte Spalte: Kategorien-Liste */}
        <div className="flex-1 min-w-0 flex flex-col items-center">
          <div className="space-y-3 px-2 sm:px-0 max-w-2xl w-full mx-auto">
            <ul className="space-y-3">
              {categories.map(cat => (
                <li key={cat._id} className="bg-white shadow rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="rounded-full border-2 border-white shadow p-2 bg-gray-50">{(() => { const IconComponent = (LucideIcons as any)[cat.icon]; return IconComponent ? <IconComponent className="text-2xl" style={{ color: cat.color }} /> : null; })()}</span>
                    <span className="font-medium text-gray-800 truncate">{cat.name}</span>
                  </div>
                  {cat.isDefault && <span className="ml-auto flex-shrink-0 text-gray-400" title="Standard-Kategorie"><Lock /></span>}
                  {!cat.isDefault && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => { setEditCategoryId(cat._id); setCategoryForm({ name: cat.name, color: cat.color, icon: cat.icon }); }}
                        aria-label="Bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setConfirmDeleteCategory({ id: cat._id, name: cat.name })}
                        aria-label="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {confirmDeleteCategory && (
          <AlertDialog open={!!confirmDeleteCategory} onOpenChange={open => { if (!open) setConfirmDeleteCategory(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchtest du die Kategorie "{confirmDeleteCategory.name}" wirklich löschen?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="secondary" className="text-[#ff9900] border-[#ff9900]">Abbrechen</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive" className="bg-[#ff9900] hover:bg-orange-600 border-none" onClick={() => handleDeleteCategory(confirmDeleteCategory.id)}>Löschen</Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default AdminCategoriesTab; 