import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import messageService from "../services/messageService";

const serverError = (e) => ({
  message: e?.response?.data?.message || e?.message,
});

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  () => messageService.getConversations(),
);

export const openConversation = createAsyncThunk(
  "chat/openConversation",
  async (userId, { rejectWithValue }) => {
    try {
      return await messageService.startConversation(userId);
    } catch (e) {
      return rejectWithValue(serverError(e));
    }
  },
);

// { conversationId, before? } -> first page, or an older page when `before` is given
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ conversationId, before }) => {
    const { messages, hasMore } = await messageService.getMessages(
      conversationId,
      { before },
    );
    return { conversationId, messages, hasMore, older: Boolean(before) };
  },
);

// arg: { conversationId, text, attachment, tempId, myId }. The bubble appears instantly (pending) and is
// replaced by the server's message; if the request fails it stays, marked failed, with a Retry button.
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ conversationId, text, attachment }, { rejectWithValue }) => {
    try {
      return await messageService.sendMessage(conversationId, {
        text,
        attachment,
      });
    } catch (e) {
      return rejectWithValue(serverError(e));
    }
  },
);

export const markConversationRead = createAsyncThunk(
  "chat/markRead",
  async (conversationId) => {
    await messageService.markRead(conversationId);
    return conversationId;
  },
);

export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async ({ messageId }, { rejectWithValue }) => {
    try {
      return await messageService.deleteMessage(messageId); // { id, conversationId }
    } catch (e) {
      return rejectWithValue(serverError(e));
    }
  },
);

export const selectTotalUnread = (state) =>
  (state.chat?.conversations || []).reduce(
    (n, c) => n + (c.unreadCount || 0),
    0,
  );

const brief = (m) => ({
  _id: m._id,
  sender: m.sender,
  text: m.text,
  attachment: m.attachment,
  deleted: Boolean(m.deleted),
  createdAt: m.createdAt,
});

// set the conversation's preview to `message` and move it to the top of the list
function bump(state, conversationId, message) {
  const i = state.conversations.findIndex((c) => c._id === conversationId);
  if (i === -1) return null;
  const [conv] = state.conversations.splice(i, 1);
  conv.lastMessage = brief(message);
  conv.updatedAt = message.createdAt;
  state.conversations.unshift(conv);
  return conv;
}

function applyDeleted(state, conversationId, messageId) {
  const m = (state.messagesByConversation[conversationId] || []).find(
    (x) => x._id === messageId,
  );
  if (m) {
    m.deleted = true;
    m.text = "";
    m.attachment = "";
  }
  const conv = state.conversations.find((c) => c._id === conversationId);
  if (conv && conv.lastMessage && conv.lastMessage._id === messageId) {
    conv.lastMessage.deleted = true;
    conv.lastMessage.text = "";
    conv.lastMessage.attachment = "";
  }
}

const initialState = {
  conversations: [],
  status: "idle",
  activeConversationId: null,
  messagesByConversation: {},
  hasMoreByConversation: {},
  typingUsers: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload || null;
      const conv = state.conversations.find((c) => c._id === action.payload);
      if (conv) conv.unreadCount = 0; // opening a chat clears its badge right away
    },
    // payload: { message, myId, viewing } where viewing = this chat is open and the tab is visible
    receiveMessage(state, action) {
      const { message, myId, viewing } = action.payload;
      const cid = String(message.conversation);
      const list = state.messagesByConversation[cid];
      if (list && !list.some((m) => m._id === message._id)) {
        // my own message echoing back over the socket replaces its pending bubble instead of duplicating it
        const pending =
          String(message.sender) === String(myId)
            ? list.findIndex(
                (m) =>
                  m.pending &&
                  m.text === message.text &&
                  (m.attachment || "") === (message.attachment || ""),
              )
            : -1;
        if (pending !== -1) list[pending] = message;
        else list.push(message);
      }
      const conv = bump(state, cid, message);
      if (conv && String(message.sender) !== String(myId) && !viewing)
        conv.unreadCount = (conv.unreadCount || 0) + 1;
    },
    // someone read this conversation: stamp them onto the messages (drives the "seen" ticks)
    messageRead(state, action) {
      const { conversationId, userId } = action.payload;
      (state.messagesByConversation[conversationId] || []).forEach((m) => {
        if (!(m.readBy || []).map(String).includes(String(userId)))
          m.readBy = [...(m.readBy || []), userId];
      });
    },
    messageDeleted(state, action) {
      applyDeleted(
        state,
        action.payload.conversationId,
        action.payload.messageId,
      );
    },
    setTyping(state, action) {
      const { conversationId, userId, isTyping } = action.payload;
      state.typingUsers[conversationId] = isTyping ? userId : null;
    },
    resetChat() {
      return initialState; // on logout: never show the previous account's chats
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        if (state.conversations.length === 0) state.status = "loading";
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchConversations.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(openConversation.fulfilled, (state, action) => {
        const i = state.conversations.findIndex(
          (c) => c._id === action.payload._id,
        );
        if (i === -1) state.conversations.unshift(action.payload);
        else
          state.conversations[i] = {
            ...state.conversations[i],
            ...action.payload,
          };
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const {
          conversationId,
          messages = [],
          hasMore = false,
          older,
        } = action.payload || {};
        const existing = state.messagesByConversation[conversationId] || [];
        const incoming = Array.isArray(messages) ? messages : [];

        if (older) {
          const have = new Set(existing.map((m) => m._id));
          state.messagesByConversation[conversationId] = [
            ...incoming.filter((m) => !have.has(m._id)),
            ...existing,
          ];
        } else {
          const local = existing.filter((m) => m.pending || m.failed);
          state.messagesByConversation[conversationId] = [
            ...incoming,
            ...local,
          ];
        }
        state.hasMoreByConversation[conversationId] = hasMore;
      })
      .addCase(sendMessage.pending, (state, action) => {
        const { conversationId, text, attachment, tempId, myId } =
          action.meta.arg;
        const list =
          state.messagesByConversation[conversationId] ||
          (state.messagesByConversation[conversationId] = []);
        const existing = list.find((m) => m._id === tempId);
        if (existing) {
          existing.pending = true;
          existing.failed = false;
          return;
        }
        const temp = {
          _id: tempId,
          conversation: conversationId,
          sender: myId,
          text: (text || "").trim(),
          attachment: attachment || "",
          createdAt: new Date().toISOString(),
          readBy: [myId],
          pending: true,
        };
        list.push(temp);
        bump(state, conversationId, temp);
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, tempId } = action.meta.arg;
        const rest = (
          state.messagesByConversation[conversationId] || []
        ).filter((m) => m._id !== tempId);
        if (!rest.some((m) => m._id === action.payload._id))
          rest.push(action.payload); // the socket echo may have added it already
        state.messagesByConversation[conversationId] = rest;
        bump(state, conversationId, action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        const { conversationId, tempId } = action.meta.arg;
        const m = (state.messagesByConversation[conversationId] || []).find(
          (x) => x._id === tempId,
        );
        if (m) {
          m.pending = false;
          m.failed = true;
        }
      })
      .addCase(markConversationRead.fulfilled, (state, action) => {
        const conv = state.conversations.find((c) => c._id === action.payload);
        if (conv) conv.unreadCount = 0;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        applyDeleted(state, action.payload.conversationId, action.payload.id);
      });
  },
});

export const {
  setActiveConversation,
  receiveMessage,
  messageRead,
  messageDeleted,
  setTyping,
  resetChat,
} = chatSlice.actions;
export default chatSlice.reducer;
