import React, { useState } from 'react';
import { X, CheckCircle2, QrCode, CreditCard, Banknote } from 'lucide-react';
import NumericKeypad from '../components/NumericKeypad';

interface PaymentModalProps {
  total: number;
  onPaymentComplete: (method: string, amount: string) => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, onPaymentComplete, onClose }) => {
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const handleKeypadInput = (val: string) => {
    setAmountPaid((prev) => (prev === '0' ? val : prev + val));
  };

  const handleKeypadDelete = () => {
    setAmountPaid((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleKeypadClear = () => {
    setAmountPaid('0');
  };

  const change = parseFloat(amountPaid) - total;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in zoom-in-95 duration-200">
        {/* Payment Selection */}
        <div className="w-full md:w-1/2 p-8 flex flex-col gap-6 bg-slate-50 border-r border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-extrabold text-slate-800">Complete Payment</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={24} className="text-slate-500" />
            </button>
          </div>

          <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <p className="text-blue-100 font-medium mb-1">Total Amount Due</p>
            <p className="text-5xl font-black">₹{total.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                paymentMethod === 'CASH' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300 text-slate-500'
              }`}
            >
              <Banknote size={32} />
              <span className="font-bold">CASH</span>
            </button>
            <button
              onClick={() => setPaymentMethod('UPI')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                paymentMethod === 'UPI' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300 text-slate-500'
              }`}
            >
              <QrCode size={32} />
              <span className="font-bold">UPI QR</span>
            </button>
            <button
              onClick={() => setPaymentMethod('CARD')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300 text-slate-500'
              }`}
            >
              <CreditCard size={32} />
              <span className="font-bold">CARD</span>
            </button>
            <div className="p-4 bg-slate-900 rounded-xl text-white flex flex-col justify-center">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Amount Paid</p>
              <p className="text-2xl font-black">₹{amountPaid}</p>
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div className={`mt-auto p-4 rounded-xl flex justify-between items-center ${change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
              <span className="font-bold text-lg uppercase">Change Return</span>
              <span className="text-2xl font-black">₹{Math.max(0, change).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Input Method */}
        <div className="w-full md:w-1/2 p-8 bg-slate-800 flex flex-col justify-center gap-4">
           {paymentMethod === 'UPI' ? (
             <div className="flex flex-col items-center justify-center h-full text-white text-center">
                <div className="bg-white p-4 rounded-3xl mb-6 shadow-xl">
                   <QrCode size={200} className="text-slate-900" />
                </div>
                <p className="text-xl font-bold mb-2">Scan to Pay ₹{total.toFixed(2)}</p>
                <p className="text-slate-400 text-sm">Waiting for payment confirmation...</p>
                <div className="mt-8 flex gap-2">
                   <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                   <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
             </div>
           ) : (
             <NumericKeypad 
               onInput={handleKeypadInput}
               onDelete={handleKeypadDelete}
               onClear={handleKeypadClear}
               onConfirm={() => parseFloat(amountPaid) >= total && onPaymentComplete(paymentMethod, amountPaid)}
             />
           )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
