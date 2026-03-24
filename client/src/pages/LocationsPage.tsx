import { useEffect, useState, type FormEvent } from 'react';
import api from '../utils/api.ts';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/locations/${editId}`, form);
      } else {
        await api.post('/locations', form);
      }
      setForm({ name: '', description: '' });
      setShowForm(false);
      setEditId(null);
      fetchLocations();
    } catch (err) {
      console.error('Failed to save location:', err);
    }
  };

  const handleEdit = (loc: Location) => {
    setEditId(loc.id);
    setForm({ name: loc.name, description: loc.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location?')) return;
    try {
      await api.delete(`/locations/${id}`);
      fetchLocations();
    } catch (err) {
      console.error('Failed to delete location:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-septenary/10">
            <MapPin size={24} className="text-septenary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Locations</h1>
            <p className="text-tertiary mt-1">{locations.length} locations</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', description: '' }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-senary text-white text-sm font-medium hover:bg-senary/90 transition-colors"
        >
          <Plus size={16} />
          New Location
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-quaternary/50 p-6 mb-6">
          <h3 className="text-lg font-semibold text-primary mb-4">
            {editId ? 'Edit Location' : 'New Location'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Location name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 rounded-lg bg-senary text-white text-sm font-medium hover:bg-senary/90">
              {editId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="px-4 py-2 rounded-lg bg-quaternary/30 text-tertiary text-sm font-medium hover:bg-quaternary/50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {locations.length === 0 ? (
        <div className="bg-white rounded-xl border border-quaternary/50 p-12 text-center">
          <MapPin size={48} className="mx-auto text-quaternary mb-4" />
          <p className="text-tertiary">No locations yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-xl border border-quaternary/50 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-septenary/10">
                    <MapPin size={16} className="text-septenary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary">{loc.name}</h3>
                    {loc.description && (
                      <p className="text-xs text-tertiary mt-0.5">{loc.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(loc)}
                    className="p-1.5 rounded-lg hover:bg-quinary transition-colors text-tertiary hover:text-senary"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="p-1.5 rounded-lg hover:bg-quinary transition-colors text-tertiary hover:text-denary"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
