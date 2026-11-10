import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import postReducer from './postSlice';
import chatReducer from './chatSlice';
import notificationReducer from './notificationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    post: postReducer,
    chat: chatReducer,
    notification: notificationReducer,
  },
});

export default store;
