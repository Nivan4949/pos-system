const axios = require('axios');

/**
 * WhatsApp Utility to send automated receipts
 * Supports UltraMsg and other generic WhatsApp API instances
 */
const whatsappUtil = {
  /**
   * Helper to format the API URL (ensures endpoint is included)
   */
  getFormattedURL: (apiURL) => {
    if (!apiURL) return null;
    let url = apiURL.trim();
    // UltraMsg typically uses /messages/chat for text messages
    if (!url.includes('/messages/chat') && url.includes('ultramsg.com')) {
      url = url.endsWith('/') ? `${url}messages/chat` : `${url}/messages/chat`;
    }
    return url;
  },

  /**
   * Send a formatted receipt to a customer
   * @param {Object} order - The created order object (with orderItems and product details)
   * @param {string} phone - The customer's 10-digit phone number
   */
  sendReceipt: async (order, phone) => {
    const apiURL = whatsappUtil.getFormattedURL(process.env.WHATSAPP_API_URL);
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!apiURL || !apiKey || !phone) {
      console.log('WhatsApp automation skipped: Missing API config or phone number.');
      return;
    }

    // Format phone: strip non-digits, take last 10, prefix 91
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = `91${cleanPhone}`;

    // Message logic
    const itemsText = order.orderItems?.map(item => {
      const name = item.product?.name || item.name || 'Product';
      return `• ${name} x ${item.quantity} = ₹${(item.total || 0).toFixed(2)}`;
    }).join('\n') || '';

    const message = `*TAX INVOICE FROM MODERN POS RETAIL*\n\n` +
                    `Invoice: *${order.invoiceNo}*\n` +
                    `Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}\n\n` +
                    `*ITEMS:*\n${itemsText}\n\n` +
                    `Subtotal: ₹${(order.subtotal || 0).toFixed(2)}\n` +
                    `Tax (GST): ₹${(order.taxTotal || 0).toFixed(2)}\n` +
                    `*Grand Total: ₹${(order.grandTotal || 0).toFixed(2)}*\n\n` +
                    `Thank you for shopping with us! 🙏\n` +
                    `_Digital Receipt via POS Pro_`;

    try {
      console.log(`[WhatsApp] Triggering automated message to ${formattedPhone} (Invoice: ${order.invoiceNo})`);
      
      // MANY automated WhatsApp APIs (like UltraMsg) require application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('token', apiKey);
      params.append('to', formattedPhone);
      params.append('body', message);

      const response = await axios.post(apiURL, params, { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000 
      });

      console.log(`[WhatsApp] API Response for ${formattedPhone}:`, JSON.stringify(response.data));
    } catch (error) {
      const errorData = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error(`[WhatsApp] API Failure for ${formattedPhone}:`, errorData);
    }
  },

  /**
   * Send a formatted credit note to a customer
   * @param {Object} salesReturn - The created sales return object
   * @param {string} phone - The customer's 10-digit phone number
   */
  sendReturnReceipt: async (salesReturn, phone) => {
    const apiURL = whatsappUtil.getFormattedURL(process.env.WHATSAPP_API_URL);
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!apiURL || !apiKey || !phone) return;

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = `91${cleanPhone}`;

    const itemsText = salesReturn.returnItems?.map(item => {
      const name = item.product?.name || 'Product';
      return `• ${name} x ${item.quantity} = ₹${(item.total || 0).toFixed(2)}`;
    }).join('\n') || '';

    const message = `*CREDIT NOTE / SALES RETURN*\n\n` +
                    `Return No: *${salesReturn.returnNo}*\n` +
                    `Status: *REFUNDED TO CREDIT BALANCE*\n` +
                    `Date: ${new Date(salesReturn.createdAt || Date.now()).toLocaleDateString()}\n\n` +
                    `*RETURNED ITEMS:*\n${itemsText}\n\n` +
                    `*Total Refund: ₹${(salesReturn.totalAmount || 0).toFixed(2)}*\n\n` +
                    `_Amount added to your digital wallet._\n` +
                    `POS Pro Services`;

    try {
      console.log(`[WhatsApp] Triggering automated Credit Note to ${formattedPhone} (ID: ${salesReturn.returnNo})`);
      
      const params = new URLSearchParams();
      params.append('token', apiKey);
      params.append('to', formattedPhone);
      params.append('body', message);

      const response = await axios.post(apiURL, params, { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000 
      });

      console.log(`[WhatsApp] API Response (Return) for ${formattedPhone}:`, JSON.stringify(response.data));
    } catch (error) {
       console.error(`[WhatsApp] API Failure (Return) for ${formattedPhone}:`, error.message);
    }
  }
};

module.exports = whatsappUtil;
