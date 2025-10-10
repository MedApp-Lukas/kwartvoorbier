import React, { useState, useEffect } from 'react';
import type { Product, Location, UserProfile } from '../types';

// DND Kit Imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAYS_OF_WEEK = [
    { label: 'Ma', value: 1 }, { label: 'Di', value: 2 }, { label: 'Wo', value: 3 },
    { label: 'Do', value: 4 }, { label: 'Vr', value: 5 }, { label: 'Za', value: 6 }, { label: 'Zo', value: 0 },
];

interface AdminPageProps {
  products: Product[];
  locations: Location[];
  allUsers: UserProfile[];
  appSettings: { [key: string]: number };
  onUpdateSettings: (newSettings: { startHour: number; startMinute: number; endHour: number; endMinute: number; }) => Promise<boolean>;
  onUpdateUserRole: (userId: string, newRole: string) => Promise<boolean>;
  onDeleteUsers: (userIds: string[]) => Promise<boolean>;
  onAddProduct: (productData: { name: string; available_on_days: number[] }) => Promise<boolean>;
  onUpdateProduct: (id: number, productData: { name: string; available_on_days: number[] }) => Promise<boolean>;
  onDeleteProduct: (id: number) => Promise<boolean>;
  onAddLocation: (location: Omit<Location, 'id'>) => Promise<boolean>;
  onUpdateLocation: (id: number, location: Omit<Location, 'id'>) => Promise<boolean>;
  onDeleteLocation: (id: number) => Promise<boolean>;
  onUpdateProductOrder: (products: Product[]) => Promise<void>;
  onUpdateLocationOrder: (locations: Location[]) => Promise<void>;
}

type AdminTab = 'users' | 'products' | 'locations' | 'tijd';

// --- Modals ---
const EditProductModal: React.FC<{ product: Product; onClose: () => void; onUpdate: (id: number, productData: { name: string; available_on_days: number[] }) => Promise<boolean>; }> = ({ product, onClose, onUpdate }) => {
    const [name, setName] = useState(product.name);
    const [availableDays, setAvailableDays] = useState<number[]>(product.available_on_days || []);
    const [isSaving, setIsSaving] = useState(false);
    const handleDayChange = (dayValue: number) => { setAvailableDays(prev => prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue].sort((a,b) => a - b)); };
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setIsSaving(true); const success = await onUpdate(product.id, { name, available_on_days: availableDays }); setIsSaving(false); if (success) onClose(); };
    return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold text-amber-900 mb-4">Product Bewerken</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="edit-product-name" className="block text-sm font-medium text-gray-700">Naam</label><input id="edit-product-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required /></div><div><label className="block text-sm font-medium text-gray-700">Beschikbaar op</label><div className="mt-2 flex flex-wrap gap-2">{DAYS_OF_WEEK.map(day => (<label key={day.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-gray-300 has-[:checked]:bg-purple-100 has-[:checked]:border-purple-400 transition-colors"><input type="checkbox" value={day.value} checked={availableDays.includes(day.value)} onChange={() => handleDayChange(day.value)} className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300" /><span>{day.label}</span></label>))}</div></div><div className="flex justify-end space-x-3 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Annuleren</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-amber-600 text-white rounded-md disabled:bg-gray-400">{isSaving ? 'Opslaan...' : 'Opslaan'}</button></div></form></div></div> );
};
const EditLocationModal: React.FC<{ location: Location; onClose: () => void; onUpdate: (id: number, location: Omit<Location, 'id'>) => Promise<boolean>; }> = ({ location, onClose, onUpdate }) => {
    const [formState, setFormState] = useState({ name: location.name, floor: location.floor, description: location.description });
    const [isSaving, setIsSaving] = useState(false);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: name === 'floor' ? parseInt(value) || 0 : value })); };
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setIsSaving(true); const success = await onUpdate(location.id, formState); setIsSaving(false); if (success) onClose(); };
    return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold text-amber-900 mb-4">Locatie Bewerken</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="edit-loc-name" className="block text-sm font-medium text-gray-700">Naam</label><input id="edit-loc-name" name="name" type="text" value={formState.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" required /></div><div><label htmlFor="edit-loc-floor" className="block text-sm font-medium text-gray-700">Verdieping</label><input id="edit-loc-floor" name="floor" type="number" value={formState.floor} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" required /></div><div><label htmlFor="edit-loc-desc" className="block text-sm font-medium text-gray-700">Omschrijving (optioneel)</label><input id="edit-loc-desc" name="description" type="text" value={formState.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" /></div><div className="flex justify-end space-x-3 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Annuleren</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-amber-600 text-white rounded-md">{isSaving ? 'Opslaan...' : 'Opslaan'}</button></div></form></div></div> );
};

// --- Sortable Item Component with Drag Handle ---
const SortableListItem: React.FC<{ id: any; children: React.ReactNode }> = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center bg-purple-50 rounded-lg">
            <button {...attributes} {...listeners} className="p-3 cursor-grab touch-none" aria-label="Verplaats item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500 hover:text-gray-800">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
            </button>
            <div className="flex-grow p-3 pl-0">
                {children}
            </div>
        </div>
    );
};

const TimeSettingsForm: React.FC<{
    initialSettings: { [key: string]: number },
    onSave: (newSettings: { startHour: number; startMinute: number; endHour: number; endMinute: number; }) => Promise<boolean>
}> = ({ initialSettings, onSave }) => {
    const [startTime, setStartTime] = useState('15:45');
    const [endTime, setEndTime] = useState('16:00');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const formatTime = (h: number | undefined, m: number | undefined) => {
        if (h === undefined || m === undefined) return '';
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    useEffect(() => {
        if (initialSettings.ORDER_START_HOUR !== undefined) {
            setStartTime(formatTime(initialSettings.ORDER_START_HOUR, initialSettings.ORDER_START_MINUTE));
        }
        if (initialSettings.ORDER_END_HOUR !== undefined) {
            setEndTime(formatTime(initialSettings.ORDER_END_HOUR, initialSettings.ORDER_END_MINUTE));
        }
    }, [initialSettings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveStatus('idle');
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const success = await onSave({ startHour, startMinute, endHour, endMinute });

        setIsSaving(false);
        setSaveStatus(success ? 'success' : 'error');
        if (success) {
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border rounded-lg bg-gray-50 space-y-6 max-w-lg">
            <div>
                <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">Starttijd Bestellen</label>
                <p className="text-xs text-gray-500 mb-1">Vanaf dit tijdstip kan er besteld worden.</p>
                <input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">Eindtijd Bestellen</label>
                <p className="text-xs text-gray-500 mb-1">Tot dit tijdstip kan er besteld worden. Hierna start de roulette.</p>
                <input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="flex items-center space-x-4">
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 transition-colors">
                    {isSaving ? 'Opslaan...' : 'Instellingen Opslaan'}
                </button>
                {saveStatus === 'success' && <span className="text-green-600 font-medium">Opgeslagen!</span>}
                {saveStatus === 'error' && <span className="text-red-600 font-medium">Fout bij opslaan.</span>}
            </div>
        </form>
    );
};


const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { 
        products, locations, allUsers, appSettings, onUpdateSettings,
        onUpdateUserRole, onDeleteUsers,
        onAddProduct, onUpdateProduct, onDeleteProduct, 
        onAddLocation, onUpdateLocation, onDeleteLocation,
        onUpdateProductOrder, onUpdateLocationOrder
    } = props;
    
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [newProduct, setNewProduct] = useState({ name: '', available_on_days: [] as number[] });
    const [newLocation, setNewLocation] = useState({ name: '', floor: 0, description: ''});
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const filteredUsers = allUsers.filter(user => (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            if (activeTab === 'products') {
                const oldIndex = products.findIndex(p => p.id === active.id); const newIndex = products.findIndex(p => p.id === over.id);
                onUpdateProductOrder(arrayMove(products, oldIndex, newIndex));
            } else if (activeTab === 'locations') {
                const oldIndex = locations.findIndex(l => l.id === active.id); const newIndex = locations.findIndex(l => l.id === over.id);
                onUpdateLocationOrder(arrayMove(locations, oldIndex, newIndex));
            }
        }
    };
    
    const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewProduct(prev => ({ ...prev, name: e.target.value }));
    const handleNewProductDayChange = (dayValue: number) => { setNewProduct(prev => { const days = prev.available_on_days; const newDays = days.includes(dayValue) ? days.filter(d => d !== dayValue) : [...days, dayValue]; return { ...prev, available_on_days: newDays.sort((a,b) => a - b) }; }); };
    const handleAddProductSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!newProduct.name.trim()) return; const success = await onAddProduct(newProduct); if (success) setNewProduct({ name: '', available_on_days: [] }); };
    const handleAddLocationSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!newLocation.name.trim()) return; const success = await onAddLocation(newLocation); if (success) setNewLocation({ name: '', floor: 0, description: ''}); };
    const handleLocationFormChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setNewLocation(prev => ({...prev, [name]: name === 'floor' ? parseInt(value) || 0 : value })); };
    const handleDeleteProductClick = (id: number) => { if (window.confirm('Weet je zeker dat je dit product wilt verwijderen?')) onDeleteProduct(id); };
    const handleDeleteLocationClick = (id: number) => { if (window.confirm('Weet je zeker dat je deze locatie wilt verwijderen?')) onDeleteLocation(id); };
    const handleUserSelectionChange = (userId: string) => { setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]); };
    const handleSelectAllUsersChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.checked) setSelectedUserIds(filteredUsers.map(u => u.id)); else setSelectedUserIds([]); };
    const handleDeleteUserClick = (userId: string, userName: string) => { if (window.confirm(`Weet je zeker dat je ${userName} permanent wilt verwijderen?`)) onDeleteUsers([userId]); };
    const handleDeleteSelectedUsersClick = () => { if (selectedUserIds.length > 0 && window.confirm(`Weet je zeker dat je ${selectedUserIds.length} geselecteerde gebruiker(s) permanent wilt verwijderen?`)) { onDeleteUsers(selectedUserIds).then(success => { if (success) setSelectedUserIds([]); }); } };
    const getTabClassName = (tabName: AdminTab) => `py-2 px-4 font-medium text-sm rounded-t-lg transition-colors duration-200 focus:outline-none ${activeTab === tabName ? 'bg-white border-l border-t border-r border-gray-200 text-amber-700' : 'text-gray-500 hover:text-amber-600 hover:bg-gray-50'}`;
    const isAllUsersSelected = filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length;

    return (
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner w-full max-w-4xl mx-auto">
            {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdate={onUpdateProduct} />}
            {editingLocation && <EditLocationModal location={editingLocation} onClose={() => setEditingLocation(null)} onUpdate={onUpdateLocation} />}
            
            <div className="border-b border-gray-200"><nav className="-mb-px flex space-x-4"><button onClick={() => setActiveTab('users')} className={getTabClassName('users')}>Gebruikers</button><button onClick={() => setActiveTab('products')} className={getTabClassName('products')}>Producten</button><button onClick={() => setActiveTab('locations')} className={getTabClassName('locations')}>Locaties</button><button onClick={() => setActiveTab('tijd')} className={getTabClassName('tijd')}>Tijd</button></nav></div>
            
            <div className="bg-white p-6 rounded-b-lg border-l border-r border-b border-gray-200">
                {activeTab === 'users' && (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                            <h2 className="text-2xl font-bold text-amber-900">Gebruikersbeheer</h2>
                            <input type="text" placeholder="Zoek op naam of email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 w-full sm:w-64 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"/>
                        </div>
                        <div className="flex justify-end mb-4">
                            {selectedUserIds.length > 0 && ( <button onClick={handleDeleteSelectedUsersClick} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300">Verwijder {selectedUserIds.length} Gebruiker(s)</button> )}
                        </div>
                        {filteredUsers.length > 0 ? (
                            <ul className="space-y-3">
                                <li className="p-3 rounded-lg flex items-center bg-gray-100 border-b"><label className="flex items-center space-x-3 w-full"><input type="checkbox" checked={isAllUsersSelected} onChange={handleSelectAllUsersChange} className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500 border-gray-300" /><span className="font-semibold text-gray-600">Selecteer Alles (in resultaat)</span></label></li>
                                {filteredUsers.map(user => (
                                    <li key={user.id} className="p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between bg-purple-50 hover:bg-purple-100 transition-colors gap-4">
                                       <div className="flex items-center flex-grow w-full"><input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => handleUserSelectionChange(user.id)} className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500 border-gray-300 mr-4" /><div className="flex-grow"><p className="font-semibold text-gray-800">{user.full_name || <span className="italic text-gray-500">Naamloos</span>}</p><p className="text-sm text-gray-500 truncate" title={user.email || user.id}>{user.email || 'Geen email'}</p></div></div>
                                       <div className="flex-shrink-0 w-full sm:w-auto flex items-center space-x-4"><select value={user.role} onChange={(e) => onUpdateUserRole(user.id, e.target.value)} className="w-full px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm"><option value="gebruiker">Gebruiker</option><option value="beheerder">Beheerder</option></select><button onClick={() => handleDeleteUserClick(user.id, user.full_name || user.email || 'deze gebruiker')} className="text-gray-500 hover:text-red-600 font-medium text-sm p-1" title="Verwijder deze ene gebruiker">🗑️</button></div>
                                    </li>
                                ))}
                            </ul>
                        ) : ( <div className="text-center p-4"><p>{allUsers.length > 0 ? 'Geen gebruikers gevonden die voldoen aan de zoekopdracht.' : 'Geen gebruikers gevonden.'}</p></div> )}
                    </div>
                )}
                
                {activeTab === 'tijd' && (
                    <div>
                        <h2 className="text-2xl font-bold text-amber-900 mb-6">Tijdinstellingen</h2>
                        <TimeSettingsForm initialSettings={appSettings} onSave={onUpdateSettings} />
                    </div>
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    {activeTab === 'products' && (
                         <div>
                            <h2 className="text-2xl font-bold text-amber-900 mb-4">Productbeheer</h2>
                            <form onSubmit={handleAddProductSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-4"><div><label htmlFor="new-product-name" className="block text-sm font-medium text-gray-700">Nieuw Product</label><input id="new-product-name" type="text" value={newProduct.name} onChange={handleNewProductChange} placeholder="Naam van drankje" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" /></div><div><label className="block text-sm font-medium text-gray-700">Beschikbaar op</label><div className="mt-2 flex flex-wrap gap-2">{DAYS_OF_WEEK.map(day => (<label key={day.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-gray-300 has-[:checked]:bg-purple-100 has-[:checked]:border-purple-400 transition-colors"><input type="checkbox" value={day.value} checked={newProduct.available_on_days.includes(day.value)} onChange={() => handleNewProductDayChange(day.value)} className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300" /><span>{day.label}</span></label>))}</div></div><button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">Toevoegen</button></form>
                            <h3 className="text-lg font-semibold text-amber-800 mb-2">Bestaande Producten</h3>
                            {products.length > 0 ? (<SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}><ul className="space-y-2">{products.map(p => (<SortableListItem key={p.id} id={p.id}><div className="flex items-center justify-between w-full"><div className="flex-grow"><span className="text-gray-800 font-semibold">{p.name}</span><div className="text-xs text-gray-500 mt-1">{p.available_on_days && p.available_on_days.length > 0 ? p.available_on_days.map(dayNum => DAYS_OF_WEEK.find(d => d.value === dayNum)?.label).filter(Boolean).join(', ') : <span className="italic">Niet ingepland</span>}</div></div><div className="space-x-2"><button onClick={() => setEditingProduct(p)} className="text-blue-600 hover:text-blue-800 font-medium">Bewerk</button><button onClick={() => handleDeleteProductClick(p.id)} className="text-red-600 hover:text-red-800 font-medium">Verwijder</button></div></div></SortableListItem>))}</ul></SortableContext>) : <div className="text-center p-4 bg-purple-50 rounded-lg"><p className="text-gray-600">Geen producten gevonden.</p></div>}
                        </div>
                    )}
                    {activeTab === 'locations' && (
                        <div>
                            <h2 className="text-2xl font-bold text-amber-900 mb-4">Locatiebeheer</h2>
                            <form onSubmit={handleAddLocationSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end p-4 border rounded-lg bg-gray-50"><div className="md:col-span-2"><label htmlFor="new-loc-name" className="block text-sm font-medium text-gray-700">Naam</label><input id="new-loc-name" name="name" type="text" value={newLocation.name} onChange={handleLocationFormChange} placeholder="Kantoornaam" className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md"/></div><div><label htmlFor="new-loc-floor" className="block text-sm font-medium text-gray-700">Verdieping</label><input id="new-loc-floor" name="floor" type="number" value={newLocation.floor} onChange={handleLocationFormChange} className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md" /></div><div className="md:col-span-3"><label htmlFor="new-loc-desc" className="block text-sm font-medium text-gray-700">Omschrijving (optioneel)</label><input id="new-loc-desc" name="description" type="text" value={newLocation.description} onChange={handleLocationFormChange} placeholder="bv. 'Linker vleugel'" className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md" /></div><button type="submit" className="h-10 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 md:col-start-4">Toevoegen</button></form>
                            <h3 className="text-lg font-semibold text-amber-800 mb-2">Bestaande Locaties</h3>
                            {locations.length > 0 ? (<SortableContext items={locations.map(l => l.id)} strategy={verticalListSortingStrategy}><ul className="space-y-2">{locations.map(l => (<SortableListItem key={l.id} id={l.id}><div className="flex items-center justify-between w-full"><div className="flex-grow"><p className="font-semibold text-gray-800">{l.name} <span className="font-normal text-gray-600">(V{l.floor})</span></p><p className="text-sm text-gray-500">{l.description}</p></div><div className="space-x-2 flex-shrink-0 ml-4"><button onClick={() => setEditingLocation(l)} className="text-blue-600 hover:text-blue-800 font-medium">Bewerk</button><button onClick={() => handleDeleteLocationClick(l.id)} className="text-red-600 hover:text-red-800 font-medium">Verwijder</button></div></div></SortableListItem>))}</ul></SortableContext>) : <div className="text-center p-4 bg-purple-50 rounded-lg"><p className="text-gray-600">Geen locaties gevonden.</p></div>}
                        </div>
                    )}
                </DndContext>
            </div>
        </div>
    );
};

export default AdminPage;