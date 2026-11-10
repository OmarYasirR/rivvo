import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../services/notificationService';

export const fetchNotifications = createAsyncThunk('notification/fetchAll', async () => {
  return notificationService.getAll();
});

export const readNotification = createAsyncThunk('notification/read', async (id) => {
  await notificationService.markAsRead(id);
  return id;
});

const notificationSlice = createSlice({
  name: 'notification',
  initialState: { items: [], unreadCount: 0, status: 'idle' },
  reducers: {
    addNotification(state, action) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    resetNotifications() {
      return { items: [], unreadCount: 0, status: 'idle' };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(readNotification.fulfilled, (state, action) => {
        const notif = state.items.find((n) => n._id === action.payload);
        if (notif && !notif.read) {
          notif.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { addNotification, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
