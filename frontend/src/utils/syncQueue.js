import { offlineDB } from './offlineDB';
import api from '../api/api';

const API_BASE_URL = '/api';

export const addToSyncQueue = async (action, data) => {
  await offlineDB.put('syncQueue', {
    action,
    data,
    timestamp: Date.now(),
  });
  processSyncQueue();
};

export const processSyncQueue = async () => {
  if (!navigator.onLine) return;

  const queue = await offlineDB.getAll('syncQueue');
  const orders = queue.filter(item => item.action === 'CREATE_ORDER');
  
  if (orders.length > 0) {
    try {
      const response = await api.post('/sync/orders', { 
        orders: orders.map(o => o.data) 
      });
      
      // Remove successfully synced orders from queue
      const syncedIds = orders
        .filter(o => response.data.synced.includes(o.data.invoiceNo))
        .map(o => o.id);

      for (const id of syncedIds) {
        await offlineDB.delete('syncQueue', id);
      }
      
      console.log('Bulk sync completed:', response.data.synced.length, 'orders');
    } catch (error) {
      console.error('Bulk sync failed:', error);
    }
  }

  // Handle other actions (Products, etc.) individually or in groups
  const otherItems = queue.filter(item => item.action !== 'CREATE_ORDER');
  for (const item of otherItems) {
    try {
      if (item.action === 'UPDATE_PRODUCT') {
        await api.put(`/products/${item.data.id}`, item.data);
      }
      await offlineDB.delete('syncQueue', item.id);
    } catch (error) {
      console.error('Individual sync failed for item:', item.id, error);
    }
  }
};

// Auto-sync when coming back online
window.addEventListener('online', processSyncQueue);
