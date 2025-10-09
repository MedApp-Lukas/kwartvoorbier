import React, { useState } from 'react';
// 1. UserProfile type importeren
import type { Product, Location, UserProfile } from '../types';

// 2. Props bijwerken met gebruikersbeheer-functionaliteit
interface AdminPageProps {
  products: Product[];
  locations: Location[];
  allUsers: UserProfile[]; // NIEUW
  onUpdateUserRole: (userId: string, newRole: string) => Promise<boolean>; // NIEUW
  onAddProduct: (name: string) => Promise<boolean>;
  onUpdateProduct: (id: number, name: string) => Promise<boolean>;
  onDeleteProduct: (id: number) => Promise<boolean>;
  onAddLocation: (location: Omit<Location, 'id'>) => Promise<boolean>;
  onUpdateLocation: (id: number, location: Omit<Location, 'id'>) => Promise<boolean>;
  onDeleteLocation: (id: number) => Promise<boolean>;
}

const EditProductModal: React.FC<{
    product: Product;
    onClose: () => void;
    onUpdate: (id: number, name: string) => Promise<boolean>;
}> = ({ product, onClose, onUpdate }) => {
    const [name, setName] = useState(product.name);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const success = await onUpdate(product.id, name);
        setIsSaving(false);
        if (success) {
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-amber-900 mb-4">Product Bewerken</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="edit-product-name" className="block text-sm font-medium text-gray-700">Naam</label>
                        <input
                            id="edit-product-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annuleren</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400">{isSaving ? 'Opslaan...' : 'Opslaan'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditLocationModal: React.FC<{
    location: Location;
    onClose: () => void;
    onUpdate: (id: number, location: Omit<Location, 'id'>) => Promise<boolean>;
}> = ({ location, onClose, onUpdate }) => {
    const [formState, setFormState] = useState({ name: location.name, floor: location.floor, description: location.description });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'floor' ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const success = await onUpdate(location.id, formState);
        setIsSaving(false);
        if (success) {
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-amber-900 mb-4">Locatie Bewerken</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-loc-name" className="block text-sm font-medium text-gray-700">Naam</label>
                        <input id="edit-loc-name" name="name" type="text" value={formState.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                    </div>
                     <div>
                        <label htmlFor="edit-loc-floor" className="block text-sm font-medium text-gray-700">Verdieping</label>
                        <input id="edit-loc-floor" name="floor" type="number" value={formState.floor} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                    </div>
                     <div>
                        <label htmlFor="edit-loc-desc" className="block text-sm font-medium text-gray-700">Omschrijving (optioneel)</label>
                        <input id="edit-loc-desc" name="description" type="text" value={formState.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annuleren</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400">{isSaving ? 'Opslaan...' : 'Opslaan'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminPage: React.FC<AdminPageProps> = (props) => {
    // 3. Nieuwe props uitpakken
    const { products, locations, allUsers, onUpdateUserRole, onAddProduct, onUpdateProduct, onDeleteProduct, onAddLocation, onUpdateLocation, onDeleteLocation } = props;
    
    // State for modals
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    
    // State for add forms
    const [newProductName, setNewProductName] = useState('');
    const [newLocation, setNewLocation] = useState({ name: '', floor: 0, description: ''});
    
    const handleAddProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProductName.trim()) return;
        const success = await onAddProduct(newProductName);
        if (success) setNewProductName('');
    };

    const handleAddLocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLocation.name.trim()) return;
        const success = await onAddLocation(newLocation);
        if (success) setNewLocation({ name: '', floor: 0, description: ''});
    };
    
    const handleLocationFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewLocation(prev => ({...prev, [name]: name === 'floor' ? parseInt(value) || 0 : value }));
    }

    const handleDeleteProductClick = (id: number) => {
        if (window.confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
            onDeleteProduct(id);
        }
    };

    const handleDeleteLocationClick = (id: number) => {
        if (window.confirm('Weet je zeker dat je deze locatie wilt verwijderen?')) {
            onDeleteLocation(id);
        }
    };

    return (
        <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-4xl mx-auto space-y-10">
            {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdate={onUpdateProduct} />}
            {editingLocation && <EditLocationModal location={editingLocation} onClose={() => setEditingLocation(null)} onUpdate={onUpdateLocation} />}
            
            {/* 4. Nieuwe sectie voor gebruikersbeheer */}
            <div>
                <h2 className="text-2xl font-bold text-amber-900 mb-4 border-b pb-2 border-purple-200">Gebruikersbeheer</h2>
                {allUsers.length > 0 ? (
                    <ul className="space-y-2">
                        {allUsers.map(user => (
                            <li key={user.id} className="p-3 rounded-lg flex items-center justify-between bg-purple-50">
                               <span className="text-gray-800 truncate" title={user.email || user.id}>{user.email || user.id}</span>
                               <div className="flex-shrink-0 ml-4">
                                   <select
                                       value={user.role}
                                       onChange={(e) => onUpdateUserRole(user.id, e.target.value)}
                                       className="px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                   >
                                       <option value="gebruiker">Gebruiker</option>
                                       <option value="beheerder">Beheerder</option>
                                   </select>
                               </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-gray-600">Geen gebruikers gevonden.</p>
                    </div>
                )}
            </div>

            {/* Products Section */}
            <div>
                <h2 className="text-2xl font-bold text-amber-900 mb-4 border-b pb-2 border-purple-200">Productbeheer</h2>
                <form onSubmit={handleAddProductSubmit} className="flex gap-3 mb-6 items-end">
                    <div className="flex-grow">
                       <label htmlFor="new-product-name" className="block text-sm font-medium text-gray-700">Nieuw Product</label>
                       <input id="new-product-name" type="text" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="Naam van drankje" className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
                    </div>
                    <button type="submit" className="h-10 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400">Toevoegen</button>
                </form>

                {products.length > 0 ? (
                    <ul className="space-y-2">
                        {products.map(p => (
                            <li key={p.id} className="p-3 rounded-lg flex items-center justify-between bg-purple-50">
                               <span className="text-gray-800">{p.name}</span>
                               <div className="space-x-2">
                                   <button onClick={() => setEditingProduct(p)} className="text-blue-600 hover:text-blue-800 font-medium">Bewerk</button>
                                   <button onClick={() => handleDeleteProductClick(p.id)} className="text-red-600 hover:text-red-800 font-medium">Verwijder</button>
                               </div>
                            </li>
                        ))}
                    </ul>
                ) : <div className="text-center p-4 bg-purple-50 rounded-lg"><p className="text-gray-600">Geen producten gevonden.</p></div>}
            </div>

            {/* Locations Section */}
            <div>
                <h2 className="text-2xl font-bold text-amber-900 mb-4 border-b pb-2 border-purple-200">Locatiebeheer</h2>
                <form onSubmit={handleAddLocationSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                    <div className="md:col-span-2">
                       <label htmlFor="new-loc-name" className="block text-sm font-medium text-gray-700">Naam</label>
                       <input id="new-loc-name" name="name" type="text" value={newLocation.name} onChange={handleLocationFormChange} placeholder="Kantoornaam" className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
                    </div>
                     <div>
                       <label htmlFor="new-loc-floor" className="block text-sm font-medium text-gray-700">Verdieping</label>
                       <input id="new-loc-floor" name="floor" type="number" value={newLocation.floor} onChange={handleLocationFormChange} className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div className="md:col-span-3">
                       <label htmlFor="new-loc-desc" className="block text-sm font-medium text-gray-700">Omschrijving (optioneel)</label>
                       <input id="new-loc-desc" name="description" type="text" value={newLocation.description} onChange={handleLocationFormChange} placeholder="bv. 'Linker vleugel'" className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <button type="submit" className="h-10 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 md:col-start-4">Toevoegen</button>
                </form>

                {locations.length > 0 ? (
                    <ul className="space-y-2">
                        {locations.map(l => (
                            <li key={l.id} className="p-3 rounded-lg flex items-center justify-between bg-purple-50">
                               <div>
                                   <p className="font-semibold text-gray-800">{l.name} <span className="font-normal text-gray-600">(V{l.floor})</span></p>
                                   <p className="text-sm text-gray-500">{l.description}</p>
                               </div>
                               <div className="space-x-2 flex-shrink-0 ml-4">
                                   <button onClick={() => setEditingLocation(l)} className="text-blue-600 hover:text-blue-800 font-medium">Bewerk</button>
                                   <button onClick={() => handleDeleteLocationClick(l.id)} className="text-red-600 hover:text-red-800 font-medium">Verwijder</button>
                               </div>
                            </li>
                        ))}
                    </ul>
                ) : <div className="text-center p-4 bg-amber-50 rounded-lg"><p className="text-gray-600">Geen locaties gevonden.</p></div>}
            </div>
        </div>
    );
};

export default AdminPage;
