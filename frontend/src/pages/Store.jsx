import { useEffect, useState } from 'react';
import { Plus, X, Package, Trash2, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import api from '../api/client';

const categories = ['Food Stuffs', 'Learning Materials', 'Other'];
const emptyItemForm = { name: '', category: 'Food Stuffs', unit: 'pcs', quantity_in_stock: '', reorder_level: '', unit_price: '', supplier: '', notes: '' };
const emptyTxForm = { quantity: '', reason: '' };

export default function Store() {
  const [tab, setTab] = useState('inventory'); // 'inventory' | 'history'
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [itemError, setItemError] = useState('');

  const [txItem, setTxItem] = useState(null); // item being stocked in/out
  const [txType, setTxType] = useState('Stock In');
  const [txForm, setTxForm] = useState(emptyTxForm);
  const [txError, setTxError] = useState('');

  const loadItems = () => {
    api.get('/store/items', { params: categoryFilter ? { category: categoryFilter } : {} })
      .then((res) => setItems(res.data)).catch(() => {});
  };
  const loadTransactions = () => api.get('/store/transactions').then((res) => setTransactions(res.data)).catch(() => {});

  useEffect(() => { loadItems(); }, [categoryFilter]);
  useEffect(() => { loadTransactions(); }, []);

  const lowStockCount = items.filter((i) => i.low_stock).length;

  const handleAddItem = async (e) => {
    e.preventDefault();
    setItemError('');
    try {
      await api.post('/store/items', itemForm);
      setShowItemModal(false);
      setItemForm(emptyItemForm);
      loadItems();
    } catch (err) {
      setItemError(err.response?.data?.message || 'Could not add item.');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item and its history?')) return;
    try {
      await api.delete(`/store/items/${id}`);
      loadItems();
      loadTransactions();
    } catch {
      // stays listed if delete fails
    }
  };

  const openTx = (item, type) => {
    setTxItem(item);
    setTxType(type);
    setTxForm(emptyTxForm);
    setTxError('');
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    setTxError('');
    try {
      await api.post('/store/transactions', {
        item_id: txItem.id,
        type: txType,
        quantity: txForm.quantity,
        reason: txForm.reason,
      });
      setTxItem(null);
      loadItems();
      loadTransactions();
    } catch (err) {
      setTxError(err.response?.data?.message || 'Could not record transaction.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Package size={20} /> Store
          </h1>
          <p className="text-sm text-slate-500">
            {items.length} item{items.length === 1 ? '' : 's'}
            {lowStockCount > 0 && <span className="text-red-600 font-medium"> • {lowStockCount} low on stock</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('inventory')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'inventory' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Inventory
          </button>
          <button onClick={() => setTab('history')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'history' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            History
          </button>
        </div>
      </div>

      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setShowItemModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Add Item
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">In Stock</th>
                  <th className="px-4 py-3 font-medium">Reorder At</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {i.name}
                      {i.supplier && <p className="text-xs text-slate-400 font-normal">{i.supplier}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{i.category}</td>
                    <td className="px-4 py-3">
                      <span className={i.low_stock ? 'text-red-600 font-medium' : 'text-slate-700'}>
                        {Number(i.quantity_in_stock)} {i.unit}
                      </span>
                      {i.low_stock && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} /> Low
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{Number(i.reorder_level)} {i.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openTx(i, 'Stock In')} className="text-green-600 text-xs font-medium hover:underline flex items-center gap-1">
                          <ArrowDownToLine size={12} /> In
                        </button>
                        <button onClick={() => openTx(i, 'Stock Out')} className="text-amber-600 text-xs font-medium hover:underline flex items-center gap-1">
                          <ArrowUpFromLine size={12} /> Out
                        </button>
                        <button onClick={() => handleDeleteItem(i.id)} className="text-slate-300 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No items in the store yet.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{new Date(t.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{t.item_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${t.type === 'Stock In' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{Number(t.quantity)} {t.unit}</td>
                  <td className="px-4 py-3 text-slate-600">{t.reason || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{t.recorded_by_name || '—'}</td>
                </tr>
              ))}
              {!transactions.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No stock movements recorded yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowItemModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Item</h2>
            <form onSubmit={handleAddItem} className="space-y-3">
              <input required placeholder="Item Name (e.g. Rice, Exercise Books)" value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Unit (e.g. bags, pcs, kg, boxes)" value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" step="0.01" placeholder="Opening Quantity in Stock" value={itemForm.quantity_in_stock}
                onChange={(e) => setItemForm({ ...itemForm, quantity_in_stock: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" step="0.01" placeholder="Reorder Level (warn me when at or below this)" value={itemForm.reorder_level}
                onChange={(e) => setItemForm({ ...itemForm, reorder_level: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" step="0.01" placeholder="Unit Price in GHS (optional)" value={itemForm.unit_price}
                onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Supplier (optional)" value={itemForm.supplier}
                onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Notes (optional)" rows={2} value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {itemError && <p className="text-sm text-red-600">{itemError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Item
              </button>
            </form>
          </div>
        </div>
      )}

      {txItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 relative">
            <button onClick={() => setTxItem(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-1">{txType}</h2>
            <p className="text-sm text-slate-500 mb-4">
              {txItem.name} — currently {Number(txItem.quantity_in_stock)} {txItem.unit}
            </p>
            <form onSubmit={handleTransaction} className="space-y-3">
              <input required type="number" step="0.01" min="0.01" placeholder={`Quantity (${txItem.unit})`} value={txForm.quantity}
                onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder={txType === 'Stock In' ? 'Reason (e.g. Purchased from market)' : 'Reason (e.g. Used for boarding meals)'}
                value={txForm.reason}
                onChange={(e) => setTxForm({ ...txForm, reason: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {txError && <p className="text-sm text-red-600">{txError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Confirm {txType}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}