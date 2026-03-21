import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Printer } from 'lucide-react';
import axios from 'axios';
import api from '../api/api';
import { Product } from '../types';
import JsBarcode from 'jsbarcode';

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: '',
      barcode: '',
      purchasePrice: 0,
      sellingPrice: 0,
      gstRate: 18,
      stockQuantity: 0,
      unit: 'pcs',
    }
  );
  
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && formData.barcode) {
      JsBarcode(barcodeRef.current, formData.barcode, {
        format: "CODE128",
        width: 1.5,
        height: 40,
        displayValue: true,
        margin: 0,
        fontSize: 14
      });
    }
  }, [formData.barcode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (product?.id) {
        await api.put(`/products/${product.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      onSave();
    } catch (error: any) {
      console.error('Error saving product:', error);
      const message = error.response?.data?.error || 'Failed to save product';
      alert(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  value={formData.barcode || ''}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.post('/products/generate-barcode');
                      setFormData(prev => ({ ...prev, barcode: res.data.barcode }));
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                  className="px-4 bg-slate-100 text-slate-600 rounded-lg whitespace-nowrap hover:bg-slate-200 font-bold transition-colors"
                >
                  Generate
                </button>
              </div>
              {formData.barcode && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center flex flex-col items-center">
                  <svg ref={barcodeRef} className="max-w-full"></svg>
                  <button type="button" onClick={() => {
                        const printWindow = window.open('', '_blank');
                        const svgHtml = barcodeRef.current?.outerHTML || '';
                        printWindow?.document.write(`
                          <html>
                            <head><title>Print Barcode Label</title>
                            <style>
                              @page { margin: 0; size: 2in 1in; }
                              body { margin: 0; padding:0; display:flex; flex-direction:column; align-items:center; justify-content:center; width:2in; height:1in; font-family:sans-serif;}
                              .label { text-align:center; padding-top: 5px; width: 100%; box-sizing: border-box; }
                              .name { font-size: 11px; font-weight: bold; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px; }
                              .price { font-size: 11px; margin-top: 2px; font-weight: bold; }
                              svg { width: 90%; max-height: 40px; }
                            </style>
                            </head>
                            <body>
                              <div class="label">
                                <div class="name">${formData.name || 'Product'}</div>
                                ${svgHtml}
                                <div class="price">Rs. ${formData.sellingPrice || 0}</div>
                              </div>
                              <script>window.print(); setTimeout(() => window.close(), 500);</script>
                            </body>
                          </html>
                        `);
                        printWindow?.document.close();
                  }} className="mt-3 flex items-center justify-center gap-1 w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-bold transition-colors"><Printer size={16}/> Print Thermal Label</button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ltr">Liters (ltr)</option>
                <option value="box">Boxes (box)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price *</label>
              <input
                required
                type="number"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GST Rate (%)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Opening Stock</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <Save size={18} />
              <span>Save Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
