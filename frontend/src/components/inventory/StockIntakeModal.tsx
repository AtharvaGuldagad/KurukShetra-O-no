import React, { useState, useEffect } from 'react';
import { 
  X, 
  PackagePlus, 
  AlertTriangle, 
  Check, 
  Loader2 
} from 'lucide-react';
import { 
  type Depot, 
  type InventoryItem, 
  type ResourceCategory 
} from '../../types/inventory';

interface StockIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  depots: Depot[];
  inventory: InventoryItem[];
  preselectedDepotId?: string;
  preselectedItemId?: string;
  preselectedItemName?: string;
  initialMode?: 'intake' | 'adjustment';
  onAddIntake: (data: {
    name: string;
    category: ResourceCategory;
    depotId: string;
    agency: string;
    quantity: number;
    unit: string;
    reportedBy: string;
    notes?: string;
  }) => Promise<void>;
  onAdjustStock: (data: {
    itemId: string;
    quantity: number;
    type: 'damaged' | 'lost' | 'expired';
    reportedBy: string;
    notes?: string;
  }) => Promise<void>;
}

export const StockIntakeModal: React.FC<StockIntakeModalProps> = ({
  isOpen,
  onClose,
  depots,
  inventory,
  preselectedDepotId,
  preselectedItemId,
  preselectedItemName,
  initialMode = 'intake',
  onAddIntake,
  onAdjustStock,
}) => {
  const [activeTab, setActiveTab] = useState<'intake' | 'adjustment'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Intake Form State
  const [intakeDepotId, setIntakeDepotId] = useState(preselectedDepotId || depots[0]?.id || '');
  const [intakeItemName, setIntakeItemName] = useState(preselectedItemName || '');
  const [intakeCategory, setIntakeCategory] = useState<ResourceCategory>('Food & Water');
  const [intakeQuantity, setIntakeQuantity] = useState<number>(500);
  const [intakeUnit, setIntakeUnit] = useState('Packs');
  const [intakeAgency, setIntakeAgency] = useState('World Central Kitchen');
  const [intakeReportedBy, setIntakeReportedBy] = useState('Logistics Officer');
  const [intakeNotes, setIntakeNotes] = useState('');

  // Adjustment Form State
  const [adjustItemId, setAdjustItemId] = useState(preselectedItemId || inventory[0]?.id || '');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'damaged' | 'lost' | 'expired'>('damaged');
  const [adjustReportedBy, setAdjustReportedBy] = useState('Field Inspector');
  const [adjustNotes, setAdjustNotes] = useState('');

  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (preselectedDepotId) setIntakeDepotId(preselectedDepotId);
    if (preselectedItemName) setIntakeItemName(preselectedItemName);
    if (preselectedItemId) {
      setAdjustItemId(preselectedItemId);
      setActiveTab('adjustment');
    }
  }, [preselectedDepotId, preselectedItemId, preselectedItemName, isOpen]);

  if (!isOpen) return null;

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeItemName.trim() || intakeQuantity <= 0) return;

    setLoading(true);
    try {
      await onAddIntake({
        name: intakeItemName.trim(),
        category: intakeCategory,
        depotId: intakeDepotId,
        agency: intakeAgency.trim() || 'Emergency Relief Agency',
        quantity: Number(intakeQuantity),
        unit: intakeUnit.trim() || 'Units',
        reportedBy: intakeReportedBy.trim() || 'Depot Manager',
        notes: intakeNotes.trim(),
      });
      setSuccessMessage(`Added ${intakeQuantity.toLocaleString()} ${intakeUnit} to inventory.`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItemId || adjustQuantity <= 0) return;

    setLoading(true);
    try {
      await onAdjustStock({
        itemId: adjustItemId,
        quantity: Number(adjustQuantity),
        type: adjustType,
        reportedBy: adjustReportedBy.trim() || 'Field Inspector',
        notes: adjustNotes.trim(),
      });
      setSuccessMessage(`Deducted ${adjustQuantity} items (${adjustType}).`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedItemForAdjustment = inventory.find((i) => i.id === adjustItemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-white">
            Manage Inventory
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-950/30 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('intake')}
              className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                activeTab === 'intake'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>New Supply Arrival</span>
            </button>
            <button
              onClick={() => setActiveTab('adjustment')}
              className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                activeTab === 'adjustment'
                  ? 'bg-rose-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Issue / Damage</span>
            </button>
          </div>
        </div>

        {successMessage ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">{successMessage}</div>
            <p className="text-xs text-slate-400">Inventory updated successfully.</p>
          </div>
        ) : activeTab === 'intake' ? (
          /* Intake Form */
          <form onSubmit={handleIntakeSubmit} className="p-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Destination Staging Depot
                </label>
                <select
                  value={intakeDepotId}
                  onChange={(e) => setIntakeDepotId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.status === 'compromised' ? '(⚠️ Blocked)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Category
                </label>
                <select
                  value={intakeCategory}
                  onChange={(e) => setIntakeCategory(e.target.value as ResourceCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Food & Water">Food & Water</option>
                  <option value="Medical">Medical</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Shelter & Rescue">Shelter & Gear</option>
                  <option value="Personnel">Personnel</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Item Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ready-to-Eat Food Packs (MRE)"
                value={intakeItemName}
                onChange={(e) => setIntakeItemName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={intakeQuantity}
                  onChange={(e) => setIntakeQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Unit (Packs, Boats, Kits)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Packs, Units"
                  value={intakeUnit}
                  onChange={(e) => setIntakeUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Agency / Source
                </label>
                <input
                  type="text"
                  placeholder="e.g. WFP, Red Cross, FEMA"
                  value={intakeAgency}
                  onChange={(e) => setIntakeAgency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Receiver / Officer
                </label>
                <input
                  type="text"
                  value={intakeReportedBy}
                  onChange={(e) => setIntakeReportedBy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Optional Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Convoy shipment from regional warehouse"
                value={intakeNotes}
                onChange={(e) => setIntakeNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Add to Stock</span>
              </button>
            </div>
          </form>
        ) : (
          /* Adjustment Form */
          <form onSubmit={handleAdjustSubmit} className="p-5 space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Select Item to Adjust
              </label>
              <select
                value={adjustItemId}
                onChange={(e) => setAdjustItemId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                required
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.depotName}) — {item.availableQuantity} {item.unit} available
                  </option>
                ))}
              </select>
            </div>

            {selectedItemForAdjustment && (
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400">Current Balance:</span>
                <span className="font-mono font-bold text-white">
                  {selectedItemForAdjustment.availableQuantity} {selectedItemForAdjustment.unit}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reason for Deduction
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="damaged">Damaged in Field / Flood</option>
                  <option value="lost">Lost in Transit</option>
                  <option value="expired">Expired / Contaminated</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Quantity to Deduct
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedItemForAdjustment?.availableQuantity || 9999}
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reporting Officer
                </label>
                <input
                  type="text"
                  value={adjustReportedBy}
                  onChange={(e) => setAdjustReportedBy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Incident / Damage Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hull punctured by flood debris"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Deduct Items</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
