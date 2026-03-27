const axios = require('axios');

/**
 * WhatsApp Utility to send automated receipts
 * Supports UltraMsg and other generic WhatsApp API instances
 */
const whatsappUtil = {
  /**
   * Send a formatted receipt to a customer
   * @param {Object} order - The created order object (with orderItems and product details)
   * @param {string} phone - The customer's 10-digit phone number
   */
  sendReceipt: async (order, phone) => {
    const apiURL = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!apiURL || !apiKey || !phone) {
      console.log('WhatsApp automation skipped: Missing API config or phone number.');
      return;
    }

    // Format phone to 91XXXXXXXXXX
    const formattedPhone = `91${phone.replace(/\D/g, '').slice(-10)}`;

    const itemsText = order.orderItems?.map(item => {
      const name = item.product?.name || 'Product';
      return `• ${name} x ${item.quantity} = ₹${item.total.toFixed(2)}`;
    }).join('\n') || '';

    const message = `*TAX INVOICE FROM MODERN POS RETAIL*\n\n` +
                    `Invoice: *${order.invoiceNo}*\n` +
                    `Date: ${new Date(order.createdAt).toLocaleDateString()}\n\n` +
                    `*ITEMS:*\n${itemsText}\n\n` +
                    `Subtotal: ₹${order.subtotal.toFixed(2)}\n` +
                    `Tax (GST): ₹${order.taxTotal.toFixed(2)}\n` +
                    `*Grand Total: ₹${order.grandTotal.toFixed(2)}*\n\n` +
                    `Thank you for shopping with us! 🙏\n` +
                    `_Digital Receipt via POS Pro_`;

    try {
      // Logic for UltraMsg (Generic format: url?token=KEY&to=PHONE&body=TEXT)
      // If using a different provider, this can be adjusted.
      await axios.post(apiURL, {
        token: apiKey,
        to: formattedPhone,
        body: message
      });
      console.log(`WhatsApp receipt sent successfully to ${formattedPhone}`);
    } catch (error) {
      console.error('WhatsApp API Error:', error.response?.data || error.message);
    }
  }
};

module.exports = whatsappUtil;
