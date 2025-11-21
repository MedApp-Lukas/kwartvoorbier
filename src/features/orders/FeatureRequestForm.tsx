import React, { useState } from 'react';
import { ViewMode } from '../../types'; // Nodig om de knop te labelen

interface FeatureRequestFormProps {
  onFormSubmit: (title: string, description: string) => Promise<void>;
  onCancel: () => void;
}

const FeatureRequestForm: React.FC<FeatureRequestFormProps> = ({ onFormSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
        setIsSubmitting(true);
        try {
            await onFormSubmit(title.trim(), description.trim());
            setIsSubmitted(true); // Succesvol ingediend
        } catch (error) {
            // Fout al afgehandeld in App.tsx (met alert), hier doen we niets
        } finally {
            setIsSubmitting(false);
        }
    }
  };
  
  if (isSubmitted) {
      return (
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <h2 className="text-3xl font-bold text-green-600 mb-4">Bedankt!</h2>
              <p className="text-gray-700 text-lg">Je feature request is ontvangen.</p>
              <p className="text-5xl mt-6">💡</p>
              <button
                  onClick={onCancel} // onCancel stuurt de gebruiker terug naar de ORDER view
                  className="mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                  Ga naar Bestellen 
              </button>
          </div>
      );
  }

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Feature Request Indienen</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="feature-title" className="block text-sm font-medium text-gray-700">Titel</label>
          <input
            id="feature-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Korte samenvatting van het idee"
            required
            maxLength={100}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="feature-description" className="block text-sm font-medium text-gray-700">Beschrijving</label>
          <textarea
            id="feature-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschrijf je feature-idee in detail"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
        </div>
        <div className="flex justify-between space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            disabled={isSubmitting}
          >
            Annuleren
          </button>
          <button
            type="submit"
            className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 transition-colors"
            disabled={!title.trim() || !description.trim() || isSubmitting}
          >
            {isSubmitting ? 'Versturen...' : 'Versturen'} 
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeatureRequestForm;