import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import postService from '../services/postService';

// feedType: 'all' | 'following' | 'saved' (set by the page before it loads the first page)
export const fetchFeed = createAsyncThunk('post/fetchFeed', async (page = 1, { getState }) => {
  const feed = getState().post.feedType;
  return feed === 'saved' ? postService.getSaved(page) : postService.getFeed(page, feed);
});

export const fetchPost = createAsyncThunk('post/fetchPost', async (id) => postService.getById(id));

export const createPost = createAsyncThunk('post/createPost', async (data) => {
  return postService.create(data);
});

// the server's message is passed through rejectWithValue so the UI can show it (translated by the server)
const serverError = (e) => ({ message: e?.response?.data?.message || e?.message });

export const updatePost = createAsyncThunk('post/updatePost', async ({ id, caption }, { rejectWithValue }) => {
  try {
    return await postService.update(id, { caption });
  } catch (e) {
    return rejectWithValue(serverError(e));
  }
});

export const deletePost = createAsyncThunk('post/deletePost', async (id, { rejectWithValue }) => {
  try {
    await postService.remove(id);
    return id;
  } catch (e) {
    return rejectWithValue(serverError(e));
  }
});

export const toggleLike = createAsyncThunk('post/toggleLike', async ({ id, liked }) => {
  const result = liked ? await postService.unlike(id) : await postService.like(id);
  return { id, ...result };
});

// arg.saved = whether the post is saved right now (before the click)
export const toggleSave = createAsyncThunk('post/toggleSave', async ({ id, saved }) => {
  const result = saved ? await postService.unsave(id) : await postService.save(id);
  return { id, saved: result.saved };
});

const postSlice = createSlice({
  name: 'post',
  initialState: { items: [], status: 'idle', error: null, page: 1, hasMore: true, feedType: 'all' },
  reducers: {
    addComment(state, action) {
      const { postId, comment } = action.payload;
      const post = state.items.find((p) => p._id === postId);
      if (post) post.comments = [...(post.comments || []), comment];
    },
    setFeedType(state, action) {
      state.feedType = action.payload;
      state.items = [];
      state.page = 1;
      state.hasMore = true;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const incoming = action.payload || [];
        const page = action.meta?.arg ?? 1; // page number the thunk was called with
        state.items = page === 1 ? incoming : [...state.items, ...incoming];
        state.page = page;
        state.hasMore = incoming.length > 0;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchPost.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = [action.payload];
        state.hasMore = false;
      })
      .addCase(fetchPost.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const i = state.items.findIndex((p) => p._id === action.payload._id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const post = state.items.find((p) => p._id === action.payload.id);
        if (post) post.likes = action.payload.likes ?? post.likes;
      })
      // bookmark flips instantly and is rolled back if the request fails
      .addCase(toggleSave.pending, (state, action) => {
        const post = state.items.find((p) => p._id === action.meta.arg.id);
        if (post) post.isSaved = !action.meta.arg.saved;
      })
      .addCase(toggleSave.rejected, (state, action) => {
        const post = state.items.find((p) => p._id === action.meta.arg.id);
        if (post) post.isSaved = action.meta.arg.saved;
      })
      .addCase(toggleSave.fulfilled, (state, action) => {
        const { id, saved } = action.payload;
        const post = state.items.find((p) => p._id === id);
        if (post) post.isSaved = saved;
        if (state.feedType === 'saved' && !saved) state.items = state.items.filter((p) => p._id !== id);
      });
  },
});

export const { addComment, setFeedType } = postSlice.actions;
export default postSlice.reducer;
