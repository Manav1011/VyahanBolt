import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Building2, Plus, MapPin, X, Trash2 } from 'lucide-react';

export const Offices: React.FC = () => {
  const { offices, addOffice, deleteOffice, fetchAdminBranches, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newOffice, setNewOffice] = useState({ name: '', password: '' });

  React.useEffect(() => {
    console.log("Offices component mounted, checking user role...", currentUser?.role);
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      console.log("Triggering fetchAdminBranches...");
      fetchAdminBranches();
    }
  }, [currentUser, fetchAdminBranches]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addOffice(newOffice);
    setLoading(false);

    if (result.success) {
      setNewOffice({ name: '', password: '' });
      setShowForm(false);
    } else {
      alert(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this office?')) {
      setLoading(true);
      const result = await deleteOffice(id);
      setLoading(false);
      if (!result.success) alert(result.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800">Office Network</h2>
        <button
          disabled={loading}
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700 flex items-center shadow-sm border border-teal-700 disabled:opacity-50"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? 'Close' : 'Add Office'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">Register New Branch</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Office Name</label>
              <input
                placeholder="e.g. Westside Hub" required
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-teal-500 outline-none"
                value={newOffice.name} onChange={e => setNewOffice({ ...newOffice, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Manager Password</label>
              <input
                placeholder="Set password" required type="password"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-teal-500 outline-none"
                value={newOffice.password} onChange={e => setNewOffice({ ...newOffice, password: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-50">
              {loading ? 'Registering...' : 'Save Office'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offices.map(office => (
          <div key={office.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-200 transition-colors shadow-sm">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <Building2 className="w-6 h-6 text-slate-500" />
              </div>
              <button
                onClick={() => handleDelete(office.id)}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-bold text-xl mt-4 text-slate-900">{office.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};